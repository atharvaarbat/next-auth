"use server"

import { redirect } from "next/navigation"
import { after } from "next/server"
import bcrypt from "bcrypt"
import { z } from "zod"
import { db } from "@/lib/db"
import { signToken } from "@/lib/jwt"
import { setAuthCookie, clearAuthCookie } from "@/lib/auth"
import { createOtp, resendOtp, verifyOtp } from "@/lib/otp"
import { sendVerificationEmail, sendPasswordResetEmail, sendAccountExistsNoticeEmail } from "@/lib/email"
import { rateLimitOrError, checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { getClientIp } from "@/lib/request-info"
import { logAuthEvent } from "@/lib/audit"

const emailSchema = z.string().email("Invalid email address")
const otpSchema = z.string().regex(/^\d{6}$/, "Enter the 6-digit code")

const signUpSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: emailSchema,
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
})

const emailOnlySchema = z.object({
  email: emailSchema,
})

const verifyOtpSchema = z.object({
  email: emailSchema,
  otp: otpSchema,
})

const resetPasswordSchema = z.object({
  email: emailSchema,
  otp: otpSchema,
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_MINUTES = 15

export type AuthState = {
  error?: string
  fieldErrors?: Record<string, string[]>
}

export type OtpState = {
  error?: string
  message?: string
  fieldErrors?: Record<string, string[]>
}

function fieldErrorsFrom(issues: z.ZodIssue[]): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {}
  for (const issue of issues) {
    const key = String(issue.path[0])
    if (!fieldErrors[key]) fieldErrors[key] = []
    fieldErrors[key].push(issue.message)
  }
  return fieldErrors
}

export async function signUp(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const ip = await getClientIp()
  const ipLimited = await rateLimitOrError(`sign-up:ip:${ip}`, RATE_LIMITS.signUpIp)
  if (ipLimited) return ipLimited

  const result = signUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  })

  if (!result.success) {
    return { fieldErrors: fieldErrorsFrom(result.error.issues) }
  }

  const { name, email, password } = result.data

  const emailLimited = await rateLimitOrError(`sign-up:email:${email}`, RATE_LIMITS.signUpEmail)
  if (emailLimited) return emailLimited

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    // Don't reveal that the account exists — notify the existing owner instead
    // and fall through to the same redirect as a real sign-up. Any code the
    // visitor enters will fail with the generic "Invalid or expired code"
    // error from verifyOtp(), same as a mistyped code.
    await sendAccountExistsNoticeEmail(email).catch(() => {})
  } else {
    const hashed = await bcrypt.hash(password, 12)
    const otp = await createOtp({ email, type: "SIGN_UP", payload: { name, password: hashed } })
    await sendVerificationEmail(email, otp)
  }

  redirect(`/verify-email?email=${encodeURIComponent(email)}`)
}

export async function verifySignUpOtp(_prevState: OtpState, formData: FormData): Promise<OtpState> {
  const ip = await getClientIp()
  const ipLimited = await rateLimitOrError(`otp-verify:ip:${ip}`, RATE_LIMITS.otpVerifyIp)
  if (ipLimited) return ipLimited

  const result = verifyOtpSchema.safeParse({
    email: formData.get("email"),
    otp: formData.get("otp"),
  })

  if (!result.success) {
    return { fieldErrors: fieldErrorsFrom(result.error.issues) }
  }

  const { email, otp } = result.data

  const check = await verifyOtp({ email, type: "SIGN_UP", otp })
  if (!check.success) {
    return { error: check.error }
  }

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    return { error: "An account with this email already exists." }
  }

  const { name, password } = check.payload as { name: string; password: string }
  const user = await db.user.create({ data: { name, email, password } })

  const token = await signToken({
    userId: user.id,
    email: user.email,
    sessionVersion: user.sessionVersion,
  })
  await setAuthCookie(token)
  after(() => logAuthEvent({ type: "SIGN_UP", userId: user.id, email: user.email, metadata: { method: "password" } }))
  redirect("/dashboard")
}

export async function resendSignUpOtp(_prevState: OtpState, formData: FormData): Promise<OtpState> {
  const ip = await getClientIp()
  const ipLimited = await rateLimitOrError(`otp-resend:ip:${ip}`, RATE_LIMITS.otpResendIp)
  if (ipLimited) return ipLimited

  const result = emailOnlySchema.safeParse({ email: formData.get("email") })
  if (!result.success) {
    return { error: "Invalid email address." }
  }

  const { email } = result.data

  const emailLimited = await rateLimitOrError(`otp-resend:email:${email}`, RATE_LIMITS.otpResendEmail)
  if (emailLimited) return emailLimited

  const otp = await resendOtp(email, "SIGN_UP")
  if (!otp) {
    return { error: "We couldn't find a pending sign-up for this email. Please sign up again." }
  }

  await sendVerificationEmail(email, otp)
  return { message: "A new code has been sent to your email." }
}

