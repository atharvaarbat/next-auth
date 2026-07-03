# Repository Context

> **Important:** This is not the `next-auth` npm package (Auth.js/NextAuth.js). Do not suggest or use `signIn`, `signOut`, `getServerSession`, `SessionProvider`, `NextAuthConfig`, or any other Auth.js API — none of them exist in this codebase. All auth logic is hand-rolled; see `lib/auth.ts`, `lib/jwt.ts`, `lib/otp.ts`, and `lib/actions/auth.ts`.

This repository is a Next.js 16 authentication template for SaaS apps.
It uses a custom auth stack with:

- Email/password authentication
- OTP email verification and password reset
- Google OAuth
- GitHub OAuth
- Passkey authentication and passkey management
- Profile management for name, password, connected accounts, and credentials

The app is built with:

- Next.js App Router
- TypeScript
- Prisma 7 with PostgreSQL
- Tailwind CSS v4
- shadcn/ui
- Resend for email delivery
- WebAuthn via `@simplewebauthn/browser` and `@simplewebauthn/server`

## High-Level Structure

- `app/(auth)` contains sign-in, sign-up, verify-email, forgot-password, and reset-password pages.
- `app/(user)` contains protected routes like dashboard and profile.
- `app/api/auth` contains OAuth entrypoints and callback routes for Google and GitHub.
- `components/auth` contains auth UI, provider buttons, and passkey controls.
- `app/(user)/profile` contains profile management UI and related tabs/forms.
- `lib/actions` contains server actions for auth, profile, and WebAuthn flows.
- `lib` also contains shared helpers such as session, JWT, OTP, email, and DB utilities, plus `rate-limit.ts` (Postgres-backed rate limiting), `audit.ts` (auth event logging), and `request-info.ts` (client IP/user-agent helpers).
- `prisma/schema.prisma` is the source of truth for the data model.
- `proxy.ts` handles route protection, redirect behavior, and generates the per-request CSP nonce.

## Important Data Model Notes

- `User` includes `email`, optional `password`, `googleId`, `githubId`, `name`, `image`, session state, and passkey relations.
- `PasskeyCredential` stores WebAuthn credential data per user.
- `WebAuthnChallenge` stores temporary challenges for registration and authentication.
- `VerificationToken` stores OTP hashes for sign-up and password reset flows.
- `RateLimitAttempt` is a fixed-window counter table used by `lib/rate-limit.ts` — keyed by an arbitrary string like `sign-in:ip:1.2.3.4`.
- `AuthEvent` is an append-only audit log of auth-relevant events (logins, lockouts, password resets, passkey/OAuth changes), written via `lib/audit.ts`'s `logAuthEvent()`, dispatched through `after()` so it never adds latency to the auth flow it's observing.

## Common Workflows

### Local Development

```bash
pnpm install
pnpm dev
```

### Linting

```bash
pnpm lint
```

### Production Build

```bash
pnpm build
```

### Database Migrations

For a fresh clone or CI/CD, apply the checked-in migrations (no shadow database needed):

```bash
npx prisma migrate deploy
```

If you're changing `prisma/schema.prisma`, generate a new migration instead:

```bash
npx prisma migrate dev --name <name>
```

## Environment Variables

The main environment variables are defined in `.env.example`.

Required values include:

- `DATABASE_URL`
- `JWT_SECRET`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `NEXT_PUBLIC_APP_URL`

## Editing Guidelines

- Prefer small, targeted changes that match the existing app structure.
- Keep auth flows consistent with the current server-action + route-handler split.
- Do not edit generated output in `app/generated/prisma` unless the Prisma schema changed and the client was regenerated.
- Avoid changing `.next/`, `node_modules/`, or other generated artifacts.
- When adding or changing features, update the README if the user-facing behavior changes.
- Preserve the existing design language in the UI unless a redesign is explicitly requested.

## Auth Flow Reference

- Email/password sign-up starts in `app/(auth)/sign-up`.
- Email verification and password reset use OTP flows in `lib/actions/auth.ts`.
- OAuth sign-in begins in `app/api/auth/google` and `app/api/auth/github`.
- Passkey sign-in and registration are implemented through `lib/actions/webauthn.ts` and the passkey UI components.
- Profile changes are handled in `lib/actions/profile.ts`.

## Useful Reminders

- This repo already supports linked OAuth accounts and passkeys, so changes may need to respect account linking logic.
- Passkeys are user-scoped and can be renamed or removed from the profile page.
- Protected routes assume authenticated session state; check `proxy.ts` and the relevant layouts before changing access control.
- The current package manager is `pnpm`.
