# BTE Devotions Platform - Project Summary

## Vision

Build a web-first, free multi-tenant SaaS platform that empowers the Christian community to create, share, and engage with daily devotions. The platform serves three key user groups: content creators, individual subscribers, and churches seeking to foster spiritual growth among their members.

**Key Idea**: Ghost handles content & delivery, we handle multi-tenancy, user/admin UI, and app logic.

This application serves as:

-  **Multi-tenant SaaS layer** - Manages church spaces, roles, and data isolation
-  **Mini frontend for creators** - Custom content creation UI (creators never see Ghost Admin)
-  **User-facing app** - Public devotion feeds and member dashboards

**Architecture Overview**:

```
[Church Admin / Creator] -> Mini Frontend (Next.js) -> Ghost Admin API -> Ghost Backend
                                      |
                                      v
                      Next.js User-Facing App (Members)
                                      |
                                      v
                               Email Delivery (Ghost)
```

## Project Overview

### MVP Goals

The Minimum Viable Product (MVP) focuses on delivering core functionality that enables:

1. **Content Creation**: Allow creators to publish daily devotions using a custom mini frontend with rich text editor (TipTap/Quill/Slate)
2. **User Subscriptions**: Enable users to subscribe to devotion plans and receive daily content
3. **Church Management**: Provide churches with tools to onboard members and manage devotion plans
4. **Email Delivery**: Deliver devotions reliably via email (default channel)
5. **Future Expansion**: Lay foundation for WhatsApp delivery as a paid add-on (post-MVP)

### Core Principles

-  **Open Source Leverage**: Don't reinvent the wheel - use proven open-source solutions
-  **Simplicity First**: Focus on core features, avoid feature bloat
-  **Free Tier**: Make the platform accessible to all users
-  **Web-First**: Optimize for web experience, mobile-responsive design

## Non-Goals (Important Boundaries)

To maintain focus and avoid scope creep, we explicitly exclude:

-  **Social Network Features**: Not building a social media platform
-  **Church Management System**: Not replacing existing CMS solutions
-  **Custom Editor**: Using existing rich text editor libraries (TipTap/Quill/Slate), not building from scratch
-  **Email Infrastructure**: Not rebuilding email delivery systems

## What Ghost Provides vs What We Build

### What Ghost Provides (Backend Engine)

-  Content storage & publishing
-  Scheduling posts & email delivery
-  Members API (for auth + subscriptions)
-  Post storage & metadata
-  Email engine with SMTP integration

### What We Build Ourselves

#### A. Multi-Tenant SaaS Layer

-  Church spaces → isolated dashboards per church
-  Role-based routing: Church Admins, Creators, Members
-  Database stores: `churches | users | roles | ghost_author_ids | subscriptions`
-  Multi-tenant enforcement → no church sees other church data

#### B. Mini Frontend for Creators

-  Custom rich text/markdown editor (TipTap/Quill/Slate)
-  Create and schedule devotions → call Ghost Admin API
-  Auto-tag devotion with `church_id`
-  Invite creators, manage church-level content
-  Optional: analytics via Ghost API
-  **Creators never see Ghost Admin interface**

#### C. User-Facing App

-  Landing page / church discovery
-  Devotion feed filtered by `church_id`
-  Subscription forms (via Ghost Members API)
-  Church member dashboard

## Architecture Decision

### Technology Stack

#### Frontend (Web App)

-  **Next.js 16** (React) - Modern React framework with App Router
-  **Tailwind CSS v4** - Utility-first styling
-  **shadcn/ui** - High-quality component library
-  **TypeScript** - Type safety throughout
-  **Rich Text Editor** - TipTap / Quill / Slate for custom creator interface

#### Content & Email Core

-  **Ghost CMS** (Self-hosted, Open Source) - Backend engine only
   -  Content storage and publishing
   -  Native email engine for newsletters and scheduling
   -  Members API for authentication and subscriptions
   -  **Note**: Creators never see Ghost Admin - they use our custom mini frontend

#### Authentication

-  **Ghost Members API** - Native authentication system
   -  Handles user signup, login, and session management
   -  Integrated with Next.js frontend
   -  No need for separate auth service

#### Email Delivery

-  **Mailgun** / **Postmark** / **Amazon SES**
   -  Connected directly to Ghost's email engine
   -  Handles transactional and newsletter emails
   -  Built-in open tracking and analytics

#### Database

-  **Next.js Multi-Tenant Database**
   -  SQLite for dev (simple, file-based)
   -  PostgreSQL/MySQL for production (scalable)
   -  Uses Prisma ORM for database management
   -  Schema: `churches | users | roles | ghost_author_ids | subscriptions`
   -  Stores church information, users, roles, and mappings
   -  Manages multi-tenant data isolation
