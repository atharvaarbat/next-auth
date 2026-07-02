import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyToken } from "@/lib/jwt"

const COOKIE_NAME = "auth-token"
const publicPaths = ["/sign-in", "/sign-up", "/verify-email", "/forgot-password", "/reset-password", "/api/auth"]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(COOKIE_NAME)?.value
  const isPublic = publicPaths.some((p) => pathname.startsWith(p))
  const session = token ? await verifyToken(token) : null

  if (!session && !isPublic) {
    const response = NextResponse.redirect(new URL("/sign-in", request.url))
    if (token) response.cookies.delete(COOKIE_NAME)
    return response
  }

  if (session && isPublic) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/sign-in",
    "/sign-up",
    "/verify-email",
    "/forgot-password",
    "/reset-password",
    "/api/auth/:path*",
  ],
}
