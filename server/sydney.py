from flask import Flask, render_template, request
from flask_socketio import SocketIO

import commentjson as json

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)

EXIT_STATES = [
    "__QUIT__",
    "__FINISHED__"
]

with open("../schema.json", "r") as f:
    pipelines = json.load(f)

for step in pipelines["steps"]:
    step["state"] = step["initial_state"]
    step["exit_state"] = None

@socketio.on('connect')
def on_connect():
    socketio.emit('send_pipelines', {'pipelines': json.dumps(pipelines)})

## ROUTES

@app.route('/pipelines')
def get_pipelines():
    return json.dumps(pipelines)

@app.route('/state/<step>')
def get_state(step):

    step = get_step(step)
    if not step: return "Invalid step"

    return step["state"]


@app.route('/notify/<step>/<state>')
def notify_state_change(step, state):

    state = get_state(state)
    if not state: return "Invalid state"

    step = get_step(step)
    if not step: return "Invalid step"


    step["state"] = state["name"]

    step["exit_state"] = request.args.get("exit_state", None)

    socketio.emit("notify_state_change", json.dumps({
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

def get_step(step_name):
    for step in pipelines["steps"]:
        if step["name"] == step_name:
            return step
    return None


if __name__ == '__main__':
    socketio.run(app)
