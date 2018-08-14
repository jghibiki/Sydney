# Sydney

A simple dashboard for monitoring application pipelines. Allows for arbitrary user-defined states. Allows for arbitrary transitions between nodes based on state changes.

Current State:
- Renders pipeline in client
- REST API for notifying the application of the state of a job/node in the pipeline.
- Update client rendered pipeline when backend state changes
- Track pipeline state in backend
- Allows for the definition of multiple separate pipelines
- Clicking on a node in the pipeline will display user-defined information about that node/job - i.e. a description, useful links, etc.
- (Optional) Configurable browser notifications when any node or a list of nodes enter one or more states 

Planned Features:
