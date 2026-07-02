import "server-only"
import { db } from "@/lib/db"

export function getWebAuthnConfig() {
  const origin = process.env.NEXT_PUBLIC_APP_URL
  if (!origin && process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_APP_URL must be set in production for passkey auth to work.")
  }
  const url = new URL(origin ?? "http://localhost:3000")
  return {
    rpName: "Next Auth",
    rpID: url.hostname,
    origin: origin ?? "http://localhost:3000",
  }
}

// Deletes-to-consume atomically so two concurrent requests can't both
// observe the same challenge as valid (findUnique-then-delete would race).
export async function consumeChallenge(id: string) {
  let challenge
  try {
    challenge = await db.webAuthnChallenge.delete({ where: { id } })
  } catch {
    return null
  }
  if (challenge.expiresAt < new Date()) return null
  return challenge
}

// Takes the already-encoded `options.challenge` string that
// generateRegistrationOptions()/generateAuthenticationOptions() produced, so
// what we store for later comparison is guaranteed to be byte-for-byte the
// same value the client actually signed. (Generating our own challenge and
// passing it back in as a string doesn't round-trip: the library treats a
// string `challenge` as raw text and re-encodes it, silently producing a
// different value than what was stored — see verifyRegistrationResponse's
// "Unexpected challenge" errors.)
export async function storeChallenge(userId: string | null, challenge: string): Promise<{
  id: string
}> {
  const record = await db.webAuthnChallenge.create({
    data: {
      userId,
      challenge,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    },
  })

  return { id: record.id }
}
