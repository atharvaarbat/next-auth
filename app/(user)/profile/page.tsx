import { redirect } from "next/navigation"
import Link from "next/link"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ProfileForm } from "./profile-form"
import { PasswordForm } from "./password-form"

export default async function ProfilePage() {
  const session = await getSession()
  if (!session) redirect("/sign-in")

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { name: true, email: true, image: true, password: true, createdAt: true },
  })

  if (!user) redirect("/sign-in")

  const initials = (user.name ?? user.email).charAt(0).toUpperCase()
  const memberSince = new Date(user.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  })

  return (
    <div className="min-h-screen">
      <div className="max-w-lg p-4">
        <div className="mb-8 flex gap-4 items-center  animate-fade-in">
          <Avatar  className="size-20">
            <AvatarImage src={user.image ?? undefined} />
            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-semibold">{user.name ?? "Unnamed"}</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Member since {memberSince}
            </p>
          </div>
        </div>

        <div className="space-y-6 animate-fade-in-up animate-stagger-1">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Update your display name.</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm name={user.name ?? ""} />
            </CardContent>
          </Card>

          {user.password && (
            <>
              <Separator />
              <Card className="animate-fade-in-up animate-stagger-2">
                <CardHeader>
                  <CardTitle>Password</CardTitle>
                  <CardDescription>Change your account password.</CardDescription>
                </CardHeader>
                <CardContent>
                  <PasswordForm />
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
