# CardShopDir

A directory of trading card shops across the United States. Browse by state, city, and game (Pokemon, MTG, Yu-Gi-Oh!, and more).

Built with Next.js 16, React 19, Tailwind CSS 4, Drizzle ORM, PostgreSQL, Better Auth, and Stripe.

## Tech Stack

- **Framework**: Next.js 16 (App Router, RSC)
- **Database**: PostgreSQL 16 + Drizzle ORM
- **Auth**: Better Auth
- **Payments**: Stripe
- **Storage**: Cloudflare R2
- **Cache/Rate-limit**: Redis
- **Email**: Plunk
- **Captcha**: Cloudflare Turnstile
- **Analytics**: Plausible

## Getting Started

```bash
bun install
cp .env.example .env  # Fill in your values
bun run db:generate
bun run db:migrate
bun run db:seed
bun run dev
```

## Project Structure

```
app/
├── page.tsx              # Homepage
├── directory/            # State/city/game aggregation pages
├── shop/[slug]/          # Shop detail pages
├── submit/               # Shop submission
├── blog/                 # Blog (Tiptap)
├── admin/                # Admin dashboard
└── api/                  # API routes
```

## Data

Shop data is sourced from public business directories and enriched with LLM-generated descriptions. See `data/shops_final.jsonl` for the cleaned dataset.
