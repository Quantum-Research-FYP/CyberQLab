# CyberQ Lab

An interactive learning platform for quantum computing, cybersecurity, cryptography, and post-quantum migration.

## Development

```bash
npm install
cp .env.example .env.local
# Set MONGODB_URI in .env.local to your Atlas connection string.
npm run dev
```

If `.env.local` already exists, keep it rather than overwriting it. Open `http://localhost:3000`. Signed-out visitors are redirected to `/login`; new learners can create an account at `/signup`.

### Google sign-in

Create an OAuth 2.0 **Web application** client in Google Cloud, then add this authorized redirect URI for local development:

```text
http://localhost:3000/api/auth/google/callback
```

For production, add the same path on the public HTTPS origin. Configure the matching origin and credentials in `.env.local`:

```bash
APP_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

The integration requests only `openid`, `email`, and `profile`. Google access and refresh tokens are not stored. Restart the development server after changing environment variables.

## MongoDB and accounts

`MONGODB_URI` is server-only. `MONGODB_DB` defaults to `cyberq_lab`. Local environment files are ignored by Git; never use a `NEXT_PUBLIC_` variable for database credentials. The supplied Atlas connection is configured in the local environment file.

The app creates `users`, `sessions`, and `auth_attempts` collections with a unique email index and expiration indexes. Atlas must allow connections from the app server, and the database user needs read/write and index-creation permissions on the application database.

Passwords use salted scrypt hashes. Sessions last seven days, store only a token digest in MongoDB, and use HTTP-only, SameSite cookies (Secure in production). Signing out revokes the session. Login and signup share per-email attempt limits, with an additional global request limit. Authentication endpoints enforce same-origin requests. Deploy over HTTPS; set `APP_URL` to the public origin when behind a reverse proxy. The profile at `/profile` shows account details, current activity, section completion, quiz accuracy, and recent learning history. Quiz answers and activity are saved per user in MongoDB and restored on return. Email verification and password recovery are not included.

The password hashing parameters follow the [OWASP password storage guidance](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html). Database connections reuse the [MongoDB driver's connection pool](https://www.mongodb.com/docs/drivers/node/current/connect/mongoclient/).

```bash
npm run db:check
npm test
npm run build
npm start
```

## Browser checks

Install Google Chrome, build the app, then run the production server on port 3100 in one terminal:

```bash
npm run build
npm run start -- --port 3100
```

In another terminal:

```bash
npm run test:e2e
```

Use `TEST_BASE_URL` for a different local address. The test uses the configured MongoDB database, creates one disposable account, and removes its user/session records in cleanup. It checks both themes, mobile overflow, signup validation, duplicate emails, login, session cookies, logout, expiry, rate limits, and cross-origin rejection. Screenshots are saved in the ignored `.playwright-results` directory. Global rate-limit counters expire automatically.

## Themes

Light and dark palettes are defined in `app/colors.css`. The top-right toggle remembers the choice locally, including on login and signup pages.

## Atlas connection troubleshooting

If a request reports `MongoServerSelectionError` or `ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR`, run `npm run db:check` from the same machine or deployment as the app. Check Atlas **Security → Network Access** for that server’s current public IP, confirm that the cluster is running, and check VPN/firewall access to TCP port 27017. The TLS alert alone does not establish which of these caused the failure. See the [Atlas connection troubleshooting guide](https://www.mongodb.com/docs/atlas/troubleshoot-connection/).

The app shows a reconnect screen for database connection failures while preserving the session cookie. API requests return a temporary-unavailability response. TLS certificate verification stays enabled. Theme preferences use a cookie for server rendering and retain compatibility with the existing local browser preference.

For intermittent `querySrv ETIMEOUT` errors, a standard `mongodb://` connection string avoids SRV/TXT DNS discovery while retaining TLS and replica-set discovery. The local connection is verified before replacing the URI. Atlas can change node addresses, so obtain a fresh standard string from Atlas if the deployment topology changes. To regenerate it while SRV resolution is working, run `node scripts/check-db.mjs --configure-standard`.

Connection establishment, including DNS discovery, now has an eight-second deadline. Failed connections receive a brief retry cooldown. Handled availability events are warnings rather than development error overlays. After environment or theme-bootstrap changes, restart `npm run dev` so the running server uses the current code and URI.
