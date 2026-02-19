#!/bin/bash
set -euo pipefail

echo "Starting OpenClaw Gateway..."
mkdir -p /home/agent/.openclaw /home/agent/workspace

if [ ! -f /home/agent/.openclaw/openclaw.json ]; then
  cp /opt/boxed-lobster/openclaw.json /home/agent/.openclaw/openclaw.json
fi

OPENCLAW_PASSWORD="${OPENCLAW_PASSWORD:-1234}"
sed -i "s/__OPENCLAW_PASSWORD__/${OPENCLAW_PASSWORD}/g" /home/agent/.openclaw/openclaw.json

touch /tmp/openclaw.log
exec openclaw gateway --port 18789 --allow-unconfigured --verbose 2>&1 | tee /tmp/openclaw.log
