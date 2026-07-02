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

  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/github/callback`

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/sign-in?error=oauth_config", request.url))
  }

  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  })

  const tokens = await tokenResponse.json()
  if (!tokenResponse.ok || !tokens.access_token) {
    return NextResponse.redirect(new URL("/sign-in?error=oauth_token", request.url))
  }

  const userResponse = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })

  const githubUser = await userResponse.json()
  if (!userResponse.ok || !githubUser.id) {
    return NextResponse.redirect(new URL("/sign-in?error=oauth_user", request.url))
  }

  let email = githubUser.email
  if (!email) {
    const emailsResponse = await fetch("https://api.github.com/user/emails", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })

    if (emailsResponse.ok) {
      const emails = await emailsResponse.json()
      const primary = emails.find((e: { primary: boolean }) => e.primary)
      if (primary) {
        email = primary.email
      }
    }
  }

  if (!email) {
    return NextResponse.redirect(new URL("/sign-in?error=oauth_email", request.url))
  }

  const githubId = String(githubUser.id)
  const name = githubUser.name || githubUser.login
  const image = githubUser.avatar_url

  let user = await db.user.findFirst({
    where: { OR: [{ githubId }, { email }] },
  })

  if (user) {
    if (!user.githubId) {
      user = await db.user.update({
        where: { id: user.id },
        data: { githubId, image: image || user.image, name: name || user.name },
      })
    } else {
      user = await db.user.update({
        where: { id: user.id },
        data: { image: image || user.image, name: name || user.name },
      })
    }
  } else {
    user = await db.user.create({
      data: { githubId, email, name: name || email.split("@")[0], image },
    })
  }

  const token = await signToken({
    userId: user.id,
    email: user.email,
    sessionVersion: user.sessionVersion,
  })
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
