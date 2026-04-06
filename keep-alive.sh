#!/bin/bash
cd /home/z/my-project
while true; do
  if ! pgrep -f "server.js" > /dev/null 2>&1; then
    echo "$(date): Production server died, restarting..."
    PORT=3000 NODE_OPTIONS="--max-old-space-size=512" nohup node .next/standalone/server.js > prod.log 2>&1 &
    echo "$(date): Started PID $!"
  fi
  curl -s --max-time 3 http://localhost:3000 > /dev/null 2>&1
  sleep 8
done
