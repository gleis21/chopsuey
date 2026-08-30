#!/bin/bash

# podman build -t chopsuey:latest -f Dockerfile
# envsubst < chopsuey-pod.templ.yaml | podman play kube --build --replace -


XDG_DATA_HOME=./caddy_data XDG_CONFIG_HOME=./caddy_config caddy run --config Caddyfile-dev