export async function signIn(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const ip = await getClientIp()
  const ipLimited = await rateLimitOrError(`sign-in:ip:${ip}`, RATE_LIMITS.signInIp)
  if (ipLimited) return ipLimited

  const result = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!result.success) {
    return { fieldErrors: fieldErrorsFrom(result.error.issues) }
  }

  const { email, password } = result.data

  const user = await db.user.findUnique({ where: { email } })
  if (!user || !user.password) {
    after(() => logAuthEvent({ type: "LOGIN_FAILURE", email, metadata: { reason: "invalid_credentials" } }))
    return { error: "Invalid email or password." }
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    after(() => logAuthEvent({ type: "LOGIN_FAILURE", userId: user.id, email, metadata: { reason: "locked" } }))
    return { error: "Too many failed attempts. Please try again in a few minutes." }
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    const attempts = user.failedLoginAttempts + 1
    const lockedOut = attempts >= MAX_LOGIN_ATTEMPTS
    await db.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: lockedOut ? 0 : attempts,
        lockedUntil: lockedOut ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000) : null,
      },
    })
    after(() =>
      logAuthEvent({
        type: lockedOut ? "ACCOUNT_LOCKED" : "LOGIN_FAILURE",
        userId: user.id,
        email,
        metadata: { reason: "invalid_credentials" },
      })
    )
    return lockedOut
      ? { error: "Too many failed attempts. Please try again in a few minutes." }
      : { error: "Invalid email or password." }
  }

  if (user.failedLoginAttempts > 0 || user.lockedUntil) {
    await db.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    })
  }

  const token = await signToken({
    userId: user.id,
    email: user.email,
    sessionVersion: user.sessionVersion,
  })
  await setAuthCookie(token)
  after(() => logAuthEvent({ type: "LOGIN_SUCCESS", userId: user.id, email, metadata: { method: "password" } }))
  redirect("/dashboard")
}

export async function signOut() {
  await clearAuthCookie()
  redirect("/sign-in")
}

async function requestPasswordResetOtp(email: string) {
  // Rate-limit hits are intentionally silent here (no error returned) so
  // this helper's outward behavior stays identical to the "user not found"
  // branch below — callers must never reveal whether an email is registered.
  const ip = await getClientIp()
  if (!(await checkRateLimit(`password-reset:ip:${ip}`, RATE_LIMITS.passwordResetIp))) return
  if (!(await checkRateLimit(`password-reset:email:${email}`, RATE_LIMITS.passwordResetEmail))) return

  const user = await db.user.findUnique({ where: { email } })
  if (!user) return

  const otp = await createOtp({ email, type: "PASSWORD_RESET" })
  await sendPasswordResetEmail(email, otp)
  after(() => logAuthEvent({ type: "PASSWORD_RESET_REQUESTED", userId: user.id, email }))
}

export async function forgotPassword(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const result = emailOnlySchema.safeParse({ email: formData.get("email") })
  if (!result.success) {
    return { fieldErrors: fieldErrorsFrom(result.error.issues) }
  }

  const { email } = result.data
  await requestPasswordResetOtp(email)

  redirect(`/reset-password?email=${encodeURIComponent(email)}`)
}

export async function resendPasswordResetOtp(_prevState: OtpState, formData: FormData): Promise<OtpState> {
  const result = emailOnlySchema.safeParse({ email: formData.get("email") })
  if (!result.success) {
    return { error: "Invalid email address." }
  }

  await requestPasswordResetOtp(result.data.email)
  return { message: "If that email is registered, we've sent a new code." }
}

export async function resetPassword(_prevState: OtpState, formData: FormData): Promise<OtpState> {
  const result = resetPasswordSchema.safeParse({
    email: formData.get("email"),
    otp: formData.get("otp"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  })

  if (!result.success) {
    return { fieldErrors: fieldErrorsFrom(result.error.issues) }
  }

  const { email, otp, password } = result.data

  const check = await verifyOtp({ email, type: "PASSWORD_RESET", otp })
  if (!check.success) {
    return { error: check.error }
  }

  const user = await db.user.findUnique({ where: { email } })
  if (!user) {
    return { error: "Invalid or expired code. Please request a new one." }
  }

  const hashed = await bcrypt.hash(password, 12)
  const updatedUser = await db.user.update({
    where: { email },
    data: {
      password: hashed,
      failedLoginAttempts: 0,
      lockedUntil: null,
      sessionVersion: { increment: 1 },
    },
  })

  const token = await signToken({
    userId: updatedUser.id,
    email: updatedUser.email,
    sessionVersion: updatedUser.sessionVersion,
  })
  await setAuthCookie(token)
  after(() => logAuthEvent({ type: "PASSWORD_RESET_COMPLETED", userId: updatedUser.id, email: updatedUser.email }))
  redirect("/dashboard")
}
