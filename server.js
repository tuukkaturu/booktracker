import { join, resolve } from 'node:path';

// Bun automatically loads .env — GEMINI_API_KEY is available here, never sent to the client
const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? '';
const PORT = parseInt(process.env.PORT ?? '3001');
const HOST = '0.0.0.0';
const IS_PROD = process.env.NODE_ENV === 'production';
const TRUST_PROXY = process.env.TRUST_PROXY === 'true';
const DIST_DIR = resolve(import.meta.dir, 'dist');
const MAX_JSON_BODY_BYTES = 5_500_000; // ~5.5 MB JSON/base64 payload cap

const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent';

const PROMPT =
  'This is a photo of a book cover. Identify the book and return ONLY a valid JSON object ' +
  'with exactly these two fields: {"title": "...", "author": "..."}. ' +
  'Use the most commonly known form of the author name. ' +
  'If you cannot identify the book, return {"title": "", "author": ""}.';

// ── Rate limiting (in-memory, per IP) ─────────────────────────────────────
const rateMap = new Map(); // ip -> { count, resetAt }
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT) return true;
  entry.count++;
  return false;
}

function getClientIp(req, server) {
  // Trust forwarded headers only when explicitly enabled.
  if (TRUST_PROXY) {
    const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    if (forwarded) return forwarded;

    const cfIp = req.headers.get('cf-connecting-ip')?.trim();
    if (cfIp) return cfIp;
  }

  // Direct socket IP is not spoofable by clients.
  return server.requestIP(req)?.address ?? 'unknown';
}

// Periodically purge expired rate-limit entries to avoid memory growth
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateMap) {
    if (now > entry.resetAt) rateMap.delete(ip);
  }
}, RATE_WINDOW_MS);

// ── Security headers applied to every response ────────────────────────────
const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(self), microphone=(), geolocation=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self'",
    // 'unsafe-inline' needed for React inline style props rendered as style attributes
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    // data: for cover photo base64 previews; blob: for camera stream
    "img-src 'self' data: blob:",
    "media-src 'self' blob:",
    // Only talk to self — Gemini is called server-side, not from the browser
    "connect-src 'self'",
    "worker-src 'self'",
    "frame-ancestors 'none'",
  ].join('; '),
};

// ── MIME types for static serving ─────────────────────────────────────────
const MIME_TYPES = {
  html:  'text/html; charset=utf-8',
  js:    'application/javascript; charset=utf-8',
  css:   'text/css; charset=utf-8',
  json:  'application/json',
  svg:   'image/svg+xml',
  png:   'image/png',
  ico:   'image/x-icon',
  woff:  'font/woff',
  woff2: 'font/woff2',
  webp:  'image/webp',
  txt:   'text/plain; charset=utf-8',
};

function jsonResponse(data, status = 200) {
  return Response.json(data, { status, headers: SECURITY_HEADERS });
}

