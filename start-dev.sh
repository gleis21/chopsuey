#!/bin/bash

caddy stop
XDG_DATA_HOME=./caddy_data XDG_CONFIG_HOME=./caddy_config caddy start --config Caddyfile-dev

rm -rf dist/ && \
tsc && \
cp -R src/public dist/ && \
cp -R src/views dist/ && \
npm start