import Link from "next/link"
import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { Button } from "@/components/ui/button"

export default async function LandingPage() {
  const session = await auth()
  if (session?.user) redirect("/dashboard")

  return (
    <div className="mx-auto flex min-h-svh max-w-2xl flex-col justify-center gap-8 px-6">
      <div className="space-y-4">
        <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
          Turbo Hub
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-balance">
          Build software with agents without losing the plot.
        </h1>
        <p className="leading-relaxed text-pretty text-muted-foreground">
          A project operating system for people building with AI agents. Store
          intent, specs, tasks, agent runs, pull requests, decisions, and
          reusable patterns in one durable system — so every project makes the
          next one smarter.
        </p>
      </div>
      <div>
        <Button render={<Link href="/login" />} nativeButton={false}>
          Sign in with GitHub
        </Button>
      </div>
    </div>
  )
}
