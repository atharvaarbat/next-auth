import { SignJWT, jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)

export type JWTPayload = {
  userId: string
  email: string
  sessionVersion: number
  issuedAt: number
}

type TokenClaims = {
  userId: string
  email: string
  sessionVersion: number
}

export async function signToken(payload: TokenClaims): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    if (
      typeof payload.userId !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.sessionVersion !== "number" ||
      typeof payload.iat !== "number"
    ) {
      return null
    }
    return {
      userId: payload.userId,
      email: payload.email,
      sessionVersion: payload.sessionVersion,
      issuedAt: payload.iat,
    }
  } catch {
    return null
  }
}
