"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"
import Link from "next/link"
import { ArrowRight, Loader2 } from "lucide-react"
import { signUp, type AuthState } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"
import { CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="h-11 w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 size-4 animate-spin" />
          Creating account...
        </>
      ) : (
        <>
          Create account
          <ArrowRight className="ml-2 size-4" />
        </>
      )}
    </Button>
  )
}

function getPasswordStrength(password: string): {
  score: number
  label: string
  color: string
} {
  if (password.length === 0) return { score: 0, label: "", color: "" }

  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score++

  const map = [
    { label: "Too short", color: "bg-destructive" },
    { label: "Weak", color: "bg-destructive" },
    { label: "Fair", color: "bg-amber-500" },
    { label: "Good", color: "bg-blue-500" },
    { label: "Strong", color: "bg-primary" },
  ]

  return { score, ...map[score] }
}

export default function SignUpPage() {
  const [state, action] = useActionState<AuthState, FormData>(signUp, {})
  const [password, setPassword] = useState("")
  const [clientError, setClientError] = useState<string | null>(null)

  const strength = getPasswordStrength(password)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget)
    const pwd = formData.get("password") as string
    const confirm = formData.get("confirmPassword") as string

    if (pwd !== confirm) {
      event.preventDefault()
      setClientError("Passwords do not match.")
      return
    }
    setClientError(null)
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up animate-stagger-1">
        <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Enter your details to get started</p>
      </div>
      <CardContent className="p-0">
        <form action={action} onSubmit={handleSubmit} className="space-y-4">
          {(state.error || clientError) && (
            <div className="animate-fade-in rounded-lg border border-destructive/15 bg-destructive/8 px-3.5 py-2.5 text-sm text-destructive">
              {clientError || state.error}
            </div>
          )}

          <div className="animate-fade-in-up animate-stagger-2 space-y-2.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Jane Doe"
              autoComplete="name"
              required
              className="h-9 transition-shadow focus-visible:shadow-[0_0_0_1px_var(--ring)]"
            />
            {state.fieldErrors?.name && (
              <p className="text-xs text-destructive">{state.fieldErrors.name[0]}</p>
            )}
          </div>

          <div className="animate-fade-in-up animate-stagger-3 space-y-2.5">
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

          <div className="animate-fade-in-up animate-stagger-4 space-y-2.5">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              name="password"
              placeholder="........"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-9 pr-10 transition-shadow focus-visible:shadow-[0_0_0_1px_var(--ring)]"
            />
            {state.fieldErrors?.password && (
              <p className="text-xs text-destructive">{state.fieldErrors.password[0]}</p>
            )}
            {password.length > 0 && (
              <div className="animate-fade-in space-y-1.5 pt-1">
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                        i < strength.score ? strength.color : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{strength.label}</p>
              </div>
            )}
          </div>

          <div className="animate-fade-in-up animate-stagger-5 space-y-2.5">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              placeholder="........"
              autoComplete="new-password"
              required
              className="h-9 pr-10 transition-shadow focus-visible:shadow-[0_0_0_1px_var(--ring)]"
            />
            {state.fieldErrors?.confirmPassword && (
              <p className="text-xs text-destructive">{state.fieldErrors.confirmPassword[0]}</p>
            )}
          </div>

          <div className="animate-fade-in-up animate-stagger-6">
            <SubmitButton />
          </div>
        </form>

        <div className="relative my-5 animate-fade-in-up animate-stagger-7">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2.5 tracking-wider text-muted-foreground/50">or</span>
          </div>
        </div>

        <div className="animate-fade-in-up animate-stagger-8">
          <GoogleSignInButton />
        </div>

        <p className="mt-5 text-center text-sm text-muted-foreground animate-fade-in-up animate-stagger-8">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="text-foreground underline underline-offset-4 transition-colors hover:text-foreground/80"
          >
            Sign in
          </Link>
        </p>
      </CardContent>
    </div>
  )
}
