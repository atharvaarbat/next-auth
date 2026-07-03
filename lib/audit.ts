import { db } from "@/lib/db"
import { getClientIp, getUserAgent } from "@/lib/request-info"
import type { AuthEventType } from "@/app/generated/prisma/enums"
import { Prisma } from "@/app/generated/prisma/client"

export async function logAuthEvent(params: {
  type: AuthEventType
  userId?: string | null
  email?: string | null
  metadata?: Record<string, unknown>
}): Promise<void> {
  try {
    const [ip, userAgent] = await Promise.all([getClientIp(), getUserAgent()])
    await db.authEvent.create({
      data: {
        type: params.type,
        userId: params.userId ?? null,
        email: params.email ?? null,
        ip,
        userAgent,
        metadata: params.metadata ? (params.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    })
  } catch (err) {
    // Auditing must never break the auth flow it's observing.
    console.error("logAuthEvent failed:", err)
  }
}
