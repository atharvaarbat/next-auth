import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { signOut } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ModeToggle } from "@/components/ui/theme-toggle"

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect("/sign-in")

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Dashboard</CardTitle>
          <CardDescription>Signed in as {session.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signOut}>
            <ModeToggle/>
            <Button type="submit" variant="outline" className="w-full">
              Sign out
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
