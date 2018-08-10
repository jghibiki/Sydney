from flask import Flask, render_template
from flask_socketio import SocketIO

import json

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)

with open("../schema.json", "r") as f:
    pipelines = json.load(f)

@socketio.on('connect')
def on_connect():
    socketio.emit('send_pipelines', {'pipelines': json.dumps(pipelines)})

if __name__ == '__main__':
    socketio.run(app)
