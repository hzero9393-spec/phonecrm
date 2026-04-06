#!/bin/bash
cd /home/z/my-project
while true; do
  PORT=3000 node .next/standalone/server.js > prod.log 2>&1 &
  PID=$!
  echo "$(date): Started PID=$PID"
  while kill -0 $PID 2>/dev/null; do
    sleep 3
    curl -s --max-time 2 http://localhost:3000/ > /dev/null 2>&1 || break
  done
  echo "$(date): Died, restarting..."
  sleep 2
done
