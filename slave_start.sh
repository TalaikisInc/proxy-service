#!/bin/bash

APP=$1
PORT=$2

docker run -it -p "$PORT:3000" \
  --restart always \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /root/.aws:/root/.aws \
  --name "$APP" \
  -d "$APP" 
