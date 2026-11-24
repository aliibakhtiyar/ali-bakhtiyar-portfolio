import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import worker from '../dist/server/index.js';

const url = 'http://localhost/api/contact';
const message = { name: 'Portfolio test', email: 'test@example.com', subject: 'Test message', message: 'This is a local verification submission.' };

function request(body, headers = {}) {
  return new Request(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
}

test('worker serves HTML and the variable font with the correct content type', async () => {
  const page = await worker.fetch(new Request('http://localhost/'), {});
  assert.equal(page.status, 200);
  assert.match(await page.text(), /Ali Bakhtiyar/);
  const font = await worker.fetch(new Request('http://localhost/fonts/manrope.ttf'), {});
  assert.equal(font.headers.get('Content-Type'), 'font/ttf');
  const signature = new Uint8Array(await font.arrayBuffer()).slice(0, 4);
  assert.deepEqual([...signature], [0, 1, 0, 0]);
  assert.equal((await worker.fetch(new Request('http://localhost/missing'), {})).status, 404);
});

test('worker contact persists valid requests and rejects malformed or excessive requests', async () => {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(new URL('../drizzle/0000_contact_messages.sql', import.meta.url), 'utf8'));
  const env = { DB: { prepare: (sql) => ({ bind: (...args) => ({ run: async () => {
    const { changes } = db.prepare(sql).run(...args);
    return { success: true, meta: { changes } };
  } }) }) } };
  try {
    assert.equal((await worker.fetch(request({ ...message, email: 'invalid' }), env)).status, 400);
    assert.equal((await worker.fetch(request(message, { Origin: 'https://other.example' }), env)).status, 403);
    assert.equal((await worker.fetch(request(message), {})).status, 503);
    assert.equal((await worker.fetch(new Request(url), env)).status, 405);
    for (let i = 0; i < 5; i += 1) assert.equal((await worker.fetch(request(message), env)).status, 201);
    assert.equal((await worker.fetch(request(message), env)).status, 429);
    assert.equal(db.prepare('SELECT count(*) AS total FROM contact_messages').get().total, 5);
    assert.equal(db.prepare('SELECT subject FROM contact_messages LIMIT 1').get().subject, message.subject);
  } finally {
    db.close();
  }
});
