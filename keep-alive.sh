#!/bin/bash
cd /home/z/my-project
while true; do
  # Check if next is running
  if ! pgrep -f "next dev" > /dev/null 2>&1; then
    echo "$(date): Starting next dev server..."
    npx next dev -p 3000 > dev.log 2>&1 &
    NEXT_PID=$!
    echo "$(date): Started with PID $NEXT_PID"
  fi
  sleep 5
  # Keep alive with a request
  curl -s --max-time 3 http://localhost:3000 > /dev/null 2>&1
  sleep 10
done
