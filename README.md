# Ali Bakhtiyar · Full-stack developer

React and Vite portfolio with an Express backend, MongoDB Atlas contact inbox, a Three.js particle orb, and a responsive project gallery.

## Run on Windows

Use Node.js 22.13 or later.

```powershell
npm.cmd ci
if (!(Test-Path .env)) { Copy-Item .env.example .env }
npm.cmd run build
npm.cmd test
npm.cmd start
```

Copy `.env.example` only the first time. Edit your existing `.env` on subsequent runs. Open [localhost:8787](http://localhost:8787). The admin sign-in is at [localhost:8787/admin](http://localhost:8787/admin). For hot reload, keep the backend running and start `npm.cmd run dev` in a second terminal.

## MongoDB Atlas and admin access

1. Create an Atlas cluster and a database user with the `readWrite` role on the `portfolio` database, or the name you choose for `MONGODB_DB`.
2. Under Atlas **Network Access**, add your current public IP for local development. For Render, add all outbound ranges shown under your service’s **Connect → Outbound** tab.
3. Copy the Atlas connection string from **Connect → Drivers → Node.js** and set `MONGODB_URI`. If the database password contains reserved URI characters, percent-encode it before putting it in the string.
4. Set `ADMIN_PASSWORD` to your own strong password of at least 12 characters. Keep both secrets in your local `.env` or Render environment variables.
5. Submit a test from the portfolio contact form, then sign in at `/admin`. Open messages, mark them read or unread, and use the sender’s email to reply from your email app.

New submissions go to the `contact_messages` collection when Atlas is configured. Optional SMTP settings remain available for local email delivery when `MONGODB_URI` is empty. When using Atlas, check the admin inbox for new submissions. Admin sessions are stored in Atlas and expire after eight hours. Changing the admin password invalidates existing sessions.

## Deploy on Render

You can use the included `render.yaml` through **New → Blueprint**, or create a **New → Web Service** connected to the repository’s `main` branch.

| Setting | Value |
| --- | --- |
| Runtime | Node |
| Build command | `npm ci --include=dev && npm run build` |
| Start command | `npm start` |
| Health check path | `/api/health` |

Set `MONGODB_URI`, `MONGODB_DB` (default `portfolio`), and `ADMIN_PASSWORD` in the Render dashboard. Render supplies the server port and public URL. For a custom domain, set `SITE_URL` to the full HTTPS origin, for example `https://portfolio.example.com`. Use the origin without `/admin`. The default Render URL is detected automatically. After deployment, verify the public contact form and sign in at `/admin` over HTTPS.

References: [Render Express deployment](https://render.com/docs/deploy-node-express-app) and [Atlas network access from Render](https://render.com/docs/connect-to-mongodb-atlas).

## Add your CV

Save your finished PDF as `public/ali-bakhtiyar-cv.pdf`. Rebuild and restart the server to enable the download in About. Restart Vite if you are using the development server.

## Portfolio motion

The original Shery.js build provides title animations in the hero and project showcase. The project gallery uses GSAP for transitions, and the hero orb supports dragging or arrow keys when focused. The pause button and reduced-motion preference pause the animated features. See [third-party notices](THIRD_PARTY_NOTICES.md).

The earlier Cloudflare Worker build remains available for the Sites version. It uses its own D1 contact storage. The Atlas inbox and admin panel run on the Express service.
