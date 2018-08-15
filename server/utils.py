import commentjson as json
import os

def load():
    pipeline_defs = {}

    with open("../schema.json", "r") as f:
        schema = json.load(f)

    pipeline_defs["states"] = schema["states"]
    pipeline_defs["root_hash"] = schema["root_hash"]
    pipeline_defs["notifications"] = schema["notifications"]

    pipeline_defs["pipelines"] = []

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

            pipeline_defs["pipelines"].append(pipeline)

    print("Loaded data", pipeline_defs)
    return pipeline_defs





