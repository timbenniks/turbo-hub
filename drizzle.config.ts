import { defineConfig } from "drizzle-kit"

// drizzle-kit doesn't read .env.local automatically — load it for migrate/studio.
try {
  process.loadEnvFile(".env.local")
} catch {
  // file may be absent on Vercel, where env vars are injected directly
}

export default defineConfig({
  out: "./drizzle",
  schema: "./db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    // Prefer the direct (unpooled) connection for DDL/migrations; fall back to the pooled URL.
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL!,
  },
})
