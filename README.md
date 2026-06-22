# Staycation Haven PH — Node.js app

Converted from a static `localStorage`-only site into a **Node.js (Express + EJS)** app
with a **shared server-side data store**. The data now lives on the server and is shared
across every device — not trapped in one browser.

## Run

```bash
npm install
npm start
```

Then open <http://localhost:3000>. Use `npm run dev` for auto-restart on changes.
Set a different port with `PORT=8080 npm start`.

## How it works

| Piece | What it does |
|-------|--------------|
| `server.js` | Express app: renders each page as an EJS view and exposes the data API. |
| `lib/store.js` | Persistent data store backed by `data/store.json`, seeded with the original defaults. Holds the shared business keys (havens, settings, bookings, staff, bills, cleaning, users, activity log). |
| `/api/kv/:key` | REST API — `GET` read, `PUT` write, `DELETE` reset — one entry per data key. |
| `views/*.ejs` | The original pages, served server-side. Generated from the `*.html` sources by `npm run build:views`. |
| `views/partials/seed.ejs` | Injected into every page: ships the current server data as `window.__SEED__` and loads the bridge. |
| `public/js/seed-bridge.js` | Primes `localStorage` from the server on load and mirrors writes back, so all the existing client code keeps working unchanged. |
| `public/` | Client assets (`style.css`, `script.js`, `havens-data.js`, `site-settings.js`, `db.js`). |

Per-session things (logged-in user, current dashboard page, UI filters, the booking
handoff between pages) intentionally stay in the browser and are **not** synced to the server.

## Editing a page

The `.ejs` views are generated from the `.html` files. Edit the source `.html`, then run:

```bash
npm run build:views
```

## Going further (optional)

- Replace the JSON file in `lib/store.js` with a real database (SQLite/Postgres) — nothing else changes.
- Extract shared header/footer into EJS partials for the public pages.
