from marshmallow import Schema, fields, pprint


class StateSchema(Schema):
    name = fields.Str()
    color = fields.Str()


state_schema = StateSchema()


class ConfigSchema(Schema):
    states = fields.List(fields.Nested(StateSchema))

    failure_state = fields.Str()
    success_state = fields.Str()
    pending_state = fields.Str()
    running_state = fields.Str()

    environments = fields.List(fields.Str())

    root_pipeline = fields.Str()
    default_environment = fields.Str()


config_schema = ConfigSchema()


class LinkSchema(Schema):
    name = fields.Str()
    url = fields.Str()


link_schema = LinkSchema()


class MetadataSchema(Schema):
    description = fields.Str()
    links = fields.List(fields.Nested(LinkSchema))


class ApplicationSchema(Schema):
    job_type = fields.Str()
    job_icon_path = fields.Str()
    initial_state = fields.Str()
    info = fields.Nested(MetadataSchema)


application_schema = ApplicationSchema()


class ProcessStepSchema(Schema):
    name = fields.Str()
    initial_state = fields.Str()
    info = fields.Nested(MetadataSchema)
    application = fields.Nested(ApplicationSchema, required=False, missing=None)
    child_pipeline = fields.Str(missing=None, required=False)


process_step_schema = ProcessStepSchema()


class TransitionSchema(Schema):
    state = fields.Str()
    go_to = fields.Str()


transition_schema = TransitionSchema()


class EdgeSchema(Schema):
    step = fields.Str()
    transitions = fields.List(fields.Nested(TransitionSchema))


edge_schema = EdgeSchema()


class PipelineSchema(Schema):
    name = fields.Str()
    steps = fields.Nested(ProcessStepSchema, many=True)
    edges = fields.Nested(EdgeSchema, many=True)

    associated_environments = fields.List(fields.Str(), missing=None, required=False)


pipeline_schema = PipelineSchema()
