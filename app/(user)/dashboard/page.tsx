import Link from "next/link"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { signOut } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ModeToggle } from "@/components/ui/theme-toggle"

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect("/sign-in")

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Dashboard</CardTitle>
          <CardDescription>Signed in as {session.email}</CardDescription>
        </CardHeader>
        {/* <CardContent className="space-y-3">
          <Link href="/profile?tab=general">
            <Button variant="outline" className="w-full">
              Profile & Security
            </Button>
          </Link>
          <Separator />
          <div className="flex items-center justify-between gap-2">
            <ModeToggle />
            <form action={signOut}>
              <Button type="submit" variant="outline">
                Sign out
              </Button>
            </form>
          </div>
        </CardContent> */}
      </Card>
    </div>
  )
}
