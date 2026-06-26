import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { signInWithGitHub } from "@/app/auth-actions"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  const session = await auth()
  if (session?.user) redirect("/dashboard")

  const { callbackUrl } = await searchParams

  return (
    <div className="flex min-h-svh items-center justify-center px-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in to Turbo Hub</CardTitle>
          <CardDescription>
            Use GitHub for identity. No repository access is requested at login.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={async () => {
              "use server"
              await signInWithGitHub(callbackUrl)
            }}
          >
            <Button type="submit" className="w-full">
              Continue with GitHub
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
