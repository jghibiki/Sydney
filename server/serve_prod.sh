#!/bin/bash

SYDNEY_HOST=${SYDNEY_HOST:-"0.0.0.0"}
SYDNEY_PORT=${SYDNEY_PORT:-"5000"}

gunicorn -k "geventwebsocket.gunicorn.workers.GeventWebSocketWorker" sydney:app --bind "$SYDNEY_HOST:$SYDNEY_PORT"
