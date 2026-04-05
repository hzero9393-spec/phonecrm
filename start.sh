#!/bin/bash
# Start PhoneCRM dev server
cd /home/z/my-project
rm -rf .next
exec npx next dev -p 3000
