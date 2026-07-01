# Next Auth Template

A production-ready authentication template for SaaS applications built with **Next.js 16**, **Tailwind CSS v4**, and **shadcn/ui**. Features a fully custom password-based auth system with email verification via OTP.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Authentication:** Custom (password + JWT + bcrypt)
- **Database:** PostgreSQL + Prisma 7
- **Styling:** Tailwind CSS v4 + shadcn/ui + Radix UI
- **Email:** Resend
- **Validation:** Zod
- **Language:** TypeScript

## Features

- Email/password sign up & sign in
- OTP-based email verification (sign up & password reset)
- Forgot / reset password flow
- Cookie-based JWT sessions
- Server Actions for all auth logic
- Middleware-protected routes
- Dark/light mode (keyboard shortcut: `D`)
- Password strength indicator
- 65+ shadcn/ui components
- Responsive auth layouts (2-column on desktop)
- Dotted-map background on auth pages
- Ready for Stripe, roles, 2FA, etc.

## Getting Started

### 1. Clone and install

```bash
git clone <your-repo-url> my-saas
cd my-saas
pnpm install
```

### 2. Set up environment variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for signing JWTs |
| `RESEND_API_KEY` | Resend API key for transactional emails |
| `RESEND_FROM_EMAIL` | Sender email address (e.g. `noreply@yourdomain.com`) |
| `NEXT_PUBLIC_APP_URL` | Your app URL (`http://localhost:3000` for dev) |

### 3. Set up the database

```bash
npx prisma migrate dev --name init
```

This creates the `User` and `VerificationToken` tables in your PostgreSQL database.

### 4. Run the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/sign-in`.

## Auth Flows

| Flow | Path | Server Action |
|---|---|---|
| Sign Up | `/sign-up` | `signUp` |
| Sign In | `/sign-in` | `signIn` |
| Forgot Password | `/forgot-password` | `forgotPassword` |
| Reset Password | `/reset-password` | `resetPassword` |
| Verify Email (OTP) | `/verify-email` | `verifyOtp` |

All auth logic lives in `lib/actions/auth.ts`. Sessions are managed via an httpOnly `auth-token` cookie with a signed JWT.

## Project Structure

```
├── app/
│   ├── (auth)/          # Auth pages (sign-in, sign-up, etc.)
│   ├── (user)/          # Authenticated pages (dashboard)
│   └── layout.tsx       # Root layout with ThemeProvider
├── components/
│   ├── ui/              # shadcn/ui components
│   └── auth/            # Auth-specific components
├── lib/
│   ├── actions/auth.ts  # Server actions for auth
│   ├── auth.ts          # Session helpers (getSession, setAuthCookie)
│   ├── db.ts            # Prisma client
│   ├── email.ts         # Email templates + send functions
│   ├── jwt.ts           # JWT sign/verify helpers
│   ├── otp.ts           # OTP generation & verification
│   └── utils.ts         # cn() utility
├── prisma/
│   └── schema.prisma    # Database schema
└── middleware.ts        # Auth redirect logic
```

## Adding to Your SaaS

This template is intentionally minimal so you can build on top of it:

1. **Stripe / Payments** — add subscriptions, one-time payments, or usage-based billing
2. **Role-based access** — add a `role` field to the User model
3. **OAuth** — integrate Google, GitHub, etc. via a custom flow or next-auth
4. **API routes** — add REST or tRPC endpoints for your app logic
5. **Rate limiting** — protect auth endpoints with upstash or similar
6. **2FA** — add TOTP or passkeys on top of the existing auth

## Deployment

Deploy to [Vercel](https://vercel.com) (recommended):

```bash
npx vercel
```

Make sure to set all environment variables in your deployment dashboard and run `npx prisma migrate deploy` in your CI/CD pipeline.
