import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import nodemailer from 'nodemailer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAdminRouter } from './admin.js';
import { validateContact } from './validate.js';

const dist = fileURLToPath(new URL('../dist/client/', import.meta.url));

export function createApp({ inbox, env = process.env } = {}) {
  const app = express();
  const onRender = env.RENDER === 'true';
  const siteUrl = env.SITE_URL || env.RENDER_EXTERNAL_URL;
  const publicOrigins = new Set();
  if (onRender || env.NODE_ENV === 'production') {
    for (const value of [env.SITE_URL, env.RENDER_EXTERNAL_URL]) {
      const url = value ? URL.parse(value) : null;
      if (url?.protocol === 'https:') publicOrigins.add(url.origin);
    }
  }

  function isSameOrigin(req) {
    const site = req.get('sec-fetch-site');
    const origin = req.get('origin');
    if (!origin || (site && site !== 'same-origin')) return false;
    return publicOrigins.size
      ? publicOrigins.has(origin)
      : origin === req.protocol + '://' + req.get('host');
  }
  const smtp = env.SMTP_URL && env.SMTP_FROM && env.CONTACT_TO
    ? nodemailer.createTransport(env.SMTP_URL) : null;

  app.disable('x-powered-by');
  if (onRender) app.set('trust proxy', 1);
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
      },
    },
  }));
  app.use(express.json({ limit: '12kb' }));

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/admin', createAdminRouter({
    inbox, password: env.ADMIN_PASSWORD, isSameOrigin, secure: onRender || env.NODE_ENV === 'production',
  }));

  app.post('/api/contact', rateLimit({
    windowMs: 15 * 60_000,
    limit: 5,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { ok: false, message: 'Too many attempts. Please try again later.' },
  }), async (req, res) => {
    const origin = req.get('origin');
    if (origin && !isSameOrigin(req)) {
      return res.status(403).json({ ok: false, message: 'Open the portfolio directly to send a message.' });
    }
    const result = validateContact(req.body);
    if (!result.ok) return res.status(400).json(result);

    if (inbox) {
      try {
        await inbox.saveMessage(result.data);
        return res.status(201).json({ ok: true });
      } catch {
        return res.status(503).json({ ok: false, message: 'The inbox could not save your message. Try again shortly.' });
      }
    }

    if (!smtp) return res.status(503).json({ ok: false, message: 'The contact inbox is not configured. Please connect on GitHub.' });
    const { name, email, subject, message } = result.data;
    try {
      const info = await smtp.sendMail({
        from: env.SMTP_FROM,
        to: env.CONTACT_TO,
        replyTo: email,
        subject: 'Portfolio: ' + subject,
        text: 'From: ' + name + ' <' + email + '>\n\n' + message,
      });
      if (!info.accepted?.length) throw new Error('No recipient accepted');
      res.json({ ok: true });
    } catch {
      res.status(502).json({ ok: false, message: 'The email service could not accept the message.' });
    }
  });

  app.get('/sitemap.xml', (_req, res, next) => {
    if (!siteUrl) return next();
    try {
      const url = new URL(siteUrl);
      if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Invalid site URL');
      const safe = url.href.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
      res.type('application/xml').send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>' + safe + '</loc></url></urlset>');
    } catch {
      res.status(503).send('Set SITE_URL to your deployed URL.');
    }
  });

  app.get('/robots.txt', (_req, res, next) => {
    if (!siteUrl) return next();
    const url = new URL(siteUrl);
    if (!['https:', 'http:'].includes(url.protocol)) return next();
    res.type('text/plain').send('User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ' + url.origin + '/sitemap.xml\n');
  });

  app.get('/admin', (_req, res) => {
    res.set({ 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' });
    res.sendFile(path.join(dist, 'index.html'));
  });

  app.use(express.static(dist, {
    setHeaders(res, file) {
      if (file.includes(path.sep + 'assets' + path.sep)) res.setHeader('Cache-Control', 'public,max-age=31536000,immutable');
    },
  }));

  app.use((error, _req, res, next) => {
    if (res.headersSent) return next(error);
    const status = error.status === 413 ? 413 : error.status === 400 ? 400 : 500;
    res.status(status).json({ ok: false, message: status === 500 ? 'The server could not complete this request.' : 'Invalid request.' });
  });
  return app;
}
