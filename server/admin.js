import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';

const sessionLifetime = 8 * 60 * 60_000;
const messageId = /^[a-f0-9]{24}$/i;
const digest = (value) => createHash('sha256').update(value).digest();

export function createAdminRouter({ inbox, password, secure, isSameOrigin }) {
  const router = Router();
  const configured = Boolean(inbox && typeof password === 'string' && password.length >= 12);
  const expectedPassword = configured ? digest(password) : null;
  const cookie = secure ? '__Host-portfolio-admin' : 'portfolio-admin';
  const cookieOptions = { path: '/', httpOnly: true, secure, sameSite: 'strict' };

  function readToken(req) {
    const prefix = cookie + '=';
    const value = req.get('cookie')?.split(';').map((part) => part.trim()).find((part) => part.startsWith(prefix))?.slice(prefix.length);
    return value && /^[A-Za-z0-9_-]{43}$/.test(value) ? value : null;
  }
  const sessionId = (token) => createHmac('sha256', password).update(token).digest('hex');

  router.use((req, res, next) => {
    res.set({ 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' });
    if (!configured) return res.status(503).json({ ok: false, message: 'The inbox needs a database connection and an admin password.' });
    if (['POST', 'PATCH'].includes(req.method)) {
      if (!isSameOrigin(req)) return res.status(403).json({ ok: false, message: "Sign in from the portfolio's own /admin URL." });
      if (!req.is('application/json')) return res.status(415).json({ ok: false, message: 'Expected a JSON request.' });
    }
    next();
  });

  router.post('/login', rateLimit({
    windowMs: 15 * 60_000, limit: 6, standardHeaders: 'draft-7', legacyHeaders: false,
    skipSuccessfulRequests: true, message: { ok: false, message: 'Too many login attempts. Try again in 15 minutes.' },
  }), async (req, res) => {
    const submitted = req.body?.password;
    if (typeof submitted !== 'string' || submitted.length > 512 || !timingSafeEqual(digest(submitted), expectedPassword)) {
      return res.status(401).json({ ok: false, message: 'Incorrect admin password.' });
    }

    const previous = readToken(req);
    if (previous) await inbox.deleteSession(sessionId(previous));
    const token = randomBytes(32).toString('base64url');
    await inbox.createSession(sessionId(token), new Date(Date.now() + sessionLifetime));
    res.cookie(cookie, token, { ...cookieOptions, maxAge: sessionLifetime });
    res.json({ ok: true });
  });

  router.use(async (req, res, next) => {
    const token = readToken(req);
    if (!token || !(await inbox.hasSession(sessionId(token)))) {
      return res.status(401).json({ ok: false, message: 'Sign in to open the inbox.' });
    }
    res.locals.sessionId = sessionId(token);
    next();
  });

  router.get('/session', (_req, res) => res.json({ ok: true }));
  router.post('/logout', async (_req, res) => {
    await inbox.deleteSession(res.locals.sessionId);
    res.clearCookie(cookie, cookieOptions);
    res.json({ ok: true });
  });

  router.get('/messages', async (req, res) => {
    const { cursor, unread } = req.query;
    if (cursor !== undefined && (typeof cursor !== 'string' || !messageId.test(cursor))) {
      return res.status(400).json({ ok: false, message: 'Invalid inbox cursor.' });
    }
    const { items, nextCursor } = await inbox.listMessages({ cursor, unread: unread === '1', limit: 25 });
    res.json({ ok: true, messages: items, nextCursor });
  });

  router.patch('/messages/:id', async (req, res) => {
    if (!messageId.test(req.params.id) || typeof req.body?.isRead !== 'boolean') {
      return res.status(400).json({ ok: false, message: 'Invalid message update.' });
    }
    if (!await inbox.setRead(req.params.id, req.body.isRead)) {
      return res.status(404).json({ ok: false, message: 'Message not found.' });
    }
    res.json({ ok: true });
  });

  router.use((_error, _req, res, _next) => {
    res.status(503).json({ ok: false, message: 'The inbox is temporarily unavailable.' });
  });
  return router;
}
