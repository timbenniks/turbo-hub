import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import { DrizzleAdapter } from "@auth/drizzle-adapter"

import { db } from "@/db"
import { accounts, sessions, users, verificationTokens } from "@/db/schema"
import { bootstrapWorkspace } from "@/lib/services/workspaces"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  // GitHub login is identity-only — default scope (read:user, user:email).
  // No repo scopes at login (spec §14.1, §19.1).
  providers: [GitHub],
  // Database-backed sessions (spec §14.3).
  session: { strategy: "database" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    session({ session, user }) {
      // Expose the user id on the session (spec §28.1).
      if (session.user) {
        session.user.id = user.id
      }
      return session
    },
  },
  events: {
    // First sign-in: create personal workspace + owner membership (spec §14.2).
    async createUser({ user }) {
      if (!user.id) return
      await bootstrapWorkspace({
        id: user.id,
        name: user.name,
        email: user.email,
      })
    },
  },
})
