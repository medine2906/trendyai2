# ShopMind

## Purpose & Vision

ShopMind aims to fix a gap in traditional e-commerce platforms: products are
usually presented with dry technical specs or shallow descriptions, leaving
shoppers to guess whether an item actually fits their needs. ShopMind closes
that gap with LLM-powered, contextual product understanding — and layers a
social feed on top, so product discovery feels organic, interactive, and
trust-driven rather than a plain search box.

## Target Audience

- **Tech-forward shoppers** — comfortable interacting with AI and open to new,
  conversational shopping experiences.
- **Information-seeking shoppers** — people who struggle to translate technical
  specs ("polyester, 180 g/m²") into a real answer to "will this actually keep
  me warm?"
- **Social & trust-driven shoppers** — people who want to see what others they
  follow liked, saved, or are talking about before they buy, and who take
  inspiration from their social circle's shopping habits.

## Value Proposition

- **Natural-language search & AI advisory** — instead of keyword soup, users
  type something like *"seyahat için hafif ve buruşmayan bir gömlek"* and the
  AI extracts the real constraints behind the sentence (fabric, fit, season,
  occasion) and returns the products that actually match, with a plain-language
  explanation of *why*.
- **Rich, contextual product summaries** — beyond the raw listing, each product
  carries an AI-generated summary covering fabric, best use case, and seasonal
  fit, in language a non-expert can act on.
- **Social discovery & trust** — the home feed surfaces what people you follow
  liked, saved, or commented on, reinforcing a sense of community and making
  discovery feel like a recommendation from a friend rather than an algorithm.

## Architecture

The product vision above was originally scoped around a Firebase stack
(Firestore, Genkit/Gemini, Firebase Auth/Storage/Cloud Functions). The project
has since been **rebuilt without Firebase** on a more conventional, self-hosted
web stack — the vision and feature set are unchanged, only the implementation:

| Layer | Firebase-era plan | Current implementation |
|---|---|---|
| Framework | React/Next.js (unspecified) | **Next.js 16** (App Router) + **React 19** |
| Database | Firestore (NoSQL, collections/documents) | **SQLite via Prisma ORM** (relational schema, migrations) |
| Auth | Firebase Authentication (+ Google) | **NextAuth v5** — Credentials (bcrypt) + Google OAuth, JWT sessions, no adapter (Google users are upserted manually in the `signIn` callback) |
| Serverless logic | Firebase Cloud Functions | Next.js **route handlers / server actions** (e.g. like-count updates, notifications happen in-process against Prisma) |
| Media storage | Firebase Storage | Real product images scraped directly from source retailers (`m.media-amazon.com`, Trendyol CDN) — no user-media upload pipeline yet beyond profile pictures on local disk |
| AI | Google Gemini API | **Groq** (`groq-sdk`, `llama-3.3-70b-versatile`) for natural-language intent extraction, product summarization, and chat-based search |
| Styling / UI | unspecified | **Tailwind v4** (CSS-first config) + hand-built UI primitives in `src/components/ui/` (no shadcn/ui dependency) |
| Hosting | Firebase's serverless/auto-scaling infra | Not yet decided in production — Railway/Fly.io + managed Postgres is the current default recommendation; AWS EC2+RDS considered only if explicitly required |

### Data model (Prisma / SQLite, relational — not document-based)

- **User** — `username`, `email`, `passwordHash`, `profilePictureUrl`,
  `isPrivate`, follower/following relations.
- **Product** — `name`, `price`, `imageUrls`, `sourceSite`/`sourceUrl`
  (Amazon/Trendyol), `aiSummary`, `fabric`, `season`, `tags`, plus newer
  `sourceType`, `specifications` (JSON), `rawDescription` fields for richer
  future LLM tagging.
- **Comment**, **ProductLike**, **Follow**, **CartItem** — relational tables
  modeling the interactions between users and products, replacing the
  Firestore sub-collection/array approach with proper foreign keys.
- `Order`/`Address`/`OrderItem` models still exist in the schema but are
  currently unused — checkout was removed (see below).

### AI integration

- `src/lib/groq.ts` powers `/chat` and `/api/chat`: a multi-stage pipeline
  extracts implicit/contextual constraints from the conversation (e.g. "I'll
  wear this to a windy outdoor wedding" → avoid flowy skirts, prefer fitted
  cuts), scores a candidate product pool against those constraints, then asks
  the LLM to pick and explain matches in plain language.
- If `GROQ_API_KEY` is not configured, the app degrades gracefully to a local
  keyword/substring search instead of failing.
- `prisma/classify-products.ts` batches un-tagged products to Groq to generate
  `fabric`/`season`/`tags`/`aiSummary`; falls back to regex/keyword tagging on
  API failure so no product is ever left untagged.

### Product data pipeline

Rather than a manually curated catalog, products are ingested through a
pluggable adapter architecture (`prisma/sources/`): each source site (Amazon,
Trendyol) implements a shared `SourceAdapter` interface (cheerio-based or
Playwright-based, for sites behind bot protection like Cloudflare), and
`prisma/sources/run.ts` upserts results into the `Product` table and prunes
stale listings — with a safety guard so a temporary block/503 from one source
can't wipe out its entire catalog. `npm run products:refresh` runs the full
ingestion + AI classification chain; a Windows Task Scheduler job repeats it
every 6 hours.

## Features (current MVP)

- **User management** — email/password signup+login and Google OAuth.
- **Home feed** — story reel, post feed with like/save, and a "recommended for
  you" section.
- **AI search** (`/chat`) — natural-language product search with contextual
  reasoning; tapping a suggested product goes straight to its source listing
  (Amazon/Trendyol), not an internal checkout.
- **Product pages** (`/product/[id]`) — price in TRY, AI summary, "Add to Cart",
  and a link out to the original retailer.
- **Cart** (`/cart`) — storage only, intentionally **no checkout/payment flow**
  (removed for legal/compliance reasons); items link out to the retailer.
- **Social features** — `/explore`, `/messages`, `/saved`, `/activity`,
  `/profile/[username]` with real privacy enforcement (private accounts only
  show posts to approved followers).
- **Search history** (`/history`).

## Security & Scalability notes (current state, not aspirational)

- **AI response safety** — no dedicated content-moderation filter is in front
  of Groq responses yet (unlike the original Gemini-safety-filter plan); this
  is a known gap, not implemented.
- **Rate limiting** — a lightweight in-memory limiter (`src/lib/rate-limit.ts`)
  protects `/api/signup`, `/api/waitlist`, `/api/chat` (Groq cost abuse), and
  the credentials login path. It runs per-process only — a multi-instance or
  serverless deployment would need a shared store (e.g. Redis) instead.
- **Data privacy** — no formal KVKK/GDPR compliance program has been built;
  private-account visibility is enforced at the query level, and images are
  validated by real file byte signatures (not just client-declared MIME type)
  on upload.
- **HTTP security headers** — CSP, X-Content-Type-Options, X-Frame-Options,
  Referrer-Policy, Permissions-Policy, and HSTS (prod only) are set in
  `next.config.ts`.
- **Scalability** — unlike Firebase's managed auto-scaling serverless infra,
  this stack requires an explicit hosting decision; SQLite in particular is
  not intended for multi-instance production use and would need to move to a
  managed Postgres instance before scaling horizontally.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

See `.env.example` for required environment variables (`GROQ_API_KEY`,
`GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`, `AUTH_SECRET`, etc.).

## More info

For up-to-date project status, recent changes, and known gaps, see
[CLAUDE.md](CLAUDE.md) — it's updated after every significant change.
