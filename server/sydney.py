import os

from flask import Flask, render_template, request
from flask_socketio import SocketIO
from flask_pymongo import PyMongo

import bson.json_util  as json

import datetime

from utils import load


host = os.getenv("SYDNEY_MONGO_HOST", "localhost")
port = os.getenv("SYDNEY_MONGO_PORT", "27017")
db_user = os.getenv("SYDNEY_MONGO_USER", None)
db_pass = os.getenv("SYDNEY_MONGO_PASSWORD", None)
auth_db = os.getenv("SYDNEY_MONGO_AUTH_DB", None)

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'

if db_user is None or db_pass is None:
    app.config["MONGO_URI"] = f"mongodb://{host}:{port}/{auth_db}"
else:
    app.config["MONGO_URI"] = f"mongodb://{db_user}:{db_pass}@{host}:{port}/{auth_db}?authMechanism=SCRAM-SHA-1"

mongo = PyMongo(app)
socketio = SocketIO(app)

EXIT_STATES = [
    "__QUIT__",
    "__FINISHED__"
]

pipelines = load()


@socketio.on('connect')
def on_connect():
    socketio.emit('send_pipelines', json.dumps(pipelines))

    history = list(mongo.db.history.find().sort("timestamp", -1).limit(200))

    socketio.emit("send_history", json.dumps(history))


## ROUTES

@app.route('/pipelines')
def get_pipelines():
    return json.dumps(pipelines)

@app.route('/state/<step>')
def get_state(step):

    step = get_step(step)
    if not step: return "Invalid step"

    return step["state"]


@app.route('/notify/<environment>/<pipeline>/<step>/<state>')
def notify_state_change(environment, pipeline, step, state):

    env = get_environment(environment)
    if not env: return "Invalid environment"

    pipeline = get_pipeline(env, pipeline)
    if not pipeline: return "Invalid pipeline"

    state = get_state(state)
    if not state: return "Invalid state"

    step = get_step(pipeline, step)
    if not step: return "Invalid step"


    step["state"] = state["name"]

    step["exit_state"] = request.args.get("exit_state", None)

    state_change = {
        "environment": env["name"],
        "pipeline": pipeline["name"],
        "step": step["name"],
        "state": state["name"],
        "exit_state": step["exit_state"],
        "timestamp": str(datetime.datetime.utcnow())
    }

    socketio.emit("notify_state_change", json.dumps(state_change))

    mongo.db.history.insert_one(state_change)

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

def get_pipeline(env, pipeline_name):
    for pipeline in env["pipelines"]:
        if pipeline["name"] == pipeline_name:
            return pipeline
    return None

def get_environment(env_name):
    for environment in pipelines["environments"]:
        if environment["name"] == env_name:
            return environment
    return None


if __name__ == '__main__':

    socketio.run(app)
