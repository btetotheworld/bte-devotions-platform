# BTE Devotions Platform

A production-ready, multi-tenant SaaS platform that enables creators to publish daily devotions, users to subscribe and receive them, and churches to onboard members and run devotion plans.

This application serves as:
- **Multi-tenant SaaS layer** - Manages church spaces, roles, and data isolation
- **Mini frontend for creators** - Custom content creation UI (creators never see Ghost Admin)
- **User-facing app** - Public devotion feeds and member dashboards

Built with Next.js, Ghost CMS (backend engine), Tailwind CSS, and modern email delivery services.

## Goal (MVP)

Ship a web-first, free SaaS that enables:

- **Creators** to publish daily devotions
- **Users** to subscribe and receive them via email
- **Churches** to onboard members and run devotion plans
- **Email delivery** as the default channel
- **WhatsApp delivery** as a paid add-on (post-MVP)

## Non-Goals

- Not trying to be a social network
- Not replacing church management systems
- Not building a custom editor from scratch
- Not rebuilding email infrastructure

## Architecture Overview

```
[Church Admin / Creator] -> Mini Frontend (Next.js) -> Ghost Admin API -> Ghost Backend
                                      |
                                      v
                      Next.js User-Facing App (Members)
                                      |
                                      v
                               Email Delivery (Ghost)
```

### Detailed Architecture

```
┌─────────────────────────────────────────────────────────┐
│         Multi-Tenant SaaS Layer (Next.js)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Mini         │  │ User-Facing   │  │ Multi-Tenant │  │
│  │ Frontend     │  │ App           │  │ Backend      │  │
│  │ (Creators)   │  │ (Members)     │  │              │  │
│  │              │  │              │  │ - API Routes │  │
│  │ - Custom     │  │ - Devotion   │  │ - Database   │  │
│  │   Editor     │  │   Feed       │  │ - Multi-     │  │
│  │ - Scheduling │  │ - Subscribe  │  │   tenant     │  │
│  │ - Dashboard  │  │ - Dashboard   │  │   Logic      │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘  │
└─────────┼──────────────────┼────────────────────────────┘
          │                  │
          │ Ghost Admin API  │ Ghost Content API
          │                  │ Ghost Members API
          ↓                  ↓
┌─────────────────────────────────────────────────────────┐
│         Ghost CMS (Backend Engine)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Content      │  │ Email Engine │  │ Subscriptions│  │
│  │ Storage      │  │ (Scheduling)  │  │ (Members API)│  │
│  │              │  │              │  │              │  │
│  │ - Posts      │  │ - Delivery   │  │ - Auth       │  │
│  │ - Tags       │  │ - Templates  │  │ - Members    │  │
│  │   (church_id)│  │ - Analytics  │  │ - Plans      │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└───────────────────────┬─────────────────────────────────┘
                        │
                        │ Email API
                        ↓
┌─────────────────────────────────────────────────────────┐
│         Email Service (Mailgun/Postmark/SES)            │
│  ┌──────────────┐                                     │
│  │ Daily delivery │                                     │
│  │ Open tracking  │                                     │
│  └──────────────┘                                      │
└─────────────────────────────────────────────────────────┘
```

### Content Flow

1. **Creator logs into mini frontend** → writes devotion → sets schedule
2. **Mini frontend calls Ghost Admin API** → stores post in Ghost → tags with `church_id`
3. **Ghost sends email** to subscribed members automatically
4. **User-facing app fetches devotions** via Ghost Content API → members see devotions filtered by `church_id`

**Key Point**: The multi-tenant backend layer is built inside the Next.js app (API routes + database). Ghost is backend for content & delivery only. Everything runs inside one monorepo.

## What Ghost Provides vs What We Build

### What Ghost Provides (Backend Engine)
- Content storage & publishing
- Scheduling posts & email delivery
- Members API (for auth + subscriptions)
- Post storage & metadata
- Email engine with SMTP integration

