"use client"

import { use, useActionState } from "react"
import { useFormStatus } from "react-dom"
import Link from "next/link"
import { signIn, type AuthState } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"
import { CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button"
import { GitHubSignInButton } from "@/components/auth/github-sign-in-button"
import { PasskeySignInButton } from "@/components/auth/passkey-sign-in-button"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="my-4 h-11 w-full" size="lg" disabled={pending}>
      {pending ? "Signing in..." : "Sign in"}
    </Button>
  )
}

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  oauth_denied: "Sign-in was cancelled.",
  oauth_state: "Your sign-in session expired. Please try again.",
  oauth_config: "This sign-in method isn't configured correctly.",
  oauth_token: "Couldn't complete sign-in with the provider. Please try again.",
  oauth_user: "Couldn't retrieve your profile from the provider.",
  oauth_email:
    "We couldn't get a verified email from your account. Make sure your provider account has a verified email address.",
}

export default function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error: oauthErrorCode } = use(searchParams)
  const oauthError = oauthErrorCode ? OAUTH_ERROR_MESSAGES[oauthErrorCode] : undefined
  const [state, action] = useActionState<AuthState, FormData>(signIn, {})

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up animate-stagger-1">
        <h1 className="text-balance text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-1.5 text-sm text-muted-foreground text-pretty">Sign in to your account</p>
      </div>
      <CardContent className="p-0">
        {oauthError && (
          <div className="animate-fade-in mb-4 rounded-lg border border-destructive/15 bg-destructive/8 px-3.5 py-2.5 text-sm text-destructive">
            {oauthError}
          </div>
        )}
        <form action={action} className="space-y-4">
          {state.error && (
            <div className="animate-fade-in rounded-lg border border-destructive/15 bg-destructive/8 px-3.5 py-2.5 text-sm text-destructive">
              {state.error}
            </div>
          )}

          <div className="animate-fade-in-up animate-stagger-2 space-y-2.5">
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

          <div className="animate-fade-in-up animate-stagger-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
              >
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              id="password"
              name="password"
              placeholder="........"
              autoComplete="current-password"
              required
              className="h-9 transition-shadow focus-visible:shadow-[0_0_0_1px_var(--ring)]"
            />
            {state.fieldErrors?.password && (
              <p className="text-xs text-destructive">{state.fieldErrors.password[0]}</p>
            )}
          </div>

          <div className="animate-fade-in-up animate-stagger-4">
            <SubmitButton />
          </div>
        </form>

        <div className="relative my-5 animate-fade-in-up animate-stagger-5">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2.5 tracking-wider text-muted-foreground/50">or</span>
          </div>
        </div>

        <div className="animate-fade-in-up animate-stagger-6 space-y-2">
          <GoogleSignInButton />
          <GitHubSignInButton />
          <PasskeySignInButton />
        </div>

        <p className="mt-5 text-center text-sm text-muted-foreground animate-fade-in-up animate-stagger-7">
          Don&apos;t have an account?{" "}
          <Link
            href="/sign-up"
            className="text-foreground underline underline-offset-4 transition-colors hover:text-foreground/80"
          >
            Sign up
          </Link>
        </p>
      </CardContent>
    </div>
  )
}
