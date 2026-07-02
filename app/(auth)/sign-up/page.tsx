"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"
import Link from "next/link"
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react"
import { signUp, type AuthState } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"
import { CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full h-11" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 size-4 animate-spin" />
          Creating account…
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
      <div>
        <h1 className="text-2xl font-semibold">
          Create an account
        </h1>
        <p className="text-[12px] text-muted-foreground mt-2">Enter your details to get started</p>
      </div>
      <CardContent>
        <form action={action} onSubmit={handleSubmit} className="space-y-4">
          {(state.error || clientError) && (
            <Alert variant="destructive" className="border-destructive/20 bg-destructive/10">
              <AlertCircle className="size-4" />
              <AlertDescription>{clientError || state.error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Jane Doe"
              autoComplete="name"
              required
              className="h-8"
            />
            {state.fieldErrors?.name && (
              <p className="text-xs text-destructive">{state.fieldErrors.name[0]}</p>
            )}
          </div>

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

          <div className="space-y-2.5">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              name="password"
              placeholder="••••••••"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-8 pr-10"
            />
            {state.fieldErrors?.password && (
              <p className="text-xs text-destructive">{state.fieldErrors.password[0]}</p>
            )}
            {password.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${i < strength.score ? strength.color : "bg-muted"
                        }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{strength.label}</p>
              </div>
            )}
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              placeholder="••••••••"
              autoComplete="new-password"
              required
              className="h-8 pr-10"
            />
            {state.fieldErrors?.confirmPassword && (
              <p className="text-xs text-destructive">{state.fieldErrors.confirmPassword[0]}</p>
            )}
          </div>

          <SubmitButton />
        </form>
        
        <div className="relative my-4">
          <div className="absolute -top-1/5 inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <GoogleSignInButton />

        <p className="text-center text-sm text-muted-foreground mt-4">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-foreground underline underline-offset-4 hover:text-primary">
            Sign in
          </Link>
        </p>
      </CardContent>
    </div>
  )
}
