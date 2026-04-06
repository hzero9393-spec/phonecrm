#!/bin/bash
# This script ensures PhoneCRM NEVER goes down
cd /home/z/my-project

while true; do
  # Check if PM2 is running phonecrm
  RUNNING=$(npx pm2 pid phonecrm 2>/dev/null)
  
  if [ -z "$RUNNING" ] || [ "$RUNNING" = "0" ]; then
    echo "$(date): PM2 not running, restarting..."
    npx pm2 resurrect 2>/dev/null || \
    npx pm2 start .next/standalone/server.js \
      --name "phonecrm" \
      --node-args="--max-old-space-size=512" \
      --max-memory-restart 400M \
      --restart-delay 2000 \
      --max-restarts 9999 2>/dev/null
    echo "$(date): Restarted"
  fi
  
  # Keep alive ping
  curl -s --max-time 2 http://localhost:3000 > /dev/null 2>&1
  
  sleep 5
done
