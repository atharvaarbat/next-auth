import crypto from "crypto"
import { NextResponse, type NextRequest } from "next/server"
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { getClientIp } from "@/lib/request-info"

const STATE_COOKIE_NAME = "oauth-state"

export async function GET(request: NextRequest) {
  const ip = await getClientIp()
  if (!(await checkRateLimit(`oauth-start:ip:${ip}`, RATE_LIMITS.oauthStartIp))) {
    return NextResponse.redirect(new URL("/sign-in?error=rate_limited", request.url))
  }

  const clientId = process.env.GITHUB_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: "GitHub OAuth is not configured" }, { status: 500 })
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/github/callback`
  const state = crypto.randomBytes(32).toString("hex")

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "read:user user:email",
    state,
  })

  const response = NextResponse.redirect(`https://github.com/login/oauth/authorize?${params}`)
  response.cookies.set(STATE_COOKIE_NAME, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10,
    path: "/",
  })

  return response
}
