#!/bin/bash

rm -rf dist/ && \
tsc && \
cp -R src/public dist/ && \
cp -R src/views dist/ && \
npm start