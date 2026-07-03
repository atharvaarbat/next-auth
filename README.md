![Banner](/public/banner.jpg)

<div align="center">

# SaaS Auth Template

A production-ready authentication starter for SaaS apps built with Next.js, Prisma, OAuth, and passkeys.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=nextdotjs)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn/ui-Components-111827?style=for-the-badge)](https://ui.shadcn.com/)
[![WebAuthn](https://img.shields.io/badge/Passkeys-WebAuthn-111827?style=for-the-badge)](https://webauthn.guide/)
[![Resend](https://img.shields.io/badge/Email-Resend-000000?style=for-the-badge&logo=resend)](https://resend.com/)

</div>

> **Note:** Despite the repository name, this is **not** built on [NextAuth.js / Auth.js](https://authjs.dev). Authentication is fully hand-rolled — `jose` for JWTs, `bcrypt` for password hashing, `@simplewebauthn` for passkeys, and Prisma-backed sessions. No third-party auth framework is involved.

It includes:

- Email and password auth with OTP verification
- Google and GitHub OAuth
- Passkey sign-in and passkey management
- Profile management for account settings
- Protected authenticated routes and session handling

![Sign Up](/screenshots/sign-up.jpeg)
![Profile](/screenshots/profile.jpeg)

## Features

- Email/password sign up and sign in
- OTP-based email verification
- Forgot and reset password flow
- Google OAuth
- GitHub OAuth
- Passkey sign-in with WebAuthn
- Passkey management from the profile page
- Profile editing and password update flows
- Cookie-based JWT sessions
- Route protection via `proxy.ts`
- Server Actions for auth and profile logic
- Dark/light mode support
- Responsive auth layouts
- Built on reusable shadcn/ui components
- Rate limiting on sign-up, sign-in, OTP, password reset, and OAuth start routes
- Security headers and a nonce-based Content-Security-Policy
- Auth event audit log (sign-ups, logins, lockouts, password resets, passkey and OAuth changes)

## Tech Stack

- **Framework:** Next.js 16 App Router
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma 7
- **Authentication:** Custom auth, OAuth, JWT, WebAuthn
- **Styling:** Tailwind CSS v4, shadcn/ui, Radix UI
- **Validation:** Zod
- **Email:** Resend
- **Passkeys:** `@simplewebauthn/browser` and `@simplewebauthn/server`

## Screenshots

- Sign-in and sign-up flow
- Profile management with connected accounts
- Passkey registration and credential management

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/atharvaarbat/next-auth my-saas
cd my-saas
pnpm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

Required variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret used to sign JWTs |
| `RESEND_API_KEY` | Resend API key for transactional email |
| `RESEND_FROM_EMAIL` | Verified sender email address |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret |
| `NEXT_PUBLIC_APP_URL` | Public app URL, for example `http://localhost:3000` |

### 3. Configure OAuth providers

Before OAuth sign-in will work, you need to register OAuth apps with Google and GitHub and add the correct redirect URLs.

#### Google OAuth

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one.
3. Navigate to **APIs & Services** → **Credentials**.
4. Click **Create Credentials** → **OAuth client ID**.
5. Set **Application type** to **Web application**.
6. Under **Authorized redirect URIs**, add:
   ```
   {NEXT_PUBLIC_APP_URL}/api/auth/google/callback
   ```
   For local development this would be `http://localhost:3000/api/auth/google/callback`.
7. Copy the generated **Client ID** and **Client secret** to `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in your `.env` file.

#### GitHub OAuth

1. Go to **Settings** → **Developer settings** → [OAuth Apps](https://github.com/settings/developers) on GitHub.
2. Click **New OAuth App**.
3. Set the **Homepage URL** to your `NEXT_PUBLIC_APP_URL` (e.g. `http://localhost:3000`).
4. Under **Authorization callback URL**, add:
   ```
   {NEXT_PUBLIC_APP_URL}/api/auth/github/callback
   ```
   For local development this would be `http://localhost:3000/api/auth/github/callback`.
5. Click **Register application**.
6. Copy the generated **Client ID** and generate a **Client secret**, then set them as `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in your `.env` file.

### 4. Run database migrations

```bash
npx prisma migrate deploy
```

This applies the checked-in migrations and creates the auth, OAuth, verification, and passkey tables in PostgreSQL. `migrate deploy` is safe for fresh clones and CI/CD pipelines (no shadow database needed). If you're changing `prisma/schema.prisma` as a contributor, use `npx prisma migrate dev --name <description>` instead to generate a new migration.

### 5. Start the app

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). You will be redirected to the sign-in flow.

## Authentication Flows

| Flow | Path |
|---|---|
| Sign In | `/sign-in` |
| Sign Up | `/sign-up` |
| Verify Email | `/verify-email` |
| Forgot Password | `/forgot-password` |
| Reset Password | `/reset-password` |
| Profile Management | `/profile` |

### Supported sign-in methods

- Email and password
- Google OAuth
- GitHub OAuth
- Passkey authentication

## Project Structure

```text
app/
  (auth)/              Auth pages: sign-in, sign-up, verification, reset
  (user)/              Protected app area: dashboard and profile
  api/auth/            OAuth routes and callbacks
components/
  auth/                Auth UI, passkey controls, provider buttons
  sidebar/             App navigation
lib/
  actions/             Server Actions for auth, profile, and WebAuthn
  auth.ts              Session helpers
  db.ts                Prisma client
  jwt.ts               JWT helpers
  otp.ts               OTP generation and validation
prisma/
  schema.prisma        Database schema
proxy.ts               Route protection and redirect logic
```

## Authentication Notes

- Email verification uses OTP tokens stored in the database.
- OAuth sign-in supports account linking through Google and GitHub.
- Passkeys are stored per user and can be renamed or removed from the profile page.
- The profile area also includes password updates and connected account management.
- Protected routes are enforced on the server and through `proxy.ts`.

## Deployment

This app is ready to deploy to Vercel or any Node.js host with PostgreSQL support.

Before deploying:

1. Set all environment variables in your hosting dashboard
2. Run Prisma migrations in your deployment pipeline
3. Ensure your OAuth redirect URLs match `NEXT_PUBLIC_APP_URL`
4. Use HTTPS in production for OAuth and passkeys

## Contributing

Contributions are welcome.

If you add a feature, update:

1. The relevant route or component
2. The Prisma schema if needed
3. The README so setup and usage stay accurate

## License

This project is licensed under the [MIT License](LICENSE).
