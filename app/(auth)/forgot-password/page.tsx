"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import Link from "next/link"
import { forgotPassword, type AuthState } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"
import { CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full my-4" size='lg' disabled={pending}>
      {pending ? "Sending…" : "Send reset code"}
    </Button>
  )
}

export default function ForgotPasswordPage() {
  const [state, action] = useActionState<AuthState, FormData>(forgotPassword, {})

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          Forgot password?
        </h1>
        <p className="text-[12px] text-muted-foreground mt-2">Enter your email and we&apos;ll send you a reset code</p>
      </div>
      <CardContent>
        <form action={action} className="space-y-4">
          {state.error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
              {state.error}
            </p>
          )}

          <div className="space-y-2.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              className="h-8"
            />
            {state.fieldErrors?.email && (
              <p className="text-xs text-destructive">{state.fieldErrors.email[0]}</p>
            )}
          </div>

          <SubmitButton />

          <p className="text-center text-sm text-muted-foreground">
            Remembered your password?{" "}
            <Link href="/sign-in" className="text-foreground underline underline-offset-4 hover:text-primary">
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </div>
  )
}
