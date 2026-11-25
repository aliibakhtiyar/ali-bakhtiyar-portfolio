import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rmdir } from 'node:fs/promises';
import http from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createApp } from './app.js';

const password = 'local-test-admin-password';
const origin = 'https://portfolio.test';
const sample = { name: 'Test Person', email: 'test@example.com', subject: 'Hello', message: 'A sample inbox message for the local test.' };

function memoryInbox() {
  const messages = [];
  const sessions = new Map();
  return {
    sessions,
    async saveMessage(message) {
      const id = String(messages.length + 1).padStart(24, '0');
      messages.push({ ...message, id, isRead: false, receivedAt: new Date() });
    },
    async listMessages({ cursor, unread, limit }) {
      const matches = messages.filter((item) => (!cursor || item.id < cursor) && (!unread || !item.isRead)).reverse();
      const items = matches.slice(0, limit);
      return { items, nextCursor: matches.length > limit ? items.at(-1).id : null };
    },
    async setRead(id, isRead) {
      const item = messages.find((message) => message.id === id);
      if (!item) return false;
      item.isRead = isRead;
      return true;
    },
    async createSession(id, expiresAt) { sessions.set(id, expiresAt); },
    async deleteSession(id) { sessions.delete(id); },
    async hasSession(id) { return sessions.get(id) > new Date(); },
  };
}

async function setup(t, options = {}) {
  const dir = process.platform === 'win32' ? null : await mkdtemp(join(tmpdir(), 'portfolio-admin-'));
  const socket = dir ? join(dir, 'app.sock') : '\\\\.\\pipe\\portfolio-' + randomUUID();
  const inbox = options.inbox ?? memoryInbox();
  const onRender = options.env?.RENDER !== false;
  const server = http.createServer(createApp({ inbox, env: { RENDER: 'true', ADMIN_PASSWORD: password, ...options.env } }));
  if (!onRender) server.prependListener('request', (req) => {
    Object.defineProperty(req.socket, 'remoteAddress', { value: '127.0.0.1' });
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(socket, resolve);
  });
  t.after(async () => {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    if (dir) await rmdir(dir);
  });

  function request(route, { method = 'GET', body, headers = {} } = {}) {
    const payload = body === undefined ? null : JSON.stringify(body);
    return new Promise((resolve, reject) => {
      const req = http.request({
        socketPath: socket, path: route, method,
        headers: {
          host: 'portfolio.test',
          ...(onRender ? { 'x-forwarded-proto': 'https', 'x-forwarded-for': '192.0.2.41' } : {}),
          ...(payload ? { 'content-type': 'application/json', 'content-length': Buffer.byteLength(payload), origin } : {}),
          ...headers,
        },
      }, (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          const data = res.headers['content-type']?.startsWith('application/json') ? JSON.parse(text) : text;
          resolve({ status: res.statusCode, headers: res.headers, data });
        });
      });
      req.on('error', reject);
      req.end(payload ?? undefined);
    });
  }
  return { request, inbox };
}

