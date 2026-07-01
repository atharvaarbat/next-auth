"use client"

import { redirect } from "next/navigation"
import { use, useActionState, useState } from "react"
import { useFormStatus } from "react-dom"
import Link from "next/link"
import { resetPassword, resendPasswordResetOtp, type OtpState } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"
import { CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Label } from "@/components/ui/label"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full my-4" size='lg' disabled={pending}>
      {pending ? "Resetting…" : "Reset password"}
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

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const { email } = use(searchParams)
  if (!email) redirect("/forgot-password")

  const [state, action] = useActionState<OtpState, FormData>(resetPassword, {})
  const [resendState, resendAction] = useActionState<OtpState, FormData>(resendPasswordResetOtp, {})
  const [otp, setOtp] = useState("")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          Reset your password
        </h1>
        <p className="text-[12px] text-muted-foreground mt-2">Enter the code we sent to {email} and choose a new password</p>
      </div>
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

            <div className="space-y-2.5">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                required
                className="h-8"
              />
              {state.fieldErrors?.password && (
                <p className="text-xs text-destructive">{state.fieldErrors.password[0]}</p>
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
            <Link href="/sign-in" className="text-foreground underline underline-offset-4 hover:text-primary">
              Back to sign in
            </Link>
          </p>
        </div>
      </CardContent>
    </div>
  )
}
