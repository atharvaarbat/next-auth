"use server"

import { redirect } from "next/navigation"
import bcrypt from "bcrypt"
import { z } from "zod"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"

const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

export type ProfileState = {
  error?: string
  success?: string
  fieldErrors?: Record<string, string[]>
}

function fieldErrorsFrom(issues: z.ZodIssue[]): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {}
  for (const issue of issues) {
    const key = String(issue.path[0])
    if (!fieldErrors[key]) fieldErrors[key] = []
    fieldErrors[key].push(issue.message)
  }
  return fieldErrors
}

export async function updateProfile(_prevState: ProfileState, formData: FormData): Promise<ProfileState> {
  const session = await getSession()
  if (!session) redirect("/sign-in")

  const result = profileSchema.safeParse({
    name: formData.get("name"),
  })

  if (!result.success) {
    return { fieldErrors: fieldErrorsFrom(result.error.issues) }
  }

  await db.user.update({
    where: { id: session.userId },
    data: { name: result.data.name },
  })

  revalidatePath("/profile")
  return { success: "Profile updated." }
}

export async function updatePassword(_prevState: ProfileState, formData: FormData): Promise<ProfileState> {
  const session = await getSession()
  if (!session) redirect("/sign-in")

  const result = passwordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  })

  if (!result.success) {
    return { fieldErrors: fieldErrorsFrom(result.error.issues) }
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { password: true },
  })

  if (!user || !user.password) {
    return { error: "Google-authenticated accounts cannot change passwords here." }
  }

  const valid = await bcrypt.compare(result.data.currentPassword, user.password)
  if (!valid) {
    return { error: "Current password is incorrect." }
  }

  const hashed = await bcrypt.hash(result.data.newPassword, 12)
  await db.user.update({
    where: { id: session.userId },
    data: { password: hashed },
  })

  revalidatePath("/profile")
  return { success: "Password updated." }
}
