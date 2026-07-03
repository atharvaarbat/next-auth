import crypto from "crypto"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyToken } from "@/lib/jwt"

const COOKIE_NAME = "auth-token"
const PROTECTED_PREFIXES = ["/dashboard", "/profile"]

function buildCsp(nonce: string, isDev: boolean) {
  return [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // Radix/Base UI inline-style popover/tooltip positioning can't be nonced
    // per-element, so style-src stays permissive — script-src is what
    // actually matters for XSS mitigation.
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: https://lh3.googleusercontent.com https://avatars.githubusercontent.com`,
    `font-src 'self'`,
    `connect-src 'self'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ")
}

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64")
  const isDev = process.env.NODE_ENV !== "production"
  const csp = buildCsp(nonce, isDev)

  const { pathname } = request.nextUrl
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))

  if (isProtected) {
    const token = request.cookies.get(COOKIE_NAME)?.value
    // Cheap signature/expiry check only — defense-in-depth at the routing
    // boundary. The DB-backed sessionVersion revocation check still happens
    // in lib/auth.ts's getSession(), called from the (user) route group layout.
    const payload = token ? await verifyToken(token) : null
    if (!payload) {
      const response = NextResponse.redirect(new URL("/sign-in", request.url))
      response.headers.set("Content-Security-Policy", csp)
      return response
    }
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-nonce", nonce)

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set("Content-Security-Policy", csp)
  return response
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
}
