import { db } from "@/lib/db"

export type RateLimitConfig = { limit: number; windowMs: number }

export const RATE_LIMITS = {
  signInIp: { limit: 10, windowMs: 10 * 60_000 },
  signUpIp: { limit: 5, windowMs: 60 * 60_000 },
  signUpEmail: { limit: 3, windowMs: 60 * 60_000 },
  otpResendEmail: { limit: 3, windowMs: 10 * 60_000 },
  otpResendIp: { limit: 10, windowMs: 10 * 60_000 },
  otpVerifyIp: { limit: 20, windowMs: 10 * 60_000 },
  passwordResetIp: { limit: 5, windowMs: 60 * 60_000 },
  passwordResetEmail: { limit: 3, windowMs: 60 * 60_000 },
  oauthStartIp: { limit: 20, windowMs: 10 * 60_000 },
} as const satisfies Record<string, RateLimitConfig>

const CLEANUP_MAX_AGE_MS = 24 * 60 * 60_000
const CLEANUP_SAMPLE_RATE = 0.01

// Atomic INSERT ... ON CONFLICT keeps the check-and-increment a single
// statement — a separate findUnique+update would race under concurrent
// bursts, which defeats the point of a rate limiter under exactly the
// attack pattern it exists to stop.
export async function checkRateLimit(key: string, { limit, windowMs }: RateLimitConfig): Promise<boolean> {
  const now = new Date()
  const cutoff = new Date(now.getTime() - windowMs)

  const rows = await db.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimitAttempt" AS r (key, count, "windowStart")
    VALUES (${key}, 1, ${now})
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN r."windowStart" < ${cutoff} THEN 1 ELSE r.count + 1 END,
      "windowStart" = CASE WHEN r."windowStart" < ${cutoff} THEN ${now} ELSE r."windowStart" END
    RETURNING count
  `

  // Opportunistic cleanup instead of a cron job — fine for a template.
  if (Math.random() < CLEANUP_SAMPLE_RATE) {
    void db.rateLimitAttempt
      .deleteMany({ where: { windowStart: { lt: new Date(Date.now() - CLEANUP_MAX_AGE_MS) } } })
      .catch(() => {})
  }

  return rows[0].count <= limit
}

export async function rateLimitOrError(
  key: string,
  config: RateLimitConfig,
  message = "Too many requests. Please try again later."
): Promise<{ error: string } | null> {
  return (await checkRateLimit(key, config)) ? null : { error: message }
}
