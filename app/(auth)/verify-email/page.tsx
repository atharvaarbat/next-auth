"use client"

import { redirect } from "next/navigation"
import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"
import Link from "next/link"
import { verifySignUpOtp, resendSignUpOtp, type OtpState } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Verifying…" : "Verify email"}
    </Button>
  )
}

function ResendButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="link" className="h-auto px-0" disabled={pending}>
      {pending ? "Sending…" : "Resend code"}
    </Button>
  )
}

export default function VerifyEmailPage({
  searchParams,
}: {
  searchParams: { email?: string }
}) {
  const email = searchParams.email
  if (!email) redirect("/sign-up")

  const [state, action] = useActionState<OtpState, FormData>(verifySignUpOtp, {})
  const [resendState, resendAction] = useActionState<OtpState, FormData>(resendSignUpOtp, {})
  const [otp, setOtp] = useState("")

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Verify your email</CardTitle>
          <CardDescription>Enter the 6-digit code we sent to {email}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <form action={action} className="space-y-4">
              <input type="hidden" name="email" value={email} />
              {state.error && (
                <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                  {state.error}
                </p>
              )}

              <div className="flex flex-col items-center gap-1.5">
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

              <SubmitButton />
            </form>

            <form action={resendAction} className="text-center text-sm text-muted-foreground">
              <input type="hidden" name="email" value={email} />
              {resendState.message && <p className="text-xs text-foreground mb-1">{resendState.message}</p>}
              {resendState.error && <p className="text-xs text-destructive mb-1">{resendState.error}</p>}
              Didn&apos;t get a code? <ResendButton />
            </form>

            <p className="text-center text-sm text-muted-foreground">
              <Link href="/sign-up" className="text-foreground underline underline-offset-4 hover:text-primary">
                Back to sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
