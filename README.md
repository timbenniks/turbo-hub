# turbo-hub

Built with [turbo-project](https://github.com/timbenniks/Turbo-Project).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui |
| ORM | Drizzle |
| Database | Neon (serverless Postgres) |
| Hosting | Vercel |

## Getting Started

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database

```bash
# Generate migrations after schema changes
npx drizzle-kit generate

# Apply migrations
npx drizzle-kit migrate

# Push schema directly (dev only)
npx drizzle-kit push

# Open Drizzle Studio
npx drizzle-kit studio
```

Schema definitions live in `db/schema.ts`.
## Deployment

Deployed automatically via Vercel on push to main.
