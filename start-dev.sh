#!/bin/bash

caddy stop
XDG_DATA_HOME=./caddy_data XDG_CONFIG_HOME=./caddy_config caddy start --config Caddyfile-dev

(rm -rf src/public/assets && rm src/public/booking-*.html && cd frontend && npm install && npm run build)
rm -rf dist/ && \
tsc && \
cp -R src/public dist/ && \
cp -R src/views dist/ && \
npm start
