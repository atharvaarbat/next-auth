import { cookies } from "next/headers"
import { verifyToken, type JWTPayload } from "@/lib/jwt"
import { db } from "@/lib/db"

const COOKIE_NAME = "auth-token"
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  })
}

export async function clearAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null

  const payload = await verifyToken(token)
  if (!payload) return null

  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: { email: true, sessionVersion: true },
  })

  if (!user || user.email !== payload.email || user.sessionVersion !== payload.sessionVersion) {
    return null
  }

  return payload
}
