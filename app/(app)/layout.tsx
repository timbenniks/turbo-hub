import Link from "next/link"
import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { AppNav } from "@/components/app-nav"
import { UserMenu } from "@/components/user-menu"
import { Toaster } from "@/components/ui/sonner"
import {
  bootstrapWorkspace,
  getPrimaryWorkspaceId,
} from "@/lib/services/workspaces"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  // Safety net: ensure a workspace exists even for users created before the
  // bootstrap hook landed.
  const workspaceId = await getPrimaryWorkspaceId(session.user.id)
  if (!workspaceId) {
    await bootstrapWorkspace({
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
    })
  }

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
            name={session.user.name}
            email={session.user.email}
            image={session.user.image}
          />
        </header>
        <main className="min-w-0 flex-1 p-6">{children}</main>
      </div>
      <Toaster />
    </div>
  )
}
