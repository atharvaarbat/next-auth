import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const COOKIE_NAME = "auth-token"

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(COOKIE_NAME)?.value

  if (!token && pathname.startsWith("/dashboard")) {
    const response = NextResponse.redirect(new URL("/sign-in", request.url))
    return response
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
