#!/bin/bash

echo "===== RUNNING =====" && \
  docker run --rm -ti \
    --name parse-irc \
    -v "$PWD":/code \
    -v "/tmp/irc-ubuntu":/data \
    node \
    bash
