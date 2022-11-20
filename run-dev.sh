#!/bin/bash

podman build -t chopsuey:latest -f Dockerfile
envsubst < chopsuey-pod.templ.yaml | podman play kube --build --replace -


