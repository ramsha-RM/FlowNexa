# FlowNexa

A MERN job portal with three roles: candidates apply for jobs, employers post jobs and review applicants, admins moderate the platform.

## Stack

- Server: Node 20+, Express 5, Mongoose 9, JWT in an httpOnly cookie, Google sign-in (OpenID Connect with PKCE), Nodemailer, Multer
- Client: React 19, Vite, Tailwind CSS 4, React Router 7, Axios

## Quick start

1. Install dependencies

```bash
cd server && npm install
cd ../client && npm install
```

2. Configure environment

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Fill `MONGO_URI` and set `JWT_SECRET` to a random value of at least 32 characters:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

3. Run both apps

```bash
cd server && npm run dev
cd client && npm run dev
```

Client: http://localhost:5173 · API: http://localhost:5000

Without SMTP settings in development, emails (including verification and password-reset links) are printed to the server console. Production requires SMTP configuration and never uses the JSON email transport.

## Google sign-in

Create an OAuth client in Google Cloud Console and add this authorised redirect URI exactly:

```
http://localhost:5000/api/auth/google-callback
```

Then set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` and `GOOGLE_REDIRECT_URI` in `server/.env`.

## Roles

| Role | Can do |
|---|---|
| candidate | Browse jobs, apply with a PDF resume, track and withdraw applications |
| employer | Post, edit and delete own jobs, review applicants, accept or reject |
| admin | Manage users and roles, view all jobs and applications, delete any job |

Admins cannot be created through registration. Promote a user from `/admin/users`, or set the first admin directly in the database:

```js
db.users.updateOne({ email: "you@example.com" }, { $set: { role: "admin" } })
```

## Security design

- Sessions use an httpOnly, SameSite cookie. No token is stored in localStorage or exposed in URLs.
- State-changing requests require the `X-Requested-With` header and a whitelisted CORS origin.
- Passwords are hashed with bcrypt (cost 12), must be 8-72 characters with a letter and a number, and old sessions are invalidated after a password change.
- Login is rate limited, accounts lock for 15 minutes after 5 failed attempts, and unknown emails take the same time as wrong passwords.
- Password reset and email verification tokens are random, stored hashed, single use, and redeemed with POST so email scanners cannot consume them.
- Resumes are PDF only (type, extension and magic bytes checked), 5 MB maximum, stored under random names outside any public path, and served only to the applicant, the job owner or an admin. Production requires `RESUME_STORAGE_DIR` to point to a persistent shared volume mounted by every server instance.
- Helmet headers, request body size limit, NoSQL operator stripping, express-validator on every write endpoint, field whitelisting on jobs.
- Server errors never leak details in production.

## Production settings

```
NODE_ENV=production
CLIENT_URL=https://your-client-domain
TRUST_PROXY=true
COOKIE_SAMESITE=none
REQUIRE_EMAIL_VERIFICATION=true
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_SECURE=false
MAIL_FROM="FlowNexa <no-reply@your-verified-domain.com>"
RESUME_STORAGE_DIR=/mnt/flownexa/resumes
```

`COOKIE_SECURE` is always enabled in production. Use `COOKIE_SAMESITE=lax` instead of `none` if the client and API share the same site (for example `app.example.com` and `api.example.com`). Production rate limits are stored in MongoDB so they are shared across server instances. Configure the `RESUME_STORAGE_DIR` path to the same persistent shared volume on every instance.
Set `MAIL_FROM` to a sender address verified with your SMTP provider.

## Tests

Run the backend tests with `cd server && npm test`. Client validation uses `cd client && npm run lint && npm run build`.

## Before you push

The original repository history contained a real `MONGO_URI` and `JWT_SECRET`. Rotate both, rotate the Google client secret, and remove `.env` from git history (`git filter-repo --path .env --invert-paths`).

## API overview

| Area | Endpoints |
|---|---|
| Auth | `POST /api/auth/register`, `login`, `logout`, `forgot-password`, `reset-password`, `verify-email`, `resend-verification`; `GET /me`; `PUT /profile`, `change-password`; `GET /google-login`, `google-callback` |
| Jobs | `GET /api/jobs` (search, filters, pagination), `GET /api/jobs/mine`, `GET /api/jobs/:id`, `POST`, `PUT /:id`, `DELETE /:id` |
| Applications | `POST /api/applications/apply/:jobId`, `GET my-applications`, `GET job/:jobId`, `PUT /:id/status`, `GET /:id/resume`, `DELETE /:id` |
| Admin | `GET /api/admin/stats`, `users`, `applications`; `PUT users/:id/role`; `DELETE users/:id` |

