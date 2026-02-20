#!/bin/bash
set -euo pipefail

echo "Starting OpenClaw Gateway..."
mkdir -p /home/agent/.openclaw /home/agent/workspace

cp /opt/boxed-lobster/openclaw.json /home/agent/.openclaw/openclaw.json

OPENCLAW_PASSWORD="${OPENCLAW_PASSWORD:-1234}"
OPENCLAW_MODEL_PRIMARY="${OPENCLAW_MODEL_PRIMARY:-google/gemini-1.5-pro-latest}"

sed -i "s|__OPENCLAW_PASSWORD__|${OPENCLAW_PASSWORD}|g" /home/agent/.openclaw/openclaw.json
sed -i "s|__OPENCLAW_MODEL_PRIMARY__|${OPENCLAW_MODEL_PRIMARY}|g" /home/agent/.openclaw/openclaw.json

if [ -z "${GOOGLE_API_KEY:-}" ] && [ -z "${GEMINI_API_KEY:-}" ]; then
  echo "WARNING: Neither GOOGLE_API_KEY nor GEMINI_API_KEY is set. Model requests will fail."
fi

touch /tmp/openclaw.log
exec openclaw gateway --port 18789 --allow-unconfigured --verbose 2>&1 | tee /tmp/openclaw.log
