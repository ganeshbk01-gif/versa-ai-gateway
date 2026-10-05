/**
 * Versa AI Gateway – NVIDIA Z.ai Backend
 * ----------------------------------------
 * Minimal Express server that proxies requests to NVIDIA's API.
 * The NVIDIA_API_KEY is read from the environment (never sent to the browser).
 *
 * Endpoints:
 *   POST /api/test-connection   – verify the API key is valid
 *   POST /api/chat              – send a prompt, get a GLM-5.3 response
 *   GET  /                      – serve versa-ai-gateway.html
 */

'use strict';

const http    = require('http');
const https   = require('https');
const fs      = require('fs');
const path    = require('path');
const url     = require('url');

// ── Config ────────────────────────────────────────────────────────────────────
const PORT             = process.env.PORT || 8080;
const NVIDIA_API_KEY   = process.env.NVIDIA_API_KEY || '';
const NVIDIA_BASE_URL  = 'https://integrate.api.nvidia.com/v1';
const NVIDIA_MODEL     = 'z-ai/glm-5.3'; // default model

// ── Tiny helpers ──────────────────────────────────────────────────────────────

/** Parse JSON body from an IncomingMessage */
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end',  () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString() || '{}')); }
      catch(e) { resolve({}); }
    });
    req.on('error', reject);
  });
}

