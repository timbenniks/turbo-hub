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
