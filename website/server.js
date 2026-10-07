/**
 * Blue Penguin Bakery website with an "Ask Penny" chat.
 *
 *   GET  /           the bakery homepage (index.html)
 *   POST /api/chat   { message } -> Penny's answer
 *
 * The server calls the agent through the Foundry Responses API. It signs in
 * with Microsoft Entra ID (DefaultAzureCredential: Azure CLI, VS Code, managed
 * identity, ...), so there is no API key anywhere in the code.
 *
 * Setup:
 *   npm install
 *   az login
 *   export PROJECT_ENDPOINT="https://<foundry-resource>.services.ai.azure.com/api/projects/<project>"
 *   export AGENT_NAME="penny"
 *   npm start            # then open http://localhost:3000
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { DefaultAzureCredential } = require('@azure/identity');

const PORT = Number(process.env.PORT || 3000);
const ENDPOINT = process.env.PROJECT_ENDPOINT;
const AGENT = process.env.AGENT_NAME || 'penny';
if (!ENDPOINT) {
  console.error('Set PROJECT_ENDPOINT to your Foundry project endpoint (see the comment at the top of server.js).');
  process.exit(1);
}

const credential = new DefaultAzureCredential();

async function askAgent(message) {
  const { token } = await credential.getToken('https://ai.azure.com/.default');
  const body = { agent_reference: { name: AGENT, type: 'agent_reference' }, input: message };
  const res = await fetch(`${ENDPOINT}/openai/v1/responses`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Foundry returned HTTP ${res.status}: ${JSON.stringify(data).slice(0, 300)}`);

  // The reply is in the "message" items; citation markers are removed.
  const text = (data.output || [])
    .filter((o) => o.type === 'message')
    .flatMap((o) => o.content || [])
    .map((c) => c.text || '')
    .join('\n')
    .replace(/\s*【[^】]*】/g, '')
    .replace(/\s+([.,!?;:])/g, '$1')
    .trim();
  // Every step the agent took, e.g. openapi_call, file_search_call, message.
  const steps = (data.output || []).map((o) => o.type).filter((t) => t !== 'reasoning');
  const apiPath = new URL(ENDPOINT).pathname;
  return { text, steps, request: { url: `${apiPath}/openai/v1/responses`, body } };
}

const readBody = (req) => new Promise((resolve) => {
  let b = '';
  req.on('data', (c) => { b += c; });
  req.on('end', () => resolve(b));
});

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && (req.url === '/' || req.url.startsWith('/?'))) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(fs.readFileSync(path.join(__dirname, 'index.html')));
    }
    if (req.method === 'POST' && req.url === '/api/chat') {
      const { message } = JSON.parse(await readBody(req));
      const out = await askAgent(String(message || '').slice(0, 2000));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(out));
    }
    res.writeHead(404); res.end();
  } catch (e) {
    console.error(e.message);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: e.message }));
  }
});

// Listens on this computer only; put it behind a proper host for production.
server.listen(PORT, '127.0.0.1', () => console.log(`Blue Penguin Bakery on http://localhost:${PORT}`));
