@AGENTS.md

# AgencyMail

Insurance-specific CRM + marketing automation platform.

## Stack
- Next.js 15 (App Router, TypeScript strict)
- Prisma ORM + PostgreSQL (Neon serverless)
- Clerk (auth, multi-tenancy via orgs)
- tRPC (internal API) + REST (external API)
- shadcn/ui + Tailwind CSS v4
- Resend (email delivery)
- Recharts (analytics charts)

## Architecture
- Multi-tenant via Clerk organizations
- Contact-centric: all marketing data radiates from the contact record
- API keys SHA-256 hashed; raw key shown once on creation
- Merge fields resolved at send time using {{variable}} syntax
- Engagement scoring: opens (1pt), clicks (3pts), SMS replies (5pts), calls (5pts)
- SMS integration via CallIntel webhooks
- CAN-SPAM/TCPA compliant with unsubscribe management

## Key Directories
- `src/server/routers/` - tRPC routers (contacts, campaigns, templates, segments, sequences, sms, analytics, settings)
- `src/modules/marketing/` - Merge fields, system templates
- `src/modules/analytics/` - Engagement scoring
- `src/app/(dashboard)/` - Authenticated dashboard pages
- `src/app/api/v1/` - REST API endpoints
- `src/app/api/webhooks/` - Webhook handlers (Resend, CallIntel)

## Commands
- `npm run dev` - start dev server
- `npx prisma generate` - regenerate Prisma client
- `npx prisma migrate dev` - run migrations
- `npx prisma db push` - push schema changes (dev only)

## IMPORTANT
- Never reference competitor product names in code, UI, comments, or seed data
- Use generic terms like "existing tools" or "other platforms" instead