-  **Ghost's Database** - Handles content storage, members, and subscriptions separately

#### Hosting

-  **Ghost**: DigitalOcean / Fly.io (self-hosted)
-  **Web App**: Vercel (optimized for Next.js)

### Tech Stack Summary

| Layer            | Technology                                         |
| ---------------- | -------------------------------------------------- |
| Frontend         | Next.js + Tailwind CSS                             |
| Database         | SQLite (dev), PostgreSQL/MySQL (prod) using Prisma |
| Backend          | Next.js API routes                                 |
| Content Engine   | Ghost (Self-hosted, Open Source)                   |
| Rich Text Editor | TipTap / Quill / Slate                             |
| Email Delivery   | Ghost SMTP (Mailgun/Postmark/SES)                  |
| Hosting          | Next.js: Vercel, Ghost: DigitalOcean/Fly.io        |

### Why This Stack?

1. **Ghost CMS**:

   -  Open source, battle-tested backend engine
   -  Content storage and publishing
   -  Native email capabilities and scheduling
   -  Members API for auth (no custom auth needed)
   -  Active community and documentation
   -  **Note**: Used as backend only - creators use custom frontend

2. **Next.js**:

   -  Server-side rendering for SEO
   -  App Router for modern React patterns
   -  Easy deployment on Vercel
   -  Great developer experience

3. **Tailwind CSS**:

   -  Rapid UI development
   -  Consistent design system
   -  Mobile-first responsive design

4. **Email Services**:
   -  Proven deliverability
   -  Built-in analytics
   -  No need to build email infrastructure

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│         Multi-Tenant SaaS Layer (Next.js)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Mini         │  │ User-Facing   │  │ Multi-Tenant │  │
│  │ Frontend     │  │ App           │  │ Database     │  │
│  │ (Creators)   │  │ (Members)     │  │              │  │
│  │              │  │              │  │ - Churches   │  │
│  │ - Custom     │  │ - Devotion   │  │ - Users      │  │
│  │   Editor     │  │   Feed       │  │ - Roles      │  │
│  │   (TipTap/   │  │ - Subscribe  │  │ - Mappings  │  │
│  │   Quill/     │  │ - Archive    │  │ - Ghost IDs │  │
│  │   Slate)     │  │              │  │              │  │
│  │ - Scheduling │  │              │  │              │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘  │
└─────────┼──────────────────┼────────────────────────────┘
          │                  │
          │ Ghost Admin API   │ Ghost Content API
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
│  │ - Metadata   │  │              │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │         Ghost Database                           │   │
│  │  - Content storage                                │   │
│  │  - Member data                                     │   │
│  │  - Subscriptions                                   │   │
│  └──────────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────────┘
                        │
                        │ Email API
                        ↓
