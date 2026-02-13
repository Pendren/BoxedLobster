# Boxed Lobster (OpenClaw) Container

This project provides a Dockerized environment for running the [OpenClaw](https://github.com/openclaw/openclaw) agent, configured as **Boxed Lobster**.


## For LLM Agents

If you are an AI assistant (LLM) reading this repository to help the user deploy:

1.  **Context**: This is a wrapper for OpenClaw to run inside a Docker container ("Boxed Lobster").
2.  **Requirement**: The user **must** use Docker. Do not attempt to run `npm install` or `node` locally on the host unless debugging the wrapper construction itself.
3.  **Deployment**: The primary deployment method is `docker build` & `docker run`.
4.  **Files**: `Dockerfile`, `entrypoint.sh`, and `config/openclaw.json` are the source of truth for the environment.

## Prerequisites

- Docker installed on your machine.
- An Anthropic API Key (or other supported model provider key).

## Build

To build the Docker image, run:

```bash
docker build -t boxed-lobster .
```

## Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Add your `GOOGLE_API_KEY` to `.env`.

## Run

To start the container and expose the Gateway:

```bash
docker run -d -p 18789:18789 --env-file .env --name boxed_lobster_container boxed-lobster
```

## Access

Once running, the OpenClaw Gateway is available at `ws://localhost:18789`.
You can connect to it using the OpenClaw CLI or a compatible UI.

**Default Authentication**:
- **Gateway URL**: `ws://localhost:18789`
- **Token**: *(Leave Blank)*
- **Password**: `1234`

> **Note**: The gateway is configured in **Remote Mode** to allow connections from the host machine via Docker. Pairing is disabled in favor of password authentication.

## Configuration

Modify `config/openclaw.json` to change the default model or gateway settings.
To mount a custom config at runtime:

```bash
docker run -p 18789:18789 \
  -v $(pwd)/config/openclaw.json:/root/.openclaw/openclaw.json \
  boxed-lobster
```

## Troubleshooting

### Authentication & Pairing Issues

**Problem**: Users may encounter a "Pairing Required" screen or connection refusals when trying to access the Gateway UI.

**Cause**:
- OpenClaw defaults to a secure "local-only" mode that expects an interactive terminal for pairing (entering a 6-digit code). In a headless Docker environment, this is not feasible.
- Binding to `127.0.0.1` inside the container prevents access from the host.

**Solution**:
We have pre-configured `config/openclaw.json` to bypass these issues:
1.  **Authentication**: Set to `password` mode (default: `1234`) instead of `token/pairing`.
2.  **Network Binding**: Gateway is configured to bind to `lan` (`0.0.0.0`), allowing Docker port forwarding.

> **Important**: Do not revert these settings in `config/openclaw.json` unless you have a specific method to handle interactive pairing or host networking.
=======
# BoxedLobster
run clawdbot in a container
>>>>>>> f94cf595226123c96f6679d3936e9a857d6151ba