test('contact messages are saved and only authenticated administrators can view or update them', async (t) => {
  const { request, inbox } = await setup(t);
  assert.equal((await request('/api/admin/messages')).status, 401);
  assert.equal((await request('/api/contact', { method: 'POST', body: sample })).status, 201);
  assert.equal((await request('/api/admin/login', { method: 'POST', body: { password: 'incorrect' } })).status, 401);
  const signIn = await request('/api/admin/login', { method: 'POST', body: { password } });
  assert.equal(signIn.status, 200);
  const setCookie = signIn.headers['set-cookie'][0];
  const cookie = setCookie.split(';')[0];
  assert.match(setCookie, /^__Host-portfolio-admin=/);
  assert.match(setCookie, /; Path=\//);
  assert.match(setCookie, /; HttpOnly/);
  assert.match(setCookie, /; Secure/);
  assert.match(setCookie, /; SameSite=Strict/);
  assert.equal(inbox.sessions.size, 1);
  assert.ok(!inbox.sessions.has(cookie.split('=')[1]));

  const result = await request('/api/admin/messages?unread=1', { headers: { cookie } });
  assert.equal(result.status, 200);
  assert.equal(result.headers['cache-control'], 'no-store');
  assert.equal(result.data.messages.length, 1);
  assert.equal(result.data.messages[0].email, sample.email);
  const id = result.data.messages[0].id;
  assert.equal((await request('/api/admin/messages/' + id, { method: 'PATCH', body: { isRead: true }, headers: { cookie, origin: 'https://wrong.test' } })).status, 403);
  assert.equal((await request('/api/admin/messages/' + id, { method: 'PATCH', body: { isRead: true }, headers: { cookie } })).status, 200);
  const unread = await request('/api/admin/messages?unread=1', { headers: { cookie } });
  assert.deepEqual(unread.data.messages, []);
  assert.equal((await request('/api/admin/logout', { method: 'POST', body: {}, headers: { cookie } })).status, 200);
  assert.equal((await request('/api/admin/session', { headers: { cookie } })).status, 401);
});

test('admin rejects foreign-origin credentials and applies a login attempt limit', async (t) => {
  const { request } = await setup(t);
  assert.equal((await request('/api/admin/login', { method: 'POST', body: { password }, headers: { origin: 'https://wrong.test' } })).status, 403);
  for (let i = 0; i < 6; i += 1) {
    assert.equal((await request('/api/admin/login', { method: 'POST', body: { password: 'incorrect' } })).status, 401);
  }
  assert.equal((await request('/api/admin/login', { method: 'POST', body: { password } })).status, 429);
});

test('admin HTML loads directly and disables indexing and caching', async (t) => {
  const { request } = await setup(t, { env: { ADMIN_PASSWORD: '' } });
  const page = await request('/admin/');
  assert.equal(page.status, 200);
  assert.equal(page.headers['x-robots-tag'], 'noindex, nofollow');
  assert.equal(page.headers['cache-control'], 'no-store');
  assert.equal((await request('/api/admin/session')).status, 503);
});

test('Render accepts its public origins even when the proxy changes the Host header', async (t) => {
  const publicOrigin = 'https://portfolio-example.onrender.com';
  const customOrigin = 'https://portfolio.example';
  const { request } = await setup(t, { env: {
    RENDER_EXTERNAL_URL: publicOrigin,
    SITE_URL: customOrigin + '/',
  } });
  const proxy = { host: 'internal-portfolio:10000', 'x-forwarded-proto': 'http', 'sec-fetch-site': 'same-origin' };

  for (const origin of [publicOrigin, customOrigin]) {
    const headers = { ...proxy, origin };
    const login = await request('/api/admin/login', { method: 'POST', body: { password }, headers });
    assert.equal(login.status, 200);
    const cookie = login.headers['set-cookie'][0].split(';')[0];
    assert.equal((await request('/api/admin/logout', { method: 'POST', body: {}, headers: { ...headers, cookie } })).status, 200);
    assert.equal((await request('/api/contact', { method: 'POST', body: sample, headers })).status, 201);
  }

  for (const headers of [
    { ...proxy, origin: 'https://unrelated.example', 'x-forwarded-host': 'unrelated.example' },
    { ...proxy, origin: 'null' },
    { ...proxy, origin: publicOrigin, 'sec-fetch-site': 'cross-site' },
  ]) {
    assert.equal((await request('/api/admin/login', { method: 'POST', body: { password }, headers })).status, 403);
    assert.equal((await request('/api/contact', { method: 'POST', body: sample, headers })).status, 403);
  }
});

test('local admin login works on the same origin with SITE_URL unset', async (t) => {
  const { request } = await setup(t, { env: { RENDER: false } });
  const headers = {
    host: 'localhost:8787', origin: 'http://localhost:8787',
    'x-forwarded-proto': 'http', 'sec-fetch-site': 'same-origin',
  };
  const login = await request('/api/admin/login', { method: 'POST', body: { password }, headers });
  assert.equal(login.status, 200);
  assert.match(login.headers['set-cookie'][0], /^portfolio-admin=/);
});

