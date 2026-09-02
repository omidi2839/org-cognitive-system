#!/bin/sh
cd "$(dirname "$0")"
node local-server.js &
sleep 2
open http://localhost:3000
