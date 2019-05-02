#!/bin/bash

APP=proxy_service
PORT=3003

docker run -it -p "$PORT:3000" \
  --restart always \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /root/.aws:/root/.aws \
  --name "$APP" \
  -d "$APP" 
