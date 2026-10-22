# Supabase setup for Song Suggest

This app needs **one PostgreSQL database**. Prisma creates the application tables;
you do not need to create each table yourself or add a second database for music.
Apple supplies the chart, album metadata, artwork, and preview URLs. Audio is
streamed through the app, not stored in Supabase.

## 1. Create the Supabase project

1. Sign in at [Supabase](https://supabase.com/dashboard) and create a project on the Free plan.
2. Choose a region near you and save the database password in your password manager.
3. Wait until the database is ready. Click **Connect**, choose **Session pooler**,
   and copy its PostgreSQL URI. Use port **5432** for local development on Windows.
   The session pooler supports IPv4; the direct database endpoint normally needs IPv6.
4. This app uses Prisma on the server. Disable the Supabase Data API in the project's
   API settings if you are only using this app's database access.

See the official [Prisma integration](https://supabase.com/docs/guides/database/prisma)
and [connection guide](https://supabase.com/docs/guides/database/connecting-to-postgres).
You do not need Supabase Auth, Storage, or browser API keys for the current app.
NextAuth handles sign-in.

## 2. Configure the app

Use Node.js 24 LTS (the version in `.nvmrc`). In PowerShell in this project:

```powershell
npm install
Copy-Item .env.example .env.local
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

If `.env.local` already exists, edit it instead of copying over it. Set:

```dotenv
DATABASE_URL="postgresql://postgres.PROJECT_REF:ENCODED_PASSWORD@YOUR_SESSION_POOLER_HOST:5432/postgres?sslmode=require"
AUTH_SECRET="paste-the-generated-random-secret"
NEXTAUTH_URL="http://localhost:3000"
```

Use the actual URI from the Connect dialog; the region and pooler hostname are project-specific.
Replace its password placeholder with your database password. URL-encode reserved characters
in the password, such as `@` as `%40`, `#` as `%23`, and `:` as `%3A`.
These values stay in `.env.local`, which Git ignores. Do not put them in `NEXT_PUBLIC_*` variables.

The app and database scripts read `.env.local` before `.env`. Existing shell environment
variables take precedence. Restart the development server after changing these values.

## 3. Create and verify the tables

For a new, empty development database:

```powershell
npm run db:generate
npm run db:push
npm run db:check
```

`db:generate` creates the Prisma client. `db:push` applies [prisma/schema.prisma](prisma/schema.prisma)
to the database. `db:check` verifies connectivity and reads counts from the main app tables.
Successful output begins with `Database connected; application tables are ready.`

| Table | Purpose |
| --- | --- |
| User | App identity and profile |
| Album | Imported album metadata and community rating totals |
| Review | Personal score, rank, favorite tracks, and review notes |
| WantToListen | Saved listening queue |
| Account, Session, VerificationToken | Auth support tables defined by the schema |

The current NextAuth configuration uses JWT sessions. Its OAuth callbacks synchronize
`User` records; it does not currently use a Prisma auth adapter to store sessions or accounts.

For an established database, inspect schema changes before applying them. For production,
use versioned Prisma migrations (`prisma migrate dev` during development and
`prisma migrate deploy` at deployment) instead of treating `db:push` as deployment history.

## 4. Populate albums and start the app

```powershell
npm run db:seed
npm run db:check
npm run dev
```

`db:seed` imports the current Apple US Top 10 with tracklists. It is repeatable and
preserves existing reviews and scores. The homepage reads the live chart even when
the database already contains older albums. Opening a new chart album imports it
when the database is available, so subsequent ratings and queue entries can refer to it.

Open [localhost:3000](http://localhost:3000). Sign in with a demo account, save an
album to the queue, rate it, and check `/profile`. Reload the page to confirm persistence.
You can inspect the rows in Supabase's Table Editor or run `npm run db:studio`.

The demo sign-in accepts an email without proving ownership. Use it for development;
configure Google OAuth and restrict demo sign-in before
opening the app to real users.

## Enable Google sign-in

The sign-in page enables Google only when both its client ID and secret are set.
Configure it in your existing `.env.local`. Keep the existing
`AUTH_SECRET` and database settings. Restart `npm run dev` after editing the file.

### Google

1. Open [Google Auth Platform](https://console.cloud.google.com/auth/overview) in your
   Google Cloud project and configure the app's branding and audience. For a test
   app, add your Google account as a test user when required by the audience settings.
2. Create an OAuth client with application type **Web application**.
3. Add the authorized redirect URI exactly as:
   `http://localhost:3000/api/auth/callback/google`.
4. Save its client ID and client secret as `GOOGLE_CLIENT_ID` and
   `GOOGLE_CLIENT_SECRET` in `.env.local`.

See [Google's OAuth setup](https://developers.google.com/identity/protocols/oauth2/web-server)
and [NextAuth's Google provider](https://next-auth.js.org/providers/google).

```dotenv
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

These are private server settings. Enter them locally rather than sharing them in
chat. After restarting, `/api/auth/providers` should list Google,
and its sign-in button will be enabled. Test using Chrome or Edge. In
production, register callbacks using your HTTPS domain and update `NEXTAUTH_URL`.

The Node server commands enable system CA trust for OAuth discovery and token
requests on networks that use enterprise certificates. If an additional approved
CA is needed, set `NODE_EXTRA_CA_CERTS` before starting the server.

## Connection troubleshooting

- **JWT_SESSION_ERROR / decryption operation failed:** a saved session cookie may
  have been encrypted using an older `AUTH_SECRET`, or belong to another app on
  localhost. Keep `AUTH_SECRET` stable in `.env.local`, restart the server after
  changing it, and sign out and back in. If needed, clear the localhost site's
  `next-auth.session-token` cookie (including numbered chunks), then sign in again.
  Changing the secret invalidates existing sessions; database users and reviews remain.
- **Prisma engine download: unable to get local issuer certificate:** the database
  commands enable Node's `--use-system-ca` flag so Windows' trusted corporate CAs
  are included when downloading Prisma engines. Use Node.js 24 LTS or newer.
  If the error persists, obtain the approved root CA PEM file from your IT team
  and set it before retrying:

  ```powershell
  $env:NODE_EXTRA_CA_CERTS = 'C:\path\to\approved-corporate-ca.pem'
  npm run db:generate
  ```

  See [Node's enterprise certificate guide](https://nodejs.org/en/learn/http/enterprise-network-configuration).
- **ECONNREFUSED:** the app may still use the old localhost URL. Check `.env.local`,
  shell variables, and restart the server.
- **Authentication failed:** check the database password and URL encoding. A pooler
  username contains the project reference, for example `postgres.PROJECT_REF`.
- **IPv6 / host unreachable:** copy the Session pooler URI on port 5432.
- **Tables missing:** run `npm run db:push`, then `npm run db:check`.
- **Project paused:** resume the project in the Supabase dashboard.
- **Signed in while the DB was offline:** sign out and back in after connecting so
  the session is associated with a real database user.
- **OneDrive locks the generated build cache:** use a fresh ignored output folder,
  for example `$env:NEXT_BUILD_DIR = '.verification/local-build'` before `npm run build`.
  Use the same value for `npm run start`. Avoid moving the old cache: Next's external
  dependency files may be linked into it.

For a serverless deployment, `DATABASE_URL` can use Supabase's transaction pooler
(port 6543). Set `DIRECT_URL` to the Session pooler (5432) for Prisma CLI schema
operations. `prisma.config.ts` uses `DIRECT_URL` when provided. Start with the session
pooler for this local setup.

## Charts and previews

The homepage uses [Apple's US Top Albums JSON feed](https://itunes.apple.com/us/rss/topalbums/limit=10/json).
It is an iTunes sales chart, not the Billboard 200 or a measure of fastest growth.
No Apple API key is required. The server refreshes the chart on demand about once
an hour. If refresh fails, it labels the last chart available in that server process;
if no chart is available, it shows an unavailable message.

Preview availability depends on Apple's catalog and storefront. The app matches
track names and streams the available preview through `/api/music/proxy-audio`.
It shows playback failures instead of silently leaving the player running.

Apple previews use AAC audio in an M4A container. VS Code's embedded browser does
not support this codec. Open `http://localhost:3000` directly in Chrome, Edge, or
Safari to test playback. The player checks codec support before starting a preview
and shows a browser-specific explanation when the format is unsupported.
See [VS Code's supported media formats](https://code.visualstudio.com/api/extension-guides/webview#supported-media-formats).

For corporate TLS inspection, the app's HTTPS fallback includes trusted OS certificates
on modern Node.js. If your organization requires an additional CA file, set
`NODE_EXTRA_CA_CERTS` to the approved PEM file before starting Node.
See [Node certificate options](https://nodejs.org/api/cli.html#node_extra_ca_certsfile).
