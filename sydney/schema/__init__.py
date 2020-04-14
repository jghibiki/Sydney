import asyncio

import motor.motor_asyncio
from datetime import timedelta

from sydney import constants
from sydney.schema.mongo_collection_schemas import config_collection_schema

from sydney.utils.singleton import Singleton


class SydneySchemaHelper(metaclass=Singleton):
    def __init__(self, mongo_client, schema_details):
        self.mongo_helper = mongo_client

        self.sydney_schema = schema_details

        self.sydney_config_collection = self.mongo_helper.get_collection(
            constants.config_collection
        )
        self.sydney_pipeline_collection = self.mongo_helper.get_collection(
            constants.pipelines_collection
        )

        self.config = None

    def validate(self):
        print("Validating config")
        self.sydney_schema.read_config()

        print("Validating Pipelines")
        for pipeline in self.sydney_schema.read_pipelines():
            pass

    def init(self):

        if self._schema_exists():
            print("Sydney has already been initialized. Aborting!")
            return

        self._persist_config()
        self._persist_pipelines()
        self._create_indexes()

    def update(self):
        if not self._schema_exists():
            print("Sydney has not been initialized before. Try initializing instead.")
            return
        self._drop_old_collections()
        self._persist_config()
        self._persist_pipelines()

    def uninit(self):
        self.mongo_helper.connect()
        collection_names = self.mongo_helper.run_query(
            self.mongo_helper.db.list_collection_names()
        )

        for name in collection_names:
            self.mongo_helper.run_query(self.mongo_helper.db.drop_collection(name))

    def _schema_exists(self):
        """
        if we are able to find any records in "sydney_config" we should stop the init
        right now because the db has already been initialized.
        """
        result = self.mongo_helper.run_query(self.sydney_config_collection.find_one())

        return result is not None

    def _persist_config(self):
        config = self.sydney_schema.read_config()

        sydney_config = config_collection_schema.load(
            {
                "states": config["states"],
                "failure_state": config["failure_state"],
                "pending_state": config["pending_state"],
                "success_state": config["success_state"],
                "running_state": config["running_state"],
                "environments": config["environments"],
                "root_pipeline": config["root_pipeline"],
                "default_environment": config["default_environment"],
            }
        )
        self.config = sydney_config

        self.mongo_helper.run_query(
            self.sydney_config_collection.insert_one(sydney_config)
        )

    def _persist_pipelines(self):
        # generate environment
        environments = {k: [] for k in self.config["environments"]}

        for pipeline_config in self.sydney_schema.read_pipelines():
            print(f"Loading Pipeline {pipeline_config['name']}")
            for env in environments.keys():

                associated_envs = pipeline_config.get("associated_environments")
                if associated_envs and env not in associated_envs:
                    continue

                steps = []

                for step_config in pipeline_config["steps"]:
                    step = {
                        "pipeline": pipeline_config["name"],
                        "name": step_config["name"],
                        "state": step_config[
                            "initial_state"
                        ],  # todo validate initial step is valid
                        "initial_state": step_config["initial_state"],
                        "info": step_config.get("info"),
                        "application": step_config["application"],
                        "child_pipeline": step_config["child_pipeline"],
                        "instancing_type": step_config["instancing_type"],
                    }

                    steps.append(step)

                pipeline = {
                    "environment": env,
                    "name": pipeline_config["name"],
                    "steps": steps,
                    "edges": pipeline_config["edges"],
                }

                # insert steps
                self.mongo_helper.run_query(
                    self.sydney_pipeline_collection.insert_one(pipeline)
                )

    def _create_indexes(self):

        self.mongo_helper.run_query(
            self.mongo_helper.get_collection(constants.log_collection).create_index(
                "timestamp", expireAfterSeconds=timedelta(days=7).seconds
            )
        )

        self.mongo_helper.run_query(
            self.mongo_helper.get_collection(constants.history_collection).create_index(
                "timestamp", expireAfterSeconds=timedelta(days=7).seconds
            )
        )

    def _drop_old_collections(self):
        pass
