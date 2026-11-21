const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');

/* Load .env if present (no external dependencies) */
const envPath = path.join(ROOT, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach((line) => {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  });
}

const PORT = Number(process.env.PORT || 4173);
const CRM_PIN = process.env.KIRALYTE_CRM_PIN || 'kiralyte2026';
const VALID_TOKENS = new Set();
const VALID_STATUSES = new Set(['New', 'Contacted', 'Qualified', 'Won', 'Archived']);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8'
};

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(LEADS_FILE)) fs.writeFileSync(LEADS_FILE, '[]', 'utf8');
}

function readLeads() {
  ensureStore();
  try {
    const raw = fs.readFileSync(LEADS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLeads(leads) {
  ensureStore();
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf8');
}

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1e6) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
  });
}

function isAuthed(req) {
  const token = req.headers['x-crm-token'];
  return typeof token === 'string' && VALID_TOKENS.has(token);
}

const server = http.createServer(async (req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);

  /* CRM Auth */
  if (req.method === 'POST' && urlPath === '/api/crm/auth') {
    try {
      const body = await readBody(req);
      if (String(body.pin || '') !== CRM_PIN) {
        return sendJson(res, 401, { error: 'Invalid CRM PIN' });
      }
      const token = crypto.randomBytes(24).toString('hex');
      VALID_TOKENS.add(token);
      return sendJson(res, 200, { ok: true, token });
    } catch (err) {
      return sendJson(res, 400, { error: err.message });
    }
  }

  /* Public Lead Intake */
  if (req.method === 'POST' && urlPath === '/api/leads') {
    try {
      const body = await readBody(req);
      const name = String(body.name || '').trim();
      const email = String(body.email || '').trim();
      const phone = String(body.phone || '').trim();
      const service = String(body.service || 'General Enquiry').trim();
      const budget = String(body.budget || 'Not specified').trim();
      const message = String(body.message || '').trim();
      const source = String(body.source || 'Website').trim();

      if (!name || !email || !email.includes('@') || !message) {
        return sendJson(res, 400, { error: 'Name, valid email, and message are required.' });
      }

      const leads = readLeads();
      const now = new Date().toISOString();
      const lead = {
        id: crypto.randomUUID(),
        name,
        email,
        phone,
        service,
        budget,
        message,
        source,
        status: 'New',
        notes: '',
        createdAt: now,
        updatedAt: now
      };
      leads.unshift(lead);
      writeLeads(leads);
      return sendJson(res, 201, { ok: true, id: lead.id });
    } catch (err) {
      return sendJson(res, 400, { error: err.message });
    }
  }

  /* Protected CRM APIs */
  if (urlPath === '/api/leads' && req.method === 'GET') {
    if (!isAuthed(req)) return sendJson(res, 401, { error: 'Unauthorized' });
    return sendJson(res, 200, { leads: readLeads() });
  }

  const leadMatch = urlPath.match(/^\/api\/leads\/([a-zA-Z0-9-]+)$/);
  if (leadMatch) {
    if (!isAuthed(req)) return sendJson(res, 401, { error: 'Unauthorized' });
    const id = leadMatch[1];
    const leads = readLeads();
    const idx = leads.findIndex((l) => l.id === id);
    if (idx === -1) return sendJson(res, 404, { error: 'Lead not found' });

    if (req.method === 'PATCH') {
      try {
        const body = await readBody(req);
        if (body.status && VALID_STATUSES.has(body.status)) leads[idx].status = body.status;
        if (typeof body.notes === 'string') leads[idx].notes = body.notes;
        leads[idx].updatedAt = new Date().toISOString();
        writeLeads(leads);
        return sendJson(res, 200, { ok: true, lead: leads[idx] });
      } catch (err) {
        return sendJson(res, 400, { error: err.message });
      }
    }

    if (req.method === 'DELETE') {
      leads.splice(idx, 1);
      writeLeads(leads);
      return sendJson(res, 200, { ok: true });
    }
  }

  /* Static File Serving (block private data/ and .env) */
  let relPath = urlPath === '/' ? '/index.html' : urlPath;
  const safePath = path.normalize(relPath).replace(/^(\.\.[\/\\])+/, '');
  if (safePath.startsWith('data') || safePath.startsWith('.env') || safePath === 'server.js') {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  const fullPath = path.join(ROOT, safePath);
  if (!fullPath.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.readFile(fullPath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Not found');
    }
    const ext = path.extname(fullPath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Kiralyte site & CRM running at http://localhost:${PORT}`);
});
