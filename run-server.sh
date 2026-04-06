#!/bin/bash
cd /home/z/my-project

start_server() {
  PORT=3000 node .next/standalone/server.js &
  echo $!
}

# Main loop
while true; do
  PID=$(start_server)
  echo "$(date): Started server PID=$PID"
  
  # Wait for server to die or keep it alive
  while kill -0 $PID 2>/dev/null; do
    sleep 3
    # Ping to keep alive
    curl -s --max-time 2 http://localhost:3000/ > /dev/null 2>&1
  done
  
  echo "$(date): Server died, restarting in 2s..."
  sleep 2
done
