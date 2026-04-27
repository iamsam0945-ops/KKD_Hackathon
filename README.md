This is a [Next.js](https://nextjs.org) app using Prisma with PostgreSQL.

## Getting Started

1) Install dependencies and configure env:

```bash
cp .env.example .env
npm install
```

2) Set `DATABASE_URL` in `.env` to your Postgres connection string.

3) Run database migrations and start the development server:

```bash
npm run db:migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deploy to Vercel (Postgres)

1) Create a Postgres database (Vercel Postgres, Neon, or Supabase).
2) In Vercel project settings, add:
- `DATABASE_URL`
- `JWT_SECRET`
- `NEXT_PUBLIC_BASE_URL`
3) Set build command to:

```bash
npm run vercel-build
```

4) Deploy. This runs Prisma generate + migrations + Next.js build.

## Helpful scripts

```bash
npm run db:generate
npm run db:migrate
npm run db:migrate:deploy
npm run db:studio
```
