# AGENTS.md

This file describes the project setup for LLM coding assistants.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Components:** shadcn/ui primitives
- **ORM:** Drizzle ORM
- **Database:** Neon (serverless Postgres), connected via Vercel integration
- **Hosting:** Vercel

## Project Structure

- `app/` - Next.js App Router pages and layouts
- `components/` - shadcn/ui and custom components
- `db/schema.ts` - Drizzle ORM schema definitions
- `drizzle.config.ts` - Drizzle Kit configuration
- `.env.local` - Environment variables (DATABASE_URL, etc.)

## Database

### Connection

The database connection string is stored in the `DATABASE_URL` environment variable. It is set by the Vercel + Neon integration and pulled to `.env.local` for local development.

The Neon serverless driver (`@neondatabase/serverless`) is installed for use with Drizzle ORM.

### Schema

Define your database tables in `db/schema.ts`. Example:

```ts
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### Migrations

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
npx drizzle-kit push
npx drizzle-kit studio
```
## Development

```bash
npm run dev
```

## Deployment

The project is deployed automatically via Vercel on push to the main branch.

## Code standards

Every phase (and any non-trivial change) ends with an audit pass. Do not mark
work done until it holds up against all of these:

- **DRY** — one source of truth. No copy-pasted constants, helpers, or types.
  Enum values live once in `lib/enums.ts` and are derived by both the Drizzle
  `pgEnum` and the Zod schemas; display strings go through `lib/labels.ts`.
- **Conciseness** — least code that reads clearly. Delete dead code and
  needless indirection; prefer small focused modules over large ones.
- **Great architecture** — respect the layering: UI / API / MCP / CLI all call
  the same domain services in `lib/services/`; nothing touches the DB outside
  that layer. Keep shared modules pure (no server-only imports) so client
  bundles stay clean.
- **shadcn/ui primitives** — build UI from the components in `components/ui/`
  (base-ui under the hood). Add missing primitives with `npx shadcn@latest add`
  rather than hand-rolling. Extend via composition, not forks. Only drop to a
  raw element when no primitive fits, and wrap it as a reusable `components/ui/`
  component (e.g. `native-select.tsx`) instead of inlining styles.

Gate: `npm run typecheck` and `npm run lint` must pass clean before done.
