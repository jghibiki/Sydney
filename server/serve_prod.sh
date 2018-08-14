
gunicorn -k "geventwebsocket.gunicorn.workers.GeventWebSocketWorker" sydney:app --bind "0.0.0.0:5000"
