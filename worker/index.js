import { validateContact } from '../server/validate.js';
import { assets } from './assets.generated.js';

const responseHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'",
};

function reply(status, content, headers = {}) {
  return Response.json(content, { status, headers: { ...responseHeaders, 'Cache-Control': 'no-store', ...headers } });
}

async function parseSmallJson(request) {
  if (!request.body) return null;
  const reader = request.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let text = '';
  let length = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      length += part.value.byteLength;
      if (length > 16_384) return null;
      text += decoder.decode(part.value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } catch {
    return null;
  } finally {
    await reader.cancel().catch(() => {});
  }
}

async function submit(request, env, url) {
  if (request.method !== 'POST') {
    return reply(405, { ok: false, message: 'Use POST to submit a message.' }, { Allow: 'POST' });
  }
  const origin = request.headers.get('Origin');
  if (origin && origin !== url.origin) {
    return reply(403, { ok: false, message: 'Open the portfolio directly to submit a message.' });
  }
  if (request.headers.get('Content-Type')?.split(';')[0].trim() !== 'application/json') {
    return reply(415, { ok: false, message: 'Invalid submission format.' });
  }
  const result = validateContact(await parseSmallJson(request));
  if (!result.ok) return reply(400, result);
  if (!env?.DB) return reply(503, { ok: false, message: 'The inbox is unavailable. Try again or connect on GitHub.' });

  const { name, email, subject, message } = result.data;
  const now = Date.now();
  const windowStart = now - 15 * 60_000;
  const timeBucket = Math.floor(now / (15 * 60_000));
  const ip = request.headers.get('CF-Connecting-IP') || 'local';
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(timeBucket + '|' + ip));
  const source = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  try {
    const written = await env.DB.prepare(
      `INSERT INTO contact_messages (id, name, email, subject, message, received_at, source_key)
       SELECT ?, ?, ?, ?, ?, ?, ?
       WHERE (SELECT count(*) FROM contact_messages WHERE source_key = ? AND received_at >= ?) < 5`
    ).bind(crypto.randomUUID(), name, email, subject, message, now, source, source, windowStart).run();
    if (!written.success) throw new Error('Contact insert failed');
    if (written.meta.changes === 0) return reply(429, { ok: false, message: 'Too many submissions. Try again in a few minutes.' });
    return reply(201, { ok: true });
  } catch {
    return reply(503, { ok: false, message: 'Your message could not be saved. Please try again.' });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/contact') return submit(request, env, url);
    if (url.pathname === '/api/health') return reply(200, { ok: true, inboxConfigured: !!env?.DB });
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    const path = url.pathname === '/' ? '/index.html' : url.pathname;
    const file = Object.hasOwn(assets, path) ? assets[path] : null;
    if (!file) return new Response('Page not found', { status: 404, headers: responseHeaders });
    const [type, binary, value] = file;
    const assetHeaders = {
      ...responseHeaders,
      'Content-Type': type,
      'Cache-Control': path.startsWith('/assets/') ? 'public,max-age=31536000,immutable' : 'public,max-age=300',
    };
    const body = request.method === 'HEAD' ? null : (binary ? Uint8Array.from(atob(value), (character) => character.charCodeAt(0)) : value);
    return new Response(body, { headers: assetHeaders });
  },
};
