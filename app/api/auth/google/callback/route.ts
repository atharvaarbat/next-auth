import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { signToken } from "@/lib/jwt"

const STATE_COOKIE_NAME = "oauth-state"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const state = searchParams.get("state")
  const expectedState = request.cookies.get(STATE_COOKIE_NAME)?.value

  if (error || !code) {
    return NextResponse.redirect(new URL("/sign-in?error=oauth_denied", request.url))
  }

  if (!state || !expectedState || state !== expectedState) {
    const response = NextResponse.redirect(new URL("/sign-in?error=oauth_state", request.url))
    response.cookies.delete(STATE_COOKIE_NAME)
    return response
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/sign-in?error=oauth_config", request.url))
  }

  // Exchange authorization code for tokens
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  })

  const tokens = await tokenResponse.json()
  if (!tokenResponse.ok || !tokens.access_token) {
    return NextResponse.redirect(new URL("/sign-in?error=oauth_token", request.url))
  }

  // Fetch user info from Google
  const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })

  const googleUser = await userResponse.json()
  if (!userResponse.ok || !googleUser.email) {
    return NextResponse.redirect(new URL("/sign-in?error=oauth_user", request.url))
  }

  if (!googleUser.verified_email) {
    return NextResponse.redirect(new URL("/sign-in?error=oauth_unverified_email", request.url))
  }

  const { id: googleId, email, name, picture } = googleUser

  // Find existing user by googleId or email
  let user = await db.user.findFirst({
    where: { OR: [{ googleId }, { email }] },
  })

  if (user) {
    // Link googleId if user exists with this email but no googleId
    if (!user.googleId) {
      user = await db.user.update({
        where: { id: user.id },
        data: { googleId, image: picture || user.image },
      })
    }
  } else {
    // Create new user
    user = await db.user.create({
      data: { googleId, email, name: name || email.split("@")[0], image: picture },
    })
  }

  const token = await signToken({ userId: user.id, email: user.email })
  const response = NextResponse.redirect(new URL("/dashboard", request.url))
  response.cookies.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  })
  response.cookies.delete(STATE_COOKIE_NAME)

  return response
}
