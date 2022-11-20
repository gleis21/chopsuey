#!/bin/bash

envsubst < chopsuey-pod.templ.yaml | podman play kube --build --replace -


