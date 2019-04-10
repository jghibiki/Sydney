import json
import os

def load():
    pipeline_defs = {}

    with open("../schema.json", "r") as f:
        schema = json.load(f)

    pipeline_defs["states"] = schema["states"]
    pipeline_defs["failure_state"] = schema["failure_state"]
    pipeline_defs["pending_state"] = schema["pending_state"]
    pipeline_defs["success_state"] = schema["success_state"]
    pipeline_defs["root_hash"] = schema["root_hash"]
    pipeline_defs["notifications"] = schema["notifications"]

    pipeline_defs["environments"] = []

    for env in schema["environments"]:
        env = {
            "name": env,
            "pipelines": []
        }

        for file_name in schema["pipelines"]:
            file_name = os.path.join("../pipelines", file_name)

            print(f"Attempting to load file: {file_name}")

            if os.path.exists(file_name) and os.path.isfile(file_name):
                print(f"File \"{file_name}\" exists")
                with open(file_name, "r") as f:
                    pipeline = json.load(f)

                for step in pipeline["steps"]:
                    step["state"] = step["initial_state"]
                    step["exit_state"] = None

                env["pipelines"].append(pipeline)
        pipeline_defs["environments"].append(env)


    # make child piplines aware of their parents
    for env in pipeline_defs["environments"]:
        for pipeline in env["pipelines"]:
            for step in pipeline["steps"]:
                if "info" in step :
                    if "child_pipeline" in step["info"]:
                        for potential_child in env["pipelines"]:
                            if "#" + potential_child["name"] == step["info"]["child_pipeline"]:
                                potential_child["parent"] = "#" + pipeline["name"]
                                break

    print("Loaded data", pipeline_defs)
    return pipeline_defs





