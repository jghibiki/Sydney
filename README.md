# Sydney

A simple dashboard for monitoring application pipelines. Allows for arbitrary user-defined states. Allows for arbitrary transitions between nodes based on state changes.

## Installation/Getting Started
0. Required software:
  - A mongodb instance
  - Python 3.6+
  - Nodejs and Yarn
1. Change directory into the server directory. Run `pip install -r requirements.txt` to install python dependencies
2. In another terminal, change directory into the client directory. Run `yarn install` to install javascript dependencies.
3. In the server terminal, run `./serve_dev.sh` to start the python server
4. In the client terminal, run `yarn start` to start the javascript client.
5. To run the demo, in a third terminal change directory to the repo root, and run `python demo.py` and watch the client.

To configure the pipelines edit the `schema.json` file and add/remove/edit pipeline definitions in the `pipeline` directory. 


## Current State:
- Renders pipeline in client
- REST API for notifying the application of the state of a job/node in the pipeline.
- Update client rendered pipeline when backend state changes
- Track pipeline state in backend
- Allows for the definition of multiple separate pipelines
- Clicking on a node in the pipeline will display user-defined information about that node/job - i.e. a description, useful links, etc.
- (Optional) Configurable browser notifications when any node or a list of nodes enter one or more states 

## Planned Features:
