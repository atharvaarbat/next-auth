"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { updateProfile, type ProfileState } from "@/lib/actions/profile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Save changes"}
    </Button>
  )
}

export function ProfileForm({ name }: { name: string }) {
  const [state, action] = useActionState<ProfileState, FormData>(updateProfile, {})

  return (
    <form action={action} className="space-y-4">
      {state.success && (
        <div className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">
          {state.success}
        </div>
      )}
      {state.error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="name">Display name</Label>
        <Input
          id="name"
          name="name"
          defaultValue={name}
          placeholder="Your name"
          aria-invalid={!!state.fieldErrors?.name}
        />
        {state.fieldErrors?.name && (
          <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
        )}
      </div>
      <SubmitButton />
    </form>
  )
}
