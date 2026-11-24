# Ali Bakhtiyar · Creative Full Stack Developer

A React and Vite portfolio with a procedural Three.js hero, an interactive technology explorer, and a GitHub-backed project showcase. The Site deploys as a Cloudflare Worker and keeps contact submissions in an owner-managed D1 database. The original Express/SMTP entry point is also available for local self-hosting.

## Run locally on Windows

Use Node.js 22.13 or later.

```powershell
npm.cmd ci
npm.cmd run build
npm.cmd test
npm.cmd start
```

Open http://localhost:8787. For development use `npm.cmd run dev` in a second terminal. Vite proxies contact submissions to the Express server on port 8787. For working mail on the local server, copy `.env.example` to `.env` and configure a real SMTP sender and recipient.

## Hosted contact

Sites provisions the `DB` binding and runs the migration in `drizzle/`. Every successful submission inserts a row in `contact_messages`. The Site owner can retrieve rows through the site's database tools. The hosted form does not send email notifications. The contact API rejects cross-origin requests, limits request size, validates fields, and rate limits writes. The database stores the sender fields and a time-bucketed hash for rate limiting.

## Evidence and performance

Featured work links to the developer's public repositories. The student platform uses the title supported by its README. Project card artwork is illustrative. The React Three Fiber scenes and animation engine are loaded separately from the main app. Scenes stop updating offscreen, and the hero poster remains available for reduced motion or unavailable WebGL. The interactive 3D scene is procedural, so it loads no GLB assets or texture packs.

A local SQLite smoke test exercises the same production Worker entry point for static assets, validation, persistence, and rate limiting.
