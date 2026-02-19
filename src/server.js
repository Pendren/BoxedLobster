const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { spawn } = require('node:child_process');
const { URL } = require('node:url');

const HOST = process.env.HOST || '0.0.0.0';
const PORT = Number.parseInt(process.env.PORT || '3000', 10);
const OPENCLAW_IMAGE = process.env.OPENCLAW_IMAGE || 'boxed-lobster';
const GATEWAY_INTERNAL_PORT = Number.parseInt(process.env.GATEWAY_INTERNAL_PORT || '18789', 10);
const SESSION_PORT_START = Number.parseInt(process.env.SESSION_PORT_START || '19000', 10);
const SESSION_PORT_END = Number.parseInt(process.env.SESSION_PORT_END || '19999', 10);
const SESSION_TTL_MINUTES = Number.parseInt(process.env.SESSION_TTL_MINUTES || '120', 10);
const OPENCLAW_PASSWORD = process.env.OPENCLAW_PASSWORD || '1234';

const sessions = new Map();

function runDocker(args) {
  return new Promise((resolve, reject) => {
    const child = spawn('docker', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });

    child.on('error', (err) => reject(err));
    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(stderr.trim() || `docker ${args.join(' ')} failed with exit code ${code}`));
      }
    });
  });
}

function json(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

function allocatePort() {
  const usedPorts = new Set(Array.from(sessions.values(), (session) => session.port));
  for (let port = SESSION_PORT_START; port <= SESSION_PORT_END; port += 1) {
    if (!usedPorts.has(port)) {
      return port;
    }
  }
  return null;
}

function sessionPayload(session) {
  return {
    sessionId: session.id,
    containerName: session.containerName,
    containerId: session.containerId,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
    status: session.status,
    gatewayUrl: `ws://localhost:${session.port}`,
    gatewayHttpUrl: `http://localhost:${session.port}`,
    password: OPENCLAW_PASSWORD
  };
}

async function createSession() {
  const port = allocatePort();
  if (!port) {
    throw new Error('No free ports are available for additional sessions.');
  }

  const id = randomUUID().split('-')[0];
  const containerName = `boxedlobster-session-${id}`;
  const volumeName = `boxedlobster-session-${id}-workspace`;
  const ttlMs = SESSION_TTL_MINUTES * 60_000;

  const args = [
    'run', '-d', '--rm',
    '--name', containerName,
    '--cap-drop=ALL',
    '--security-opt', 'no-new-privileges:true',
    '--pids-limit', '256',
    '--memory', '2g',
    '--cpus', '1.5',
    '--read-only',
    '--tmpfs', '/tmp:rw,noexec,nosuid,size=256m',
    '--tmpfs', '/run:rw,noexec,nosuid,size=64m',
    '--tmpfs', '/home/agent/.openclaw:rw,noexec,nosuid,size=64m',
    '-v', `${volumeName}:/home/agent/workspace`,
    '-e', `GOOGLE_API_KEY=${process.env.GOOGLE_API_KEY || ''}`,
    '-e', `OPENCLAW_PASSWORD=${OPENCLAW_PASSWORD}`,
    '-p', `${port}:${GATEWAY_INTERNAL_PORT}`,
    OPENCLAW_IMAGE
  ];

  const containerId = await runDocker(args);

  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + ttlMs);
  const timeout = setTimeout(async () => {
    try {
      await runDocker(['rm', '-f', containerName]);
    } catch {
      // ignored
    } finally {
      sessions.delete(id);
    }
  }, ttlMs);

  const session = {
    id,
    containerName,
    containerId,
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    port,
    status: 'running',
    timeout
  };

  sessions.set(id, session);
  return session;
}

async function deleteSession(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) {
    return false;
  }

  clearTimeout(session.timeout);
  await runDocker(['rm', '-f', session.containerName]);
  sessions.delete(sessionId);
  return true;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error('Request too large.'));
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET' && requestUrl.pathname === '/health') {
    return json(res, 200, { ok: true, activeSessions: sessions.size });
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/sessions') {
    return json(res, 200, { sessions: Array.from(sessions.values(), sessionPayload) });
  }

  if (req.method === 'POST' && requestUrl.pathname === '/api/sessions') {
    try {
      await readBody(req);
      const session = await createSession();
      return json(res, 201, sessionPayload(session));
    } catch (error) {
      return json(res, 500, { error: error.message });
    }
  }

  if (req.method === 'DELETE' && requestUrl.pathname.startsWith('/api/sessions/')) {
    const sessionId = requestUrl.pathname.split('/').pop();
    try {
      const deleted = await deleteSession(sessionId);
      if (!deleted) {
        return json(res, 404, { error: 'Session not found.' });
      }
      return json(res, 200, { ok: true });
    } catch (error) {
      return json(res, 500, { error: error.message });
    }
  }

  const filePath = requestUrl.pathname === '/'
    ? path.join(__dirname, '..', 'public', 'index.html')
    : path.join(__dirname, '..', 'public', requestUrl.pathname);

  if (!filePath.startsWith(path.join(__dirname, '..', 'public'))) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not found');
    }

    const ext = path.extname(filePath);
    const mime = ext === '.css' ? 'text/css' : ext === '.js' ? 'application/javascript' : 'text/html';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Boxed Lobster control plane running at http://${HOST}:${PORT}`);
});
