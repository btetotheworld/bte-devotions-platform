# BTE Devotions Platform

A production-ready, web-first SaaS platform that enables creators to publish daily devotions, users to subscribe and receive them, and churches to onboard members and run devotion plans.

Built with Next.js, Ghost CMS, Tailwind CSS, and modern email delivery services.

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

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Web App (Next.js)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Auth &       │  │ Devotion     │  │ Church       │  │
│  │ Profiles     │  │ Feed         │  │ Spaces       │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────┐
│         Ghost CMS (Self-hosted, Open Source)            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Editor       │  │ Email Engine │  │ Subscriptions│  │
│  │ (Built-in)   │  │ (Built-in)   │  │ (Members API)│  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────┐
│         Email Service (Mailgun/Postmark/SES)            │
│  ┌──────────────┐                                     │
│  │ Daily delivery │                                     │
│  │ Open tracking  │                                     │
│  └──────────────┘                                      │
└─────────────────────────────────────────────────────────┘
```

## Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **Tailwind CSS v4** - Utility-first CSS framework
- **shadcn/ui** - Component library
- **TypeScript** - Type safety

### Content & Email Core
- **Ghost CMS** - Self-hosted, open-source publishing platform
  - Built-in rich text editor
  - Email engine for newsletters
  - Members API for authentication and subscriptions
  - SQLite (MVP) → MySQL (production)

### Authentication
- **Ghost Members API** - Native authentication and member management
- Integration with Next.js for seamless user experience

### Email Delivery
- **Mailgun** / **Postmark** / **Amazon SES** - Transactional and newsletter email delivery
- Connected directly to Ghost's email engine

### Hosting
- **Ghost**: DigitalOcean / Fly.io
- **Web App**: Vercel

### Database
- **Ghost's built-in DB** - SQLite for MVP, MySQL for production
- No separate database required in MVP

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) 1.1.0+ (enforced via preinstall script)
- Node.js 20+ (if not using Bun)
- Ghost instance (self-hosted or managed)

### Installation

```bash
# Install dependencies
bun install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Ghost API credentials

# Run development server
bun dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# Ghost CMS Configuration
NEXT_PUBLIC_GHOST_URL=https://your-ghost-instance.com
GHOST_ADMIN_API_KEY=your-admin-api-key
GHOST_CONTENT_API_KEY=your-content-api-key

# Ghost Members API (for authentication)
GHOST_MEMBERS_API_URL=https://your-ghost-instance.com/members/api

# Email Service (optional, if custom integration needed)
EMAIL_SERVICE_API_KEY=your-email-service-key
EMAIL_SERVICE_PROVIDER=mailgun|postmark|ses
```

## Project Structure

```
bte-devotions-platform/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── lib/                   # Utility functions
│   └── utils.ts           # Shared utilities
├── components/            # React components (shadcn/ui)
├── public/                # Static assets
├── scripts/               # Build and utility scripts
│   └── enforce-bun.ts    # Bun version enforcement
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.ts
```

## Features

### For Creators
- Publish daily devotions using Ghost's built-in editor
- Schedule content for automatic delivery
- Track engagement metrics (open rates, clicks)
- Manage subscriber lists

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

## Available Scripts

```bash
# Development
bun dev              # Start Next.js development server

# Production
bun build            # Build for production
bun start            # Start production server

# Code Quality
bun lint             # Run ESLint
bun type-check       # TypeScript type checking

# Utilities
bun clean            # Clean build artifacts and node_modules
```

## Authentication Flow

The platform uses Ghost's Members API for authentication:

1. User signs up/logs in through Ghost Members API
2. Ghost handles authentication and session management
3. Next.js frontend integrates with Ghost Members API
4. User profile and subscription data managed by Ghost

## Email Delivery

Email delivery is handled by Ghost's built-in email engine, connected to your chosen email service provider:

1. **Mailgun** - Recommended for high-volume delivery
2. **Postmark** - Great deliverability and analytics
3. **Amazon SES** - Cost-effective for large scale

Configuration is done through Ghost's admin panel.

## Deployment

### Web App (Vercel)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Ghost CMS

1. Deploy Ghost to DigitalOcean or Fly.io
2. Configure email service in Ghost admin panel
3. Set up custom domain
4. Configure API keys for Next.js integration

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

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
