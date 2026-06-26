import { drizzle } from "drizzle-orm/neon-http"
import { neon, neonConfig } from "@neondatabase/serverless"

import * as schema from "./schema"
import { timeAsync, timingsEnabled } from "@/lib/timing"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set")
}

if (timingsEnabled()) {
  neonConfig.fetchFunction = (input: RequestInfo | URL, init?: RequestInit) =>
    timeAsync("db.fetch", () => fetch(input, init))
}

const sql = neon(process.env.DATABASE_URL)

export const db = drizzle(sql, { schema })

export { schema }