// ── Request handler ────────────────────────────────────────────────────────
Bun.serve({
  hostname: HOST,
  port: PORT,

  async fetch(req, server) {
    const url = new URL(req.url);
    const pathname = url.pathname;

    // ── GET /api/health ────────────────────────────────────────────────
    if (pathname === '/api/health') {
      return jsonResponse({
        ok: true,
        service: 'booktracker-api',
        geminiConfigured: Boolean(GEMINI_API_KEY),
      });
    }

    // ── POST /api/identify-book ──────────────────────────────────────────
    if (pathname === '/api/identify-book' || pathname === '/api/identify-book/') {
      if (req.method !== 'POST') {
        return jsonResponse({ error: 'Method not allowed.' }, 405);
      }

      if (!GEMINI_API_KEY) {
        return jsonResponse({ error: 'Book scanning is not configured on this server.' }, 503);
      }

      // Rate limit by client IP (socket address by default)
      const ip = getClientIp(req, server);

      if (isRateLimited(ip)) {
        return jsonResponse({ error: 'Too many requests. Try again in a minute.' }, 429);
      }

      // Parse and validate body
      let body;
      try {
        const contentLengthHeader = req.headers.get('content-length');
        if (contentLengthHeader) {
          const length = Number(contentLengthHeader);
          if (!Number.isFinite(length) || length < 0) {
            return jsonResponse({ error: 'Invalid Content-Length header.' }, 400);
          }
          if (length > MAX_JSON_BODY_BYTES) {
            return jsonResponse({ error: 'Request body too large.' }, 413);
          }
        }

        const rawBody = await req.text();
        if (rawBody.length > MAX_JSON_BODY_BYTES) {
          return jsonResponse({ error: 'Request body too large.' }, 413);
        }
        body = JSON.parse(rawBody);
      } catch {
        return jsonResponse({ error: 'Invalid JSON body.' }, 400);
      }

      const { mimeType, data } = body ?? {};

      if (typeof mimeType !== 'string' || typeof data !== 'string' || !mimeType || !data) {
        return jsonResponse({ error: 'Missing required fields: mimeType and data.' }, 400);
      }

      // Only accept image MIME types
      if (!mimeType.startsWith('image/')) {
        return jsonResponse({ error: 'Only image types are accepted.' }, 400);
      }

      // Reject payloads over ~4 MB of base64 (≈ 3 MB decoded image)
      if (data.length > MAX_JSON_BODY_BYTES) {
        return jsonResponse({ error: 'Image too large. Maximum size is ~4 MB.' }, 413);
      }

      // Validate base64 characters (no script injection via the data field)
      if (!/^[A-Za-z0-9+/]+=*$/.test(data)) {
        return jsonResponse({ error: 'Invalid base64 data.' }, 400);
      }

      // Forward to Gemini — key never leaves this process
      let geminiRes;
      try {
        geminiRes = await fetch(GEMINI_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': GEMINI_API_KEY,
          },
          body: JSON.stringify({
            contents: [{
              parts: [
                { inline_data: { mime_type: mimeType, data } },
                { text: PROMPT },
              ],
            }],
            generationConfig: { temperature: 0, maxOutputTokens: 128 },
          }),
        });
      } catch {
        return jsonResponse({ error: 'Could not reach the AI service. Check your network.' }, 502);
      }

      if (!geminiRes.ok) {
        const err = await geminiRes.json().catch(() => ({}));
        const msg = err?.error?.message ?? `Upstream error ${geminiRes.status}`;
        return jsonResponse({ error: msg }, 502);
      }

      const geminiJson = await geminiRes.json();
      const raw = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      const match = raw.match(/\{[\s\S]*?\}/);

      if (!match) return jsonResponse({ title: '', author: '' });

      let parsed;
      try { parsed = JSON.parse(match[0]); } catch { return jsonResponse({ title: '', author: '' }); }

      // Sanitize and cap lengths before returning to the client
      return jsonResponse({
        title:  String(parsed.title  ?? '').replace(/\0/g, '').trim().slice(0, 500),
        author: String(parsed.author ?? '').replace(/\0/g, '').trim().slice(0, 300),
      });
    }

    // ── Static file serving in production ───────────────────────────────
    if (IS_PROD) {
      // Decode and normalise the path, then resolve against DIST_DIR
      let requestedPath;
      try {
        requestedPath = decodeURIComponent(pathname);
      } catch {
        return new Response('Bad Request', { status: 400, headers: SECURITY_HEADERS });
      }

      const filePath = resolve(join(DIST_DIR, requestedPath));

      // Directory traversal guard — resolved path must stay inside DIST_DIR
      if (!filePath.startsWith(DIST_DIR + '/') && filePath !== DIST_DIR) {
        return new Response('Forbidden', { status: 403, headers: SECURITY_HEADERS });
      }

      const file = Bun.file(filePath);
      const exists = await file.exists();

      // SPA fallback
      const finalFile = exists ? file : Bun.file(join(DIST_DIR, 'index.html'));
      const ext = filePath.split('.').pop() ?? 'html';
      const contentType = MIME_TYPES[ext] ?? 'application/octet-stream';

      // Cache-bust: cache JS/CSS assets (they have hashed filenames), not HTML
      const cacheControl = (ext === 'html' || ext === 'json')
        ? 'no-store'
        : 'public, max-age=31536000, immutable';

      return new Response(finalFile, {
        headers: {
          ...SECURITY_HEADERS,
          'Content-Type': contentType,
          'Cache-Control': cacheControl,
        },
      });
    }

    // Dev mode — Vite handles everything except /api routes
    return jsonResponse({ error: 'Not found.' }, 404);
  },
});

console.log(`\n  BookTracker API server  →  http://${HOST}:${PORT}\n`);
if (!GEMINI_API_KEY) {
  console.warn('  ⚠  GEMINI_API_KEY is not set in .env — book scanning will return 503.\n');
}
