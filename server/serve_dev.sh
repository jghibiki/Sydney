#!/bin/bash

SYDNEY_HOST=${SYDNEY_HOST:-"localhost"}
SYDNEY_PORT=${SYDNEY_PORT:-"5000"}

FLASK_APP=sydney.py flask run -h $SYDNEY_HOST -p $SYDNEY_PORT