### What We Build Ourselves

#### A. Multi-Tenant SaaS Layer
- Church spaces → isolated dashboards per church
- Role-based routing: Church Admins, Creators, Members
- Database stores: `churches | users | roles | ghost_author_ids | subscriptions`
- Multi-tenant enforcement → no church sees other church data

#### B. Mini Frontend for Creators
- Custom rich text/markdown editor (TipTap/Quill/Slate)
- Create and schedule devotions → call Ghost Admin API
- Auto-tag devotion with `church_id`
- Invite creators, manage church-level content
- Optional: analytics via Ghost API
- **Creators never see Ghost Admin interface**

#### C. User-Facing App
- Landing page / church discovery
- Devotion feed filtered by `church_id`
- Subscription forms (via Ghost Members API)
- Church member dashboard

## Tech Stack

| Layer            | Technology                                  |
| ---------------- | ------------------------------------------- |
| Frontend         | Next.js + Tailwind CSS                      |
| Database         | SQLite (dev), PostgreSQL/MySQL (prod) using Prisma |
| Backend          | Next.js API routes                          |
| Content Engine   | Ghost (Self-hosted, Open Source)            |
| Rich Text Editor | TipTap / Quill / Slate                      |
| Email Delivery   | Ghost SMTP (Mailgun/Postmark/SES)           |
| Hosting          | Next.js: Vercel, Ghost: DigitalOcean/Fly.io |

### Key Notes

- **Ghost Admin is never shown to creators** - they use our custom mini frontend
- **Mini frontend handles church-scoped content creation and multi-tenancy**
- **Database stores church info, users, and mappings** - separate from Ghost's database
- **Ghost remains the backend engine** for content, scheduling, and email
- **Multi-tenant backend is part of Next.js** - no separate backend service needed for MVP

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) 1.1.0+ (enforced via preinstall script)
- Node.js 20+ (if not using Bun)
- Docker and Docker Compose (for local Ghost instance)

### Installation

#### 1. Set Up Local Ghost Instance

Ghost runs separately from the monorepo. Each developer runs their own local Ghost instance.

**📖 See the [Ghost Setup Guide](./docs/GHOST_SETUP.md) for complete setup instructions.**

Quick steps:
1. Navigate to `../ghost` directory (sibling to monorepo)
2. Start Ghost: `docker compose up -d`
3. Access Ghost Admin: http://localhost:2368/ghost
4. Create admin account and get API keys
5. Configure API keys in monorepo `.env.local`

#### 2. Set Up Monorepo

```bash
# Install dependencies (installs for all workspaces)
bun install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Ghost API credentials (get from Ghost Admin)

# Generate Prisma client
bun db:generate

# Push database schema
bun db:push

# Seed database with initial roles
bun db:seed
```

**Important:** Each developer runs their own local Ghost instance. Never share Ghost databases or commit Ghost content to Git. See [Ghost Setup Guide](./docs/GHOST_SETUP.md) for details.

### Running the Applications

This is a monorepo with two separate Next.js applications:

```bash
# Run user-facing app (port 3000)
bun dev:user

# Run admin app for creators (port 3001)
bun dev:admin
```

