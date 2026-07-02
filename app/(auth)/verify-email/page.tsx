"use client"

import { redirect } from "next/navigation"
import { use, useActionState, useState } from "react"
import { useFormStatus } from "react-dom"
import Link from "next/link"
import { verifySignUpOtp, resendSignUpOtp, type OtpState } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"
import { CardContent } from "@/components/ui/card"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="my-4 w-full" size="lg" disabled={pending}>
      {pending ? "Verifying..." : "Verify email"}
    </Button>
  )
}

function ResendButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="link" className="h-auto px-0" disabled={pending}>
      {pending ? "Sending..." : "Resend code"}
    </Button>
  )
}

export default function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const { email } = use(searchParams)
  if (!email) redirect("/sign-up")

  const [state, action] = useActionState<OtpState, FormData>(verifySignUpOtp, {})
  const [resendState, resendAction] = useActionState<OtpState, FormData>(resendSignUpOtp, {})
  const [otp, setOtp] = useState("")

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up animate-stagger-1">
        <h1 className="text-2xl font-semibold tracking-tight">Verify your email</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Enter the 6-digit code we sent to {email}
        </p>
      </div>
      <CardContent className="p-0">
        <div className="space-y-4">
          <form action={action} className="space-y-4">
            <input type="hidden" name="email" value={email} />
            {state.error && (
              <div className="animate-fade-in rounded-lg border border-destructive/15 bg-destructive/8 px-3.5 py-2.5 text-sm text-destructive">
                {state.error}
              </div>
            )}

            <div className="animate-fade-in-up animate-stagger-2 flex flex-col items-center gap-1.5">
              <InputOTP maxLength={6} value={otp} onChange={setOtp} containerClassName="justify-center">
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
              <input type="hidden" name="otp" value={otp} />
              {state.fieldErrors?.otp && (
                <p className="text-xs text-destructive">{state.fieldErrors.otp[0]}</p>
              )}
            </div>

            <div className="animate-fade-in-up animate-stagger-3">
              <SubmitButton />
            </div>
          </form>

          <form
            action={resendAction}
            className="animate-fade-in-up animate-stagger-4 text-center text-sm text-muted-foreground"
          >
            <input type="hidden" name="email" value={email} />
            {resendState.message && <p className="mb-1 text-xs text-foreground">{resendState.message}</p>}
            {resendState.error && <p className="mb-1 text-xs text-destructive">{resendState.error}</p>}
            Didn&apos;t get a code? <ResendButton />
          </form>

          <p className="animate-fade-in-up animate-stagger-5 text-center text-sm text-muted-foreground">
            <Link
              href="/sign-up"
              className="text-foreground underline underline-offset-4 transition-colors hover:text-foreground/80"
            >
              Back to sign up
            </Link>
          </p>
        </div>
      </CardContent>
    </div>
  )
}
