const sessionsEl = document.getElementById('sessions');
const statusEl = document.getElementById('status');
const createBtn = document.getElementById('create-session');
const diagnosticsEl = document.getElementById('diagnostics');


async function loadDiagnostics() {
  const response = await fetch('/api/diagnostics');
  const data = await response.json();
  if (!data.hasGoogleApiKey && !data.hasGeminiApiKey) {
    diagnosticsEl.textContent = 'Warning: no GOOGLE_API_KEY/GEMINI_API_KEY configured in control plane env; agent replies will fail.';
    diagnosticsEl.className = 'warning';
    return;
  }
  diagnosticsEl.textContent = `Model: ${data.model}`;
  diagnosticsEl.className = '';
}

async function fetchSessions() {
  const response = await fetch('/api/sessions');
  return response.json();
}

async function refresh() {
  const payload = await fetchSessions();
  sessionsEl.innerHTML = '';

  for (const session of payload.sessions) {
    const li = document.createElement('li');
    li.className = 'card';
    li.innerHTML = `
      <strong>${session.sessionId}</strong><br>
      Gateway (WS): <code>${session.gatewayUrl}</code><br>
      UI: <a href="${session.gatewayHttpUrl}" target="_blank" rel="noopener noreferrer">${session.gatewayHttpUrl}</a><br>
      Password: <code>${session.password}</code><br>
      Expires: ${new Date(session.expiresAt).toLocaleString()}
    `;

    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete';
    deleteButton.textContent = 'Stop';
    deleteButton.onclick = async () => {
      await fetch(`/api/sessions/${session.sessionId}`, { method: 'DELETE' });
      await refresh();
    };

    li.appendChild(deleteButton);
    sessionsEl.appendChild(li);
  }
}

createBtn.onclick = async () => {
  statusEl.textContent = 'Creating isolated container...';
  const response = await fetch('/api/sessions', { method: 'POST' });
  const payload = await response.json();
  if (!response.ok) {
    statusEl.textContent = `Failed: ${payload.error}`;
    return;
  }

  statusEl.textContent = `Session ${payload.sessionId} ready on ${payload.gatewayHttpUrl}`;
  await refresh();
};

loadDiagnostics();
refresh();
setInterval(refresh, 15000);