- **User App**: [http://localhost:3000](http://localhost:3000) - For church members
- **Admin App**: [http://localhost:3001](http://localhost:3001) - For creators and church admins
- **Ghost Admin**: [http://localhost:2368/ghost](http://localhost:2368/ghost) - Ghost CMS admin (creators don't use this)
- **Ghost Public**: [http://localhost:2368](http://localhost:2368) - Ghost public site

### Environment Variables

Create a `.env.local` file in the monorepo root with the following variables:

```env
# Ghost CMS Configuration (Local Development)
GHOST_URL=http://localhost:2368
GHOST_CONTENT_API_KEY=your-content-api-key-from-ghost-admin
GHOST_ADMIN_API_KEY=your-admin-api-key-from-ghost-admin
GHOST_MEMBERS_API_URL=http://localhost:2368

# Database (Multi-Tenant SaaS Layer)
DATABASE_URL=file:./dev.db  # SQLite for MVP
# DATABASE_URL=postgresql://...  # PostgreSQL for production

# Email Service (configured in Ghost, optional here)
EMAIL_SERVICE_API_KEY=your-email-service-key
EMAIL_SERVICE_PROVIDER=mailgun|postmark|ses
```

## Monorepo Structure

```
/bte-devotions-platform
├── /apps
│   ├── /user-app          # User-facing app for members (port 3000)
│   │   ├── app/           # Next.js App Router
│   │   │   ├── api/       # API routes (auth, churches, users, ghost)
│   │   │   ├── feed/      # Devotion feed
│   │   │   ├── subscribe/ # Subscription pages
│   │   │   └── dashboard/ # Member dashboard
│   │   ├── package.json
│   │   ├── next.config.ts
│   │   └── tsconfig.json
│   └── /admin-app         # Mini frontend for creators & church admins (port 3001)
│       ├── app/           # Next.js App Router
│       │   ├── api/       # API routes (auth, churches, users, ghost)
│       │   ├── create/    # Content creation UI
│       │   ├── dashboard/ # Creator dashboard
│       │   └── manage/     # Church management
│       ├── package.json
│       ├── next.config.ts
│       └── tsconfig.json
├── /packages
│   ├── /components        # Shared UI components
│   │   └── editor/        # Rich text editor (TipTap/Quill/Slate)
│   ├── /lib               # Shared utilities
│   │   ├── auth/          # Authentication (Ghost integration, sessions, middleware)
│   │   ├── multi-tenant/  # Multi-tenant context and middleware
│   │   ├── types/         # TypeScript types (auth, tenant)
│   │   └── utils.ts       # Shared utilities
│   └── /database          # Database models & schema
│       ├── prisma/
│       │   ├── schema.prisma  # Multi-tenant schema
│       │   └── seed.ts        # Database seeding
│       ├── db/            # Prisma client
│       └── package.json
├── /scripts               # Utility scripts
│   └── enforce-bun.js     # Bun version enforcement
├── /styles                # Shared Tailwind / global styles
├── package.json           # Root workspace package.json
├── turbo.json             # Turborepo config
└── tsconfig.json          # Base TypeScript config
```

**Key Points:**
- Both apps share components, utils, and database models via workspace packages
- Multi-tenant enforcement is in shared `packages/lib/multi-tenant`
- Authentication and Ghost integration are in `packages/lib/auth`
- Database schema and Prisma client are in `packages/database`
- Each app runs independently on different ports
- Workspace dependencies are managed via Bun workspaces

## Features

### For Creators
- Publish daily devotions using custom mini frontend (TipTap/Quill/Slate editor)
- Schedule content for automatic delivery
- Church-scoped content creation (multi-tenant isolation)
- Track engagement metrics (open rates, clicks)
- Manage subscriber lists
- **Note**: Creators use our custom UI, never see Ghost Admin interface

### For Users
- Subscribe to devotion plans
- Receive daily devotions via email
- Access devotion archive
- Manage subscription preferences

### For Churches
- Onboard members to devotion plans
- Create and manage church-specific devotion plans
- Track member engagement
- Bulk subscription management

## Success Metrics (MVP)

- Creators onboarded
- Churches onboarded
- Daily email open rate
- Consistency of devotion delivery

## Development Order

1. **Set up database & multi-tenant layer** ✅
   - Auth, roles, church-user mappings
   - Multi-tenant API routes
   - Database schema with Prisma

2. **Set up local Ghost instance** ✅
   - Docker Compose setup (see `../ghost/`)
   - API key configuration
   - See [Ghost Setup Guide](./docs/GHOST_SETUP.md) for details

3. **Ghost API integration** ✅
   - Admin API for creating posts
   - Content API for fetching devotions
   - Members API for authentication

3. **Build Mini Frontend** (`/apps/admin-app`) - In Progress
   - Create devotions, schedule, invite creators
   - Custom rich text editor integration
   - Church-scoped content management

4. **Build User-Facing App** (`/apps/user-app`) - In Progress
   - Fetch devotions from Ghost
   - Display feed filtered by `church_id`
   - Subscription forms and member dashboard

5. **Landing page / public pages**
   - Church discovery
   - Public devotion previews

6. **Test multi-tenant isolation & end-to-end flow**
   - Verify church data isolation
   - Test content creation → delivery flow

7. **Polish UI, styling, responsive design**

## Available Scripts

```bash
# Development
bun dev:user         # Start user-facing app (port 3000)
bun dev:admin        # Start admin app (port 3001)

# Production
bun build            # Build all apps and packages
bun start            # Start production servers

# Code Quality
bun lint             # Run ESLint on all workspaces
bun type-check       # TypeScript type checking for all workspaces

# Database
bun db:generate      # Generate Prisma client
bun db:push          # Push database schema (dev)
bun db:migrate       # Run database migrations
bun db:studio        # Open Prisma Studio
bun db:seed          # Seed database with initial data

# Utilities
bun clean            # Clean build artifacts and node_modules
```

## Multi-Tenant Backend Layer

The multi-tenant backend is built inside the Next.js app (API routes + database), not a separate service.

### Database Schema (Prisma)

Stores:
- **Church info**: `church_id`, name, settings, etc.
- **Users**: `user_id`, role, `church_id` (mapping to church)
- **Ghost mappings**: `ghost_author_id` ↔ `church_id` (links Ghost authors to churches)
- **Roles**: Church Admins, Creators, Members
- **Subscriptions**: Member subscription preferences

### Next.js API Routes Handle

- Mapping content to church (enforcing `church_id` tags)
- Multi-tenant authentication and authorization
- Admin/creator logic (inviting creators, scheduling posts)
- Church-scoped data queries (ensuring isolation)

### Authentication Flow

1. User signs up/logs in through Ghost Members API
2. Ghost handles authentication and session management
3. Next.js multi-tenant layer maps users to churches and roles
4. Role-based access control: Church Admins, Creators, Members
5. User profile and subscription data managed by Ghost
6. Church relationships and permissions stored in Next.js database

## Email Delivery

Email delivery is handled by Ghost's built-in email engine, connected to your chosen email service provider:

1. **Mailgun** - Recommended for high-volume delivery
2. **Postmark** - Great deliverability and analytics
3. **Amazon SES** - Cost-effective for large scale

Configuration is done through Ghost's admin panel. Ghost handles all email scheduling, delivery, and tracking automatically.

## Deployment

### Web Apps (Vercel)

Each app can be deployed independently:

1. **User App** (`apps/user-app`):
   - Connect to Vercel
   - Set root directory to `apps/user-app`
   - Configure environment variables
   - Deploy on port 3000

2. **Admin App** (`apps/admin-app`):
   - Connect to Vercel (separate project or same)
   - Set root directory to `apps/admin-app`
   - Configure environment variables
   - Deploy on port 3001

### Ghost CMS

1. Deploy Ghost to DigitalOcean or Fly.io
2. Configure email service in Ghost admin panel
3. Set up custom domain
4. Configure API keys for Next.js integration

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

**Contributors should join our dedicated WhatsApp group**: [Join the BTE Devotions Platform WhatsApp Group](https://chat.whatsapp.com/GOfWeuAKerICPOqFbLdH4x)

## License

MIT

## Related Resources

- [Ghost Documentation](https://ghost.org/docs/)
- [Ghost Members API](https://ghost.org/docs/members/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## Support

For issues, questions, or contributions, please open an issue on GitHub.

---

**Built with love for the BTE community**
