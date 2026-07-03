"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProfileForm } from "./profile-form"
import { PasswordForm } from "./password-form"
import { PasskeyManager } from "@/components/auth/passkey-manager"
import { User, Shield } from "lucide-react"
import { ConnectedAccounts } from "./connected-accounts"

type UserData = {
  name: string
  email: string
  image: string | null
  initials: string
  memberSince: string
  hasPassword: boolean
  hasGoogle: boolean
  hasGithub: boolean
}

type Credential = {
  id: string
  name: string | null
  deviceType: string
  backedUp: boolean
  createdAt: Date
  lastUsedAt: Date | null
}

export function ProfileTabs({
  user,
  credentials,
}: {
  user: UserData
  credentials: Credential[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get("tab") || "general"

  function onTabChange(value: string) {
    const params = new URLSearchParams(searchParams)
    params.set("tab", value)
    router.replace(`/profile?${params.toString()}`)
  }

  return (
    <div className="mx-auto w-full max-w-4xl p-6">
      <div className="mb-8">
        <h1 className="text-lg font-semibold tracking-tight">Settings</h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Manage your account settings and security preferences
        </p>
      </div>

      <Tabs
        orientation="vertical"
        value={activeTab}
        onValueChange={onTabChange}
        className="gap-6"
      >
        <TabsList className="w-44 shrink-0 bg-transparent">
          <TabsTrigger value="general" className="gap-2 px-3 data-active:bg-muted/50">
            <User className="size-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2 px-3 data-active:bg-muted/50">
            <Shield className="size-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-0">
          <div className="mb-8 flex items-center gap-4">
            <Avatar className="size-16">
              <AvatarImage src={user.image ?? undefined} />
              <AvatarFallback className="text-xl">{user.initials}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-base font-medium">{user.name || "Unnamed"}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Member since {user.memberSince}
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Update your display name.</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm name={user.name} />
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Connected Accounts</CardTitle>
              <CardDescription>
                Link your account with OAuth providers for easier sign-in.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ConnectedAccounts
                hasGoogle={user.hasGoogle}
                hasGithub={user.hasGithub}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-0">
          <div className="space-y-6">
            {user.hasPassword && (
              <Card>
                <CardHeader>
                  <CardTitle>Password</CardTitle>
                  <CardDescription>Change your account password.</CardDescription>
                </CardHeader>
                <CardContent>
                  <PasswordForm />
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Passkeys</CardTitle>
                <CardDescription>
                  Passwordless sign-in using your fingerprint, face, or device PIN
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PasskeyManager initial={credentials} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
