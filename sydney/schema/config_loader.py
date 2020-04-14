from pathlib import Path

from sydney.schema.config_schemas import config_schema, pipeline_schema


class SydneyConfigLoader:
    def __init__(self, config, pipelines):
        self.config_path = Path(config)
        self.pipelines_path = Path(pipelines)

    def read_config(self):
        with self.config_path.open() as f:
            config_str = f.read()

        return config_schema.loads(config_str)

    def read_pipelines(self):
        for pipeline in self.pipelines_path.glob("**/*.json"):
            print(f"Loading pipeline file {pipeline}")
            with pipeline.open() as f:
                pipeline_str = f.read()
            yield pipeline_schema.loads(pipeline_str)
