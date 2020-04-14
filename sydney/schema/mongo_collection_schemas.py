from marshmallow import Schema, fields

from sydney.schema.config_schemas import StateSchema, ProcessStepSchema, EdgeSchema

## Schemas for Mongo Collections


class ConfigSchema(Schema):
    """
    Schema for the sydney_config mongo collection
    """

    states = fields.List(fields.Nested(StateSchema))

    failure_state = fields.Str()
    success_state = fields.Str()
    pending_state = fields.Str()
    running_state = fields.Str()

    environments = fields.List(fields.Str())

    root_pipeline = fields.Str()
    default_environment = fields.Str()


config_collection_schema = ConfigSchema()


class PipelineStateSchema(Schema):
    name = fields.Str()
    steps = fields.Nested(ProcessStepSchema)
    edges = fields.Nested(EdgeSchema)


pipeline_state_schema = PipelineStateSchema()


class SydneyTopologySchema(Schema):

    environment = fields.Str()
    pipelines = fields.List(fields.Nested(PipelineStateSchema))
