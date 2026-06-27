import Link from "next/link"
import { redirect } from "next/navigation"

import { AppNav } from "@/components/app-nav"
import { UserMenu } from "@/components/user-menu"
import { Toaster } from "@/components/ui/sonner"
import { requireUser } from "@/lib/auth/context"
import { timeAsync } from "@/lib/timing"

// Co-locate these functions with the Neon database (us-east-1) to avoid
// cross-region round-trip latency on every query. No effect in local dev.
export const preferredRegion = "iad1"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return timeAsync("render.app.layout", async () => {
    const user = await requireUser().catch(() => null)
    if (!user) redirect("/login")

    return (
      <div className="flex min-h-svh flex-col">
        <header className="sticky top-0 z-40 border-b border-border bg-card/95 shadow-xs backdrop-blur">
          <div className="flex min-h-16 items-center gap-5 px-6 lg:px-10">
            <Link
              href="/dashboard"
              className="shrink-0 font-mono text-base font-semibold tracking-tight"
            >
              turbo-hub
            </Link>
            <AppNav />
            <div className="ml-auto shrink-0">
              <UserMenu
                name={user.name}
                email={user.email}
                image={user.image}
              />
            </div>
          </div>
        </header>
        <main className="min-w-0 flex-1 px-6 py-8 lg:px-10 lg:py-10">
          {children}
        </main>
        <Toaster />
      </div>
    )
  })
}
