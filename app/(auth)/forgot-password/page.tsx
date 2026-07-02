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
      <div className="animate-fade-in-up animate-stagger-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Forgot password?
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5">Enter your email and we&apos;ll send you a reset code</p>
      </div>
      <CardContent className="p-0">
        <form action={action} className="space-y-4">
          {state.error && (
            <div className="animate-fade-in text-sm text-destructive bg-destructive/8 border border-destructive/15 px-3.5 py-2.5 rounded-lg">
              {state.error}
            </div>
          )}

          <div className="space-y-2.5 animate-fade-in-up animate-stagger-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              className="h-9 transition-shadow focus-visible:shadow-[0_0_0_1px_var(--ring)]"
            />
            {state.fieldErrors?.email && (
              <p className="text-xs text-destructive">{state.fieldErrors.email[0]}</p>
            )}
          </div>

          <div className="animate-fade-in-up animate-stagger-3">
            <SubmitButton />
          </div>

          <p className="text-center text-sm text-muted-foreground animate-fade-in-up animate-stagger-4">
            Remembered your password?{" "}
            <Link href="/sign-in" className="text-foreground underline underline-offset-4 hover:text-foreground/80 transition-colors">
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </div>
  )
}
