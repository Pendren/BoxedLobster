# Boxed Lobster (OpenClaw) Container + Local Session Manager

Boxed Lobster now includes two layers:

1. **Agent image**: a hardened Docker image that runs one OpenClaw gateway per container.
2. **Control plane web app**: a local web service where you can spawn/stop agent containers on demand and open each gateway from your browser.

This is a local proof-of-concept for the architecture you described: users visit a website, spawn an OpenClaw agent instance, then interact with it via browser UI.

## Architecture

- `Dockerfile` + `entrypoint.sh` build the isolated agent runtime.
- `src/server.js` serves a small web UI and calls Docker to create/remove agent sessions.
- `public/` contains the browser UI.
- `config/openclaw.json` keeps the default model on Gemini (`google/gemini-1.5-pro-latest`).

## Security posture (local phase)

Each spawned agent session is launched with defense-in-depth defaults:

- `--cap-drop=ALL`
- `--security-opt no-new-privileges:true`
- `--pids-limit 256`
- CPU and memory limits (`--cpus 1.5`, `--memory 2g`)
- Read-only root filesystem (`--read-only`)
- `tmpfs` mounts for runtime writable paths
- A dedicated Docker named volume per session at `/home/agent/workspace`

This keeps agent file operations scoped to container-managed storage. No host directory bind mounts are used for agent workspace.

## Prerequisites

- Docker installed and running.
- Node.js 22+ (for the local control plane process).
- `GOOGLE_API_KEY` (current default provider in OpenClaw config).

## Setup

```bash
cp .env.example .env
```

Edit `.env` with your real keys and settings.

## Build agent image

```bash
docker build -t boxed-lobster .
```

## Start local control plane

```bash
set -a; source .env; set +a
npm start
```

Open `http://localhost:3000` and click **Spawn agent session**.

Each session shows:

- Gateway WebSocket URL (for clients)
- Gateway HTTP URL (for browser-based UI)
- Password (defaults to `OPENCLAW_PASSWORD`)
- TTL/expiration

## API endpoints

- `GET /health`
- `GET /api/sessions`
- `POST /api/sessions`
- `DELETE /api/sessions/:sessionId`

## Future roadmap alignment

This layout supports your next phase goals:

- Add auth/multi-tenant policies in control plane before spawn.
- Add stricter network policy per session container.
- Swap Gemini with local models by changing OpenClaw model provider config and attaching local inference container(s) (for example Ollama) on an isolated Docker network.

## Environment variables

See `.env.example`.

Important: `.env` is ignored by git and should never be committed.