/** POST JSON to an HTTPS endpoint, return parsed response */
function httpsPost(endpoint, headers, body) {
  return new Promise((resolve, reject) => {
    const parsed  = new url.URL(endpoint);
    const payload = JSON.stringify(body);
    const opts = {
      hostname: parsed.hostname,
      port:     443,
      path:     parsed.pathname + (parsed.search || ''),
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(payload),
        ...headers
      }
    };

    const req = https.request(opts, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString();
        resolve({ status: res.statusCode, body: text });
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

/** Write a JSON response */
function jsonRes(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(body);
}

// ── Route handlers ────────────────────────────────────────────────────────────

/**
 * POST /api/test-connection
 * Body: { apiKey?: string }   (optional – falls back to env var)
 *
 * Makes a minimal real call to NVIDIA to verify the key & endpoint.
 * Returns: { success, message, responseTime, model, endpoint, details }
 */
async function handleTestConnection(req, res) {
  const body   = await readBody(req);
  const apiKey = (body.apiKey || NVIDIA_API_KEY || '').trim();

  if (!apiKey) {
    return jsonRes(res, 400, {
      success: false,
      message: 'No API key provided. Set NVIDIA_API_KEY environment variable or pass it in the request.'
    });
  }

  const start = Date.now();

  try {
    const testModel = body.model || NVIDIA_MODEL;
    const result = await httpsPost(
      `${NVIDIA_BASE_URL}/chat/completions`,
      { Authorization: `Bearer ${apiKey}` },
      {
        model: testModel,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 1,
        stream: false
      }
    );

    const elapsed = Date.now() - start;

    if (result.status === 200 || result.status === 201) {
      return jsonRes(res, 200, {
        success:      true,
        message:      'Connection successful! NVIDIA API key is valid.',
        responseTime: elapsed,
        model:        NVIDIA_MODEL,
        endpoint:     NVIDIA_BASE_URL,
        details: {
          baseUrl:        'Reachable',
          authentication: 'Successful',
          apiKey:         'Valid',
          version:        'v1'
        }
      });
    }

    // Parse NVIDIA error body
    let errMsg = `NVIDIA API returned HTTP ${result.status}`;
    try {
      const parsed = JSON.parse(result.body);
      if (parsed.error && parsed.error.message) errMsg = parsed.error.message;
    } catch (_) {}

    const errorMap = {
      401: 'Invalid or missing API key. Please check your NVIDIA API key.',
      403: 'Access forbidden. Your API key may not have permission for this model.',
      404: 'Model not found. The z-ai/glm-5.3 model may be unavailable.',
      429: 'Rate limit exceeded. Please wait and try again.',
      500: 'NVIDIA API internal error. Please try again later.',
      503: 'NVIDIA API temporarily unavailable. Please try again later.'
    };

    return jsonRes(res, 200, {
      success:      false,
      message:      errorMap[result.status] || errMsg,
      responseTime: elapsed,
      httpStatus:   result.status
    });

  } catch (err) {
    return jsonRes(res, 200, {
      success: false,
      message: `Network error: ${err.message}. Check your internet connection.`
    });
  }
}

/**
 * POST /api/chat
 * Body: { messages: [{role, content}], systemPrompt?: string, maxTokens?: number }
 *
 * Proxies to GLM-5.3. Returns the assistant's reply.
 */
async function handleChat(req, res) {
  if (!NVIDIA_API_KEY) {
    return jsonRes(res, 500, { error: 'NVIDIA_API_KEY not configured on the server.' });
  }

  const body = await readBody(req);
  const messages = Array.isArray(body.messages) ? body.messages : [];

  if (body.systemPrompt) {
    messages.unshift({ role: 'system', content: body.systemPrompt });
  }

  if (messages.length === 0) {
    return jsonRes(res, 400, { error: 'No messages provided.' });
  }

  const start = Date.now();

  try {
    const chosenModel = body.model || NVIDIA_MODEL;
    const result = await httpsPost(
      `${NVIDIA_BASE_URL}/chat/completions`,
      { Authorization: `Bearer ${NVIDIA_API_KEY}` },
      {
        model:      chosenModel,
        messages,
        max_tokens: body.maxTokens || 1024,
        stream:     false
      }
    );

    if (result.status !== 200 && result.status !== 201) {
      let errMsg = `NVIDIA API error (HTTP ${result.status})`;
      try {
        const p = JSON.parse(result.body);
        if (p.error && p.error.message) errMsg = p.error.message;
      } catch (_) {}
      return jsonRes(res, 502, { error: errMsg });
    }

    const data    = JSON.parse(result.body);
    const reply   = data.choices?.[0]?.message?.content || '';
    const elapsed = Date.now() - start;

    return jsonRes(res, 200, {
      reply,
      model:        NVIDIA_MODEL,
      responseTime: elapsed,
      usage:        data.usage || {}
    });

  } catch (err) {
    return jsonRes(res, 502, { error: `Network error: ${err.message}` });
  }
}

// ── Static file serving ───────────────────────────────────────────────────────
const MIME = {
  '.html': 'text/html',
  '.js':   'text/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.png':  'image/png',
  '.ico':  'image/x-icon'
};

function serveStatic(req, res) {
  // Default to versa-ai-gateway.html
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(__dirname, filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

// ── Main HTTP server ──────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const { pathname } = new url.URL(req.url, `http://localhost:${PORT}`);

  // CORS pre-flight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  if (req.method === 'POST' && pathname === '/api/test-connection') return handleTestConnection(req, res);
  if (req.method === 'POST' && pathname === '/api/chat')            return handleChat(req, res);

  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════════════╗');
  console.log('  ║      Versa AI Gateway – NVIDIA Backend           ║');
  console.log('  ╠══════════════════════════════════════════════════╣');
  console.log(`  ║  Server running at http://localhost:${PORT}          ║`);
  console.log(`  ║  Model: ${NVIDIA_MODEL}               ║`);
  console.log(`  ║  API key: ${NVIDIA_API_KEY ? '✓ configured' : '✗ NOT SET – set NVIDIA_API_KEY'}     ║`);
  console.log('  ╚══════════════════════════════════════════════════╝');
  console.log('');

  if (!NVIDIA_API_KEY) {
    console.warn('  ⚠️  WARNING: NVIDIA_API_KEY is not set.');
    console.warn('     Test Connection and Chat will fail until you set it.');
    console.warn('     Run:  NVIDIA_API_KEY=your_key_here node server.js');
    console.warn('     Or:   copy .env.example to .env and fill in your key,');
    console.warn('           then run: node -r dotenv/config server.js');
    console.warn('');
  }
});
