#!/bin/bash
set -e

echo "Starting OpenClaw Gateway..."

# Ensure the .openclaw directory exists
mkdir -p /root/.openclaw

# Start the OpenClaw Gateway
# We use 'tail -f /dev/null' to keep the container running if the gateway backgrounds itself, 
# but usually 'openclaw gateway' runs in formatting. 
# Adjust flags as needed based on specific requirements (e.g., --verbose).
touch /var/log/openclaw.log
openclaw gateway --port 18789 --allow-unconfigured --verbose > /var/log/openclaw.log 2>&1 &
tail -f /var/log/openclaw.log
