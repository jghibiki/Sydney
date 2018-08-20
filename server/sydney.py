from flask import Flask, render_template, request
from flask_socketio import SocketIO

import json

from utils import load

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)

EXIT_STATES = [
    "__QUIT__",
    "__FINISHED__"
]

pipelines = load()


@socketio.on('connect')
def on_connect():
    socketio.emit('send_pipelines', json.dumps(pipelines))

## ROUTES

@app.route('/pipelines')
def get_pipelines():
    return json.dumps(pipelines)

@app.route('/state/<step>')
def get_state(step):

    step = get_step(step)
    if not step: return "Invalid step"

    return step["state"]


@app.route('/notify/<pipeline>/<step>/<state>')
def notify_state_change(pipeline, step, state):

    pipeline = get_pipeline(pipeline)

    state = get_state(state)
    if not state: return "Invalid state"

    step = get_step(pipeline, step)
    if not step: return "Invalid step"


    step["state"] = state["name"]

    step["exit_state"] = request.args.get("exit_state", None)

    socketio.emit("notify_state_change", json.dumps({
        "pipeline": pipeline["name"],
        "step": step["name"],
        "state": state["name"],
        "exit_state": step["exit_state"]
    }))

    return "Updated {0} to state {1}".format(step["name"], state["name"])


# HELPERS

def get_state(state_name):
    for state in pipelines["states"]:
        if state["name"] == state_name:
            return state
    return None

def get_step(pipeline, step_name):
    for step in pipeline["steps"]:
        if step["name"] == step_name:
            return step
    return None

def get_pipeline(pipeline_name):
    for pipeline in pipelines["pipelines"]:
        if pipeline["name"] == pipeline_name:
            return pipeline
    return None


if __name__ == '__main__':
    socketio.run(app)
