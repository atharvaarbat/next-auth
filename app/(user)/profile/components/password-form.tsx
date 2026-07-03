"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { updatePassword, type ProfileState } from "@/lib/actions/profile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Updating..." : "Update password"}
    </Button>
  )
}

export function PasswordForm() {
  const [state, action] = useActionState<ProfileState, FormData>(updatePassword, {})

  return (
    <form action={action} className="space-y-4">
      {state.success && (
        <div className="animate-fade-in rounded-lg border border-primary/15 bg-primary/8 px-3.5 py-2.5 text-sm text-primary">
          {state.success}
        </div>
      )}
      {state.error && (
        <div className="animate-fade-in rounded-lg border border-destructive/15 bg-destructive/8 px-3.5 py-2.5 text-sm text-destructive">
          {state.error}
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current password</Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          placeholder="Enter current password"
          aria-invalid={!!state.fieldErrors?.currentPassword}
        />
        {state.fieldErrors?.currentPassword && (
          <p className="text-sm text-destructive">{state.fieldErrors.currentPassword[0]}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="newPassword">New password</Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          placeholder="Enter new password"
          aria-invalid={!!state.fieldErrors?.newPassword}
        />
        {state.fieldErrors?.newPassword && (
          <p className="text-sm text-destructive">{state.fieldErrors.newPassword[0]}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="Confirm new password"
          aria-invalid={!!state.fieldErrors?.confirmPassword}
        />
        {state.fieldErrors?.confirmPassword && (
          <p className="text-sm text-destructive">{state.fieldErrors.confirmPassword[0]}</p>
        )}
      </div>
      <SubmitButton />
    </form>
  )
}
