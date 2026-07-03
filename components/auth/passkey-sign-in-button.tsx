"use client"

import { useState, useEffect } from "react"
import { startAuthentication, browserSupportsWebAuthn } from "@simplewebauthn/browser"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  generatePasskeyAuthenticationOptions,
  verifyPasskeyAuthentication,
} from "@/lib/actions/webauthn"

export function PasskeySignInButton() {
  const [supported, setSupported] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setSupported(browserSupportsWebAuthn())
  }, [])

  if (!supported) return null

  async function handleSignIn() {
    setLoading(true)
    try {
      const { options, challengeId } = await generatePasskeyAuthenticationOptions()
      const response = await startAuthentication({ optionsJSON: options })
      const result = await verifyPasskeyAuthentication(challengeId, response)
      if (result?.error) {
        toast(result.error)
      }
    } catch (err) {
      if (err instanceof Error && (err.name === "AbortError" || err.name === "NotAllowedError")) {
        return
      }
      if (
        err &&
        typeof err === "object" &&
        "digest" in err &&
        err.digest === "NEXT_REDIRECT"
      ) {
        return
      }
      console.error("Passkey sign-in failed:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      className="w-full h-11 gap-2 transition-[background-color,transform] duration-200 hover:bg-muted/50 active:scale-[0.96]"
      onClick={handleSignIn}
      disabled={loading}
    >
      {loading ? (
        <svg
          className="size-4 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      ) : (
        <svg
          viewBox="0 0 24 24"
          className="size-4 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 20h12a2 2 0 0 0 2-2v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2a2 2 0 0 0 2 2Z" />
          <circle cx="12" cy="8" r="4" />
          <path d="M17 10.5a6 6 0 0 0-10 0" />
        </svg>
      )}
      {loading ? "Checking..." : "Sign in with passkey"}
    </Button>
  )
}
