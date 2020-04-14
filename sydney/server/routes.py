from aiohttp import web
import json
from datetime import datetime
from sydney import constants
from sydney.server.route_adapter import route_adapter


def register_routes():
    @route_adapter.get("/health")
    async def health_check(app, request):
        return {"message": "ok"}

    @route_adapter.get("/config")
    async def get_config(app, request):
        col = app["mongo_helper"].get_collection(constants.config_collection)
        config = await col.find_one()
        del config["_id"]
        return config

    @route_adapter.get("/pipeline/{env_name}/{pipeline_name}")
    async def get_pipeline(app, request):

        if "env_name" not in request["url_params"]:
            raise Exception("Failed to parse env_name url param")
        env_name = request["url_params"]["env_name"]

        if "pipeline_name" not in request["url_params"]:
            raise Exception("Failed to parse pipeline_name url param")
        pipeline_name = request["url_params"]["pipeline_name"]

        col = app["mongo_helper"].get_collection(constants.pipelines_collection)
        pipeline = await col.find_one({"environment": env_name, "name": pipeline_name})

        if pipeline:
            del pipeline["_id"]

        return pipeline

    @route_adapter.post("/pipeline/{env_name}/{pipeline_name}/{step_name}/{state}")
    async def set_step_state(app, request):
        # TODO: update summary nodes too

        if "env_name" not in request["url_params"]:
            raise Exception("Failed to parse env_name url param")
        env_name = request["url_params"]["env_name"]

        if "pipeline_name" not in request["url_params"]:
            raise Exception("Failed to parse pipeline_name url param")
        pipeline_name = request["url_params"]["pipeline_name"]

        if "step_name" not in request["url_params"]:
            raise Exception("Failed to parse step_name url param")
        step_name = request["url_params"]["step_name"]

        if "state" not in request["url_params"]:
            raise Exception("Failed to parse state url param")
        state = request["url_params"]["state"]

        col = app["mongo_helper"].get_collection(constants.pipelines_collection)
        pipeline = await col.find_one({"environment": env_name, "name": pipeline_name})

        made_update = False

        for step in pipeline["steps"]:
            if step["name"] == step_name:
                step["state"] = state
                made_update = True
                break

        if not made_update:
            raise Exception(
                f"Step {env_name}/{pipeline_name}/{step_name} not found. No update applied"
            )

        await col.replace_one({"_id": pipeline["_id"]}, pipeline)

        for ws in app["websockets"]:
            await ws.send_str(
                json.dumps(
                    {
                        "type": "update_step",
                        "env": env_name,
                        "pipeline": pipeline_name,
                        "step": step_name,
                        "state": state,
                    }
                )
            )

        return {
            "env": env_name,
            "pipeline": pipeline_name,
            "step": step_name,
            "state": state,
        }

    @route_adapter.post("/pipeline/reset/{env_name}/{pipeline_name}")
    async def reset_pipeline(app, request):
        # TODO: update summary nodes too

        if "env_name" not in request["url_params"]:
            raise Exception("Failed to parse env_name url param")
        env_name = request["url_params"]["env_name"]

        if "pipeline_name" not in request["url_params"]:
            raise Exception("Failed to parse pipeline_name url param")
        pipeline_name = request["url_params"]["pipeline_name"]

        pipelines_col = app["mongo_helper"].get_collection(
            constants.pipelines_collection
        )
        history_col = app["mongo_helper"].get_collection(constants.history_collection)
        pipeline = await pipelines_col.find_one(
            {"environment": env_name, "name": pipeline_name}
        )

        step_updates = []

        for step in pipeline["steps"]:
            step["state"] = step["initial_state"]

            step_updates.append({"name": step["name"], "state": step["initial_state"]})

        await pipelines_col.replace_one({"_id": pipeline["_id"]}, pipeline)

        history_update = {
            "type": "pipeline_reset",
            "env": env_name,
            "pipeline": pipeline,
            "timestamp": datetime.utcnow(),
        }
        scrubbed_history_update = scrub_datetimes(history_update)
        await history_col.insert_one(history_update)

        for ws in app["websockets"]:
            await ws.send_str(
                json.dumps(
                    {
                        "type": "update_pipeline",
                        "env": env_name,
                        "pipeline": pipeline_name,
                        "steps": step_updates,
                    }
                )
            )

            await ws.send_str(json.dumps(scrubbed_history_update))

        return {"env": env_name, "pipeline": pipeline_name, "steps": step_updates}

    @route_adapter.post("/message/{env_name}/{pipeline_name}/{step_name}/{log_level}")
    async def set_step_state(app, request):
        if "message" not in request["data"]:
            raise Exception("Invalid message: message cannot be none or empty")
        message = request["data"]["message"]

        if "env_name" not in request["url_params"]:
            raise Exception("Failed to parse env_name url param")
        env_name = request["url_params"]["env_name"]

        if "pipeline_name" not in request["url_params"]:
            raise Exception("Failed to parse pipeline_name url param")
        pipeline_name = request["url_params"]["pipeline_name"]

        if "step_name" not in request["url_params"]:
            raise Exception("Failed to parse step_name url param")
        step_name = request["url_params"]["step_name"]

        if "log_level" not in request["url_params"]:
            raise Exception("Failed to parse log_level url param")
        log_level = request["url_params"]["log_level"].lower()

        if log_level not in ["debug", "info", "warn", "error"]:
            raise Exception(
                'Log level must be one of "debug", "info", "warn", "error".'
            )

        log_col = app["mongo_helper"].get_collection("log")

        message_data = {
            "type": "message",
            "environment": env_name,
            "pipeline": pipeline_name,
            "step": step_name,
            "message": message,
            "level": log_level,
            "timestamp": datetime.utcnow(),
        }

        scrubbed_message = scrub_datetimes(message_data)
        for ws in app["websockets"]:
            await ws.send_str(json.dumps(scrubbed_message))

        await log_col.insert_one(message_data)

        return scrubbed_message


def scrub_datetimes(payload):
    new_payload = {}
    for key, val in payload.items():
        if isinstance(val, datetime):
            new_payload[key] = val.strftime("%Y-%m-%dT%H:%M:%S")
        else:
            new_payload[key] = val

    return new_payload
