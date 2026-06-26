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
    <div className="flex min-h-svh">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border p-3 md:flex">
        <Link
          href="/dashboard"
          className="mb-4 px-2.5 font-mono text-sm font-semibold tracking-tight"
        >
          turbo-hub
        </Link>
        <AppNav />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 items-center justify-end gap-3 border-b border-border px-4">
          <UserMenu
            name={user.name}
            email={user.email}
            image={user.image}
          />
        </header>
        <main className="min-w-0 flex-1 p-6">{children}</main>
      </div>
      <Toaster />
    </div>
  )
  })
}
