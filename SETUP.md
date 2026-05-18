# UniStocker — Setup Guide

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ (local or hosted)
- Redis 6+ (local or hosted — required for job queues)
- Cloudinary account (product images)
- Resend account (transactional email)
- Firebase project (push notifications)

---

## Step 1 — Clone & Install

```bash
cd unistocker
npm install
```

---

## Step 2 — Configure Environment

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Required variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random 32-byte string (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Your app URL (e.g. `http://localhost:3000`) |
| `REDIS_URL` | Redis connection URL |
| `CLOUDINARY_*` | From Cloudinary dashboard |
| `RESEND_API_KEY` | From resend.com |
| `FIREBASE_*` | Firebase Admin SDK service account |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase web app config |

---

## Step 3 — Database Setup

Run migrations to create all tables:

```bash
npm run db:migrate
```

Seed with sample data (optional):

```bash
npm run db:seed
```

Default login after seed:
- **Email:** boss@unistocker.app
- **Password:** admin123

---

## Step 4 — Start the App

**Terminal 1 — Next.js dev server:**
```bash
npm run dev
```

**Terminal 2 — Background workers (BullMQ):**
```bash
npm run workers:dev
```

---

## Step 5 — PWA Icons

Generate icons at `public/icons/` in sizes: 72, 96, 128, 144, 152, 192, 384, 512.
Use a tool like [RealFaviconGenerator](https://realfavicongenerator.net/) or generate from an SVG:

```bash
# Install sharp globally once
npm install -g sharp-cli
sharp -i logo.png -o public/icons/icon-192x192.png resize 192 192
# ... repeat for all sizes
```

---

## Step 6 — Firebase Push Notifications (Optional)

1. Create a Firebase project at console.firebase.google.com
2. Enable Cloud Messaging
3. Download the Admin SDK JSON key and copy values to `.env`
4. Add your VAPID key from Firebase project settings → Cloud Messaging

---

## Production Deployment

### Environment (Vercel / Railway / Render)

Add all `.env` variables to your platform.

### Database

Use managed PostgreSQL: Supabase, Railway, Neon, or AWS RDS.

### Redis

Use managed Redis: Upstash, Railway, or Redis Cloud.

### Workers

Deploy workers as a separate process/dyno:
```bash
npm run workers
```

Or use a background job service that runs `workers/index.ts`.

### Build & Deploy

```bash
npm run build
npm run start
```

---

## Architecture

```
Browser / Mobile
       │
       ▼
Next.js App Router (SSR + Server Actions)
       │
       ├── PostgreSQL (Prisma ORM)
       │
       ├── BullMQ Queue (Redis)
       │         │
       │         ▼
       │    Workers Process
       │         ├── Firebase (Push)
       │         ├── Resend (Email)
       │         └── Activity Logs
       │
       └── Cloudinary (Images)
```

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run workers` | Start background workers |
| `npm run workers:dev` | Workers with hot reload |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run database migrations |
| `npm run db:push` | Push schema without migrations |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:seed` | Seed sample data |

---

## Folder Structure

```
unistocker/
├── app/
│   ├── (app)/              # Protected app routes
│   │   ├── dashboard/      # Main dashboard
│   │   ├── inventory/      # Product management
│   │   ├── sales/          # Sales recording
│   │   ├── reports/        # Analytics
│   │   ├── notifications/  # Notification center
│   │   └── settings/       # User & staff settings
│   ├── auth/               # Login / Register pages
│   └── api/auth/           # NextAuth handler
├── components/
│   ├── auth/               # Login/register forms
│   ├── dashboard/          # Stats, charts, activity
│   ├── inventory/          # Product table, add form
│   ├── sales/              # POS interface, table
│   ├── notifications/      # Notification list
│   ├── settings/           # Staff management
│   └── layout/             # Sidebar, header
├── lib/
│   ├── auth.ts             # NextAuth config
│   ├── db.ts               # Prisma client
│   ├── actions/            # Server Actions
│   ├── auth/permissions.ts # RBAC
│   ├── notifications/      # Push + email senders
│   └── queue/              # BullMQ queue definitions
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Seed script
├── workers/                # Background job workers
├── types/                  # TypeScript definitions
└── public/
    ├── manifest.json       # PWA manifest
    ├── sw.js               # Service worker
    └── icons/              # App icons
```
