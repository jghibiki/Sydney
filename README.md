# Sydney

A simple dashboard for monitoring application pipelines. Allows for arbitrary user-defined states. Allows for arbitrary transitions between nodes based on state changes.

Current State:
- Renders pipeline in client

Planned Features:
- REST API for notifying the application of the state of a job/node in the pipeline.
- Track pipeline state in backend
- Update client rendered pipeline when backend state changes
- Clicking on a node in the pipeline will display user-defined information about that node/job - i.e. a description, useful links, etc.
- Allow for the definition of multiple separate pipelines
- (Optional) Configurable browser notifications when any node or a list of nodes enter one or more states or transitions to a system defined ```__FINISHED__```(Indicates the pipeline completed successfully) or ```__QUIT_```(Indicates thre pipeline did not complete successfully) state.
