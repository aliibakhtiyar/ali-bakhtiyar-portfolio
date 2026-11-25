import { existsSync } from 'node:fs';
import { createApp } from './app.js';
import { openInbox } from './inbox.js';

if (existsSync('.env')) process.loadEnvFile('.env');

const { ADMIN_PASSWORD, MONGODB_URI, MONGODB_DB, PORT, RENDER } = process.env;
if (ADMIN_PASSWORD && (ADMIN_PASSWORD.length < 12 || ADMIN_PASSWORD.length > 512)) {
  console.error('Set ADMIN_PASSWORD to a password between 12 and 512 characters.');
  process.exit(1);
}

let inbox;
try {
  if (MONGODB_URI) inbox = await openInbox(MONGODB_URI, MONGODB_DB || 'portfolio');
} catch {
  console.error('MongoDB could not initialize. Check the Atlas URI, database user and Network Access configuration.');
  process.exit(1);
}

const port = Number(PORT) || 8787;
const app = createApp({ inbox });
const server = app.listen(port, RENDER === 'true' ? '0.0.0.0' : '127.0.0.1', (error) => {
  if (error) {
    console.error('The portfolio could not listen on port ' + port + '.');
    process.exitCode = 1;
    inbox?.close().catch(() => {});
    return;
  }
  console.log('Portfolio running at http://localhost:' + port);
});

function shutdown() {
  server.close(() => inbox?.close().catch(() => {}));
}
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
