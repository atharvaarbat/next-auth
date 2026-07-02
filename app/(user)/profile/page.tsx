import { redirect } from "next/navigation"
import { Suspense } from "react"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { getPasskeyCredentials } from "@/lib/actions/webauthn"
import { ProfileTabs } from "./profile-tabs"

export default async function ProfilePage() {
  const session = await getSession()
  if (!session) redirect("/sign-in")

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { name: true, email: true, image: true, password: true, createdAt: true },
  })
  if (!user) redirect("/sign-in")

  const credentials = await getPasskeyCredentials()

  const initials = (user.name ?? user.email).charAt(0).toUpperCase()
  const memberSince = new Date(user.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  })

  return (
    <Suspense>
      <ProfileTabs
        user={{
          name: user.name ?? "",
          email: user.email,
          image: user.image,
          initials,
          memberSince,
          hasPassword: !!user.password,
        }}
        credentials={credentials}
      />
    </Suspense>
  )
}
