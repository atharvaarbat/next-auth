import crypto from "crypto"
import bcrypt from "bcrypt"
import { db } from "@/lib/db"
import type { VerificationType } from "@/app/generated/prisma/enums"
import { Prisma } from "@/app/generated/prisma/client"

const OTP_LENGTH = 6
const OTP_TTL_MINUTES = 10
const MAX_ATTEMPTS = 5

function generateOtp(): string {
  return Array.from(crypto.randomBytes(OTP_LENGTH), (b) => (b % 10).toString()).join("")
}

export async function createOtp(params: {
  email: string
  type: VerificationType
  payload?: Record<string, unknown>
}): Promise<string> {
  const { email, type, payload } = params
  const otp = generateOtp()
  const otpHash = await bcrypt.hash(otp, 10)

  await db.verificationToken.deleteMany({ where: { email, type } })
  await db.verificationToken.create({
    data: {
      email,
      type,
      otpHash,
      payload: payload ? (payload as Prisma.InputJsonValue) : Prisma.JsonNull,
      expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
    },
  })

  return otp
}

export async function resendOtp(email: string, type: VerificationType): Promise<string | null> {
  const existing = await db.verificationToken.findFirst({
    where: { email, type },
    orderBy: { createdAt: "desc" },
  })
  if (!existing) return null

  return createOtp({
    email,
    type,
    payload: (existing.payload as Record<string, unknown> | null) ?? undefined,
  })
}

export async function verifyOtp(params: {
  email: string
  type: VerificationType
  otp: string
}): Promise<
  | { success: true; payload: Record<string, unknown> | null }
  | { success: false; error: string }
> {
  const { email, type, otp } = params
  const record = await db.verificationToken.findFirst({
    where: { email, type },
    orderBy: { createdAt: "desc" },
  })

  if (!record) {
    return { success: false, error: "Invalid or expired code. Please request a new one." }
  }

  if (record.expiresAt < new Date()) {
    await db.verificationToken.delete({ where: { id: record.id } })
    return { success: false, error: "This code has expired. Please request a new one." }
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    await db.verificationToken.delete({ where: { id: record.id } })
    return { success: false, error: "Too many incorrect attempts. Please request a new code." }
  }

  const valid = await bcrypt.compare(otp, record.otpHash)
  if (!valid) {
    await db.verificationToken.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    })
    return { success: false, error: "Incorrect code. Please try again." }
  }

  await db.verificationToken.delete({ where: { id: record.id } })
  return { success: true, payload: (record.payload as Record<string, unknown> | null) ?? null }
}
