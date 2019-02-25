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
auth_db = os.getenv("SYDNEY_MONGO_AUTH_DB", "sydney")

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

    history = list(mongo.db.history.find().sort("timestamp", -1).limit(500))

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

@app.route('/message/<environment>/<pipeline>/<step>', methods=["POST"])
def send_message(environment, pipeline, step):
    data = request.json

    if data is None:
        return f"Invalid data: {data}"

    message = data.get("message")

    if message is None or message == "":
        return "Invalid message: message cannot be none or empty"


    env = get_environment(environment)
    if not env: return "Invalid environment"

    pipeline = get_pipeline(env, pipeline)
    if not pipeline: return "Invalid pipeline"

    step = get_step(pipeline, step)
    if not step: return "Invalid step"

    log_level = request.args.get("log_level", "info")

    message_data = {
        "type": "message",
        "environment": env["name"],
        "pipeline": pipeline["name"],
        "step": step["name"],
        "message": message,
        "level": log_level,
        "timestamp": str(datetime.datetime.utcnow())
    }

    socketio.emit("notify_message", json.dumps(message_data))

    mongo.db.history.insert_one(message_data)

    return "Submitted message."




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
        "type": "state_update",
        "environment": env["name"],
        "pipeline": pipeline["name"],
        "step": step["name"],
        "state": state["name"],
        "exit_state": step["exit_state"],
        "timestamp": str(datetime.datetime.utcnow())
    }

    socketio.emit("notify_state_change", json.dumps(state_change))

    mongo.db.history.insert_one(state_change)

    # check to see if parent is a summary node, if so update parent state
    if "parent" in pipeline:
        parent_pipeline, parent = get_parent(env, pipeline["parent"], pipeline["name"])
        if(parent is not None and
            "info" in parent and
            "summary" in parent["info"] and
            parent["info"]["summary"]):

            # get state of all chidren of parent node
            child_states = get_child_states(env, parent["info"]["child_pipeline"])

            if child_states:
                if pipelines["failure_state"] in child_states:
                    # set parent to new state
                    if pipelines["failure_state"] != parent["state"]:
                        notify_state_change(env["name"], parent_pipeline, parent["name"], pipelines["failure_state"])


                else:
                    #pick most common state
                    new_state = max(child_states, key=child_states.count)
                    if new_state != parent["state"]:
                        notify_state_change(env["name"], parent_pipeline, parent["name"], new_state)


    return "Updated {0} to state {1}".format(step["name"], state["name"])

@app.route('/reset/<environment>/<pipeline>/<state>')
def reset_pipeline(environment, pipeline, state):

    env = get_environment(environment)
    if not env: return "Invalid environment"

    pipeline = get_pipeline(env, pipeline)
    if not pipeline: return "Invalid pipeline"

    state = get_state(state)
    if not state: return "Invalid state"


    for step in pipeline["steps"]:

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

    return "Updated pipeline {0} steps to state {1}".format(pipeline["name"], state["name"])


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
        if environment["name"].lower() == env_name.lower():
            return environment
    return None

def get_parent(env, parent_name, child_name):

    raw_parent = parent_name[1:len(parent_name)]
    child_name = "#"+child_name

    parent_pipeline = None

    for pipeline in env["pipelines"]:
        if pipeline["name"] == raw_parent:
            parent_pipeline = pipeline
            break

    parents = []
    for step in parent_pipeline["steps"]:
        if ("info" in step and "child_pipeline" in step["info"]):
            if step["info"]["child_pipeline"] == child_name:
                return parent_pipeline["name"], step

    return None, None

def get_child_states(env, pipeline_name):

    pipeline_name = pipeline_name[1:len(pipeline_name)]

    child_pipeline = None

    for pipeline in env["pipelines"]:
        if pipeline["name"] == pipeline_name:
            child_pipeline = pipeline
            break

    if not child_pipeline: return None

    states = [ step["state"] for step in pipeline["steps"] ]
    return states



if __name__ == '__main__':

    socketio.run(app)