┌─────────────────────────────────────────────────────────┐
│      Email Service (Mailgun/Postmark/SES)                │
│  ┌──────────────┐                                     │
│  │ Daily delivery │                                     │
│  │ Open tracking  │                                     │
│  │ Click tracking │                                     │
│  │ Analytics      │                                     │
│  └──────────────┘                                      │
└─────────────────────────────────────────────────────────┘
```

### Content Flow

1. **Creator writes devotion** in custom mini frontend (TipTap/Quill/Slate) → selects schedule
2. **Next.js backend calls Ghost Admin API** → post stored in Ghost, tagged with `church_id`
3. **Ghost handles email delivery** to subscribers automatically
4. **Next.js user-facing app fetches devotions** via Ghost Content API → members see their church's content filtered by `church_id`

## User Personas

### 1. Content Creator

**Goals:**

-  Publish daily devotions easily
-  Reach and grow audience
-  Track engagement

**Features:**

-  Custom mini frontend with rich text editor (TipTap/Quill/Slate)
-  Content scheduling via Ghost Admin API
-  Church-scoped content creation (multi-tenant)
-  Analytics dashboard
-  Subscriber management
-  **Note**: Never see Ghost Admin interface

### 2. Individual User

**Goals:**

-  Receive daily devotions
-  Access devotion archive
-  Manage subscriptions

**Features:**

-  Email subscription
-  Web-based devotion feed
-  Subscription preferences
-  Archive access

### 3. Church Administrator

**Goals:**

-  Onboard church members
-  Manage devotion plans
-  Track member engagement

**Features:**

-  Bulk member onboarding
-  Church-specific devotion plans
-  Member engagement tracking
-  Subscription management

## Success Metrics (MVP)

Track these key metrics to measure MVP success:

1. **Adoption Metrics**

   -  Number of creators onboarded
   -  Number of churches onboarded
   -  Total active users

2. **Engagement Metrics**

   -  Daily email open rate
   -  Click-through rate
   -  User retention rate

3. **Delivery Metrics**

   -  Consistency of devotion delivery (target: 99%+)
   -  Email delivery success rate
   -  Average time to deliver

4. **Growth Metrics**
   -  New subscriptions per week
   -  Active devotion plans
   -  User growth rate

## Development Phases

### Phase 1: Foundation

-  Set up database & multi-tenant layer
   -  Auth, roles, church-user mappings
   -  Multi-tenant API routes
   -  Database schema with Prisma
-  Ghost API integration
   -  Admin API for creating posts
   -  Content API for fetching devotions
   -  Members API for authentication

### Phase 2: Core Features

-  Build Mini Frontend (`/apps/admin-app`)
   -  Create devotions, schedule, invite creators
   -  Custom rich text editor integration
   -  Church-scoped content management
-  Build User-Facing App (`/apps/user-app`)
   -  Fetch devotions from Ghost
   -  Display feed filtered by `church_id`
   -  Subscription forms and member dashboard

### Phase 3: Polish & Launch

-  Landing page / public pages
   -  Church discovery
   -  Public devotion previews
-  Test multi-tenant isolation & end-to-end flow
   -  Verify church data isolation
   -  Test content creation → delivery flow
-  UI/UX improvements
-  Performance optimization
-  Documentation completion
-  Beta testing

### Phase 4: Post-MVP

-  WhatsApp delivery (paid add-on)
-  Advanced analytics
-  Mobile app (future consideration)
-  Additional integrations

## Security Considerations

-  **Authentication**: Ghost Members API handles secure authentication
-  **API Keys**: Environment variables for sensitive data
-  **HTTPS**: Required for all production deployments
-  **Data Privacy**: GDPR-compliant data handling
-  **Email Security**: SPF, DKIM, DMARC configuration

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

-  Both apps share components, utils, and database models via workspace packages
-  Multi-tenant enforcement is in shared `packages/lib/multi-tenant`
-  Authentication and Ghost integration are in `packages/lib/auth`
-  Database schema and Prisma client are in `packages/database`
-  Each app runs independently on different ports
-  Workspace dependencies are managed via Bun workspaces
-  Run apps separately: `bun dev:user` (port 3000) or `bun dev:admin` (port 3001)

## End-to-End Summary

**Creators/Admins**: Log in → write devotion → schedule → stored in Ghost → tagged with `church_id`

**Ghost**: Stores posts, handles email delivery

**Next.js SaaS layer**: Enforces church isolation, manages multi-tenant logic

**Members**: See only their church's devotions → delivered via app and email

**Key Point**: The "backend" for multi-tenancy is built inside the Next.js app (API routes + database). Ghost is backend for content & delivery only. Mini frontend + user-facing app + multi-tenant logic = one integrated Next.js monorepo.

## Scalability Plan

### MVP (Current)

-  SQLite database (Next.js multi-tenant layer)
-  Single Ghost instance (backend engine)
-  Basic email service
-  Custom creator mini frontend

### Production

-  PostgreSQL/MySQL database migration (Next.js layer)
-  Load balancing for Ghost
-  CDN for static assets
-  Email service scaling
-  Monitoring and logging
-  Enhanced multi-tenant isolation

## Design Principles

1. **Simplicity**: Clean, uncluttered interface
2. **Accessibility**: WCAG 2.1 AA compliance
3. **Mobile-First**: Responsive design priority
4. **Performance**: Fast load times, optimized assets
5. **User-Centric**: Intuitive navigation and workflows

## Key Resources

-  [Ghost Documentation](https://ghost.org/docs/)
-  [Ghost Members API](https://ghost.org/docs/members/)
-  [Next.js Documentation](https://nextjs.org/docs)
-  [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## Open Source Strategy

We leverage open-source solutions to:

1. **Reduce Development Time**: Use proven solutions instead of building from scratch
2. **Ensure Quality**: Battle-tested software with active communities
3. **Maintain Focus**: Focus on business logic, not infrastructure
4. **Enable Contribution**: Open-source base allows community contributions

## Learning & Growth

This project serves as:

-  A learning platform for modern web development
-  A demonstration of open-source integration
-  A foundation for future features
-  A contribution opportunity for the community

---

**Built with love for the BTE community**

_Last Updated: December 2024_
