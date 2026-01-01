# BTE Devotions Platform - Project Summary

## Vision

Build a web-first, free SaaS platform that empowers the Christian community to create, share, and engage with daily devotions. The platform serves three key user groups: content creators, individual subscribers, and churches seeking to foster spiritual growth among their members.

## Project Overview

### MVP Goals

The Minimum Viable Product (MVP) focuses on delivering core functionality that enables:

1. **Content Creation**: Allow creators to publish daily devotions using a powerful, familiar editor
2. **User Subscriptions**: Enable users to subscribe to devotion plans and receive daily content
3. **Church Management**: Provide churches with tools to onboard members and manage devotion plans
4. **Email Delivery**: Deliver devotions reliably via email (default channel)
5. **Future Expansion**: Lay foundation for WhatsApp delivery as a paid add-on (post-MVP)

### Core Principles

- **Open Source Leverage**: Don't reinvent the wheel - use proven open-source solutions
- **Simplicity First**: Focus on core features, avoid feature bloat
- **Free Tier**: Make the platform accessible to all users
- **Web-First**: Optimize for web experience, mobile-responsive design

## Non-Goals (Important Boundaries)

To maintain focus and avoid scope creep, we explicitly exclude:

- **Social Network Features**: Not building a social media platform
- **Church Management System**: Not replacing existing CMS solutions
- **Custom Editor**: Not building a text editor from scratch
- **Email Infrastructure**: Not rebuilding email delivery systems

## Architecture Decision

### Technology Stack

#### Frontend (Web App)
- **Next.js 16** (React) - Modern React framework with App Router
- **Tailwind CSS v4** - Utility-first styling
- **shadcn/ui** - High-quality component library
- **TypeScript** - Type safety throughout

#### Content & Email Core
- **Ghost CMS** (Self-hosted, Open Source)
  - Built-in rich text editor (no custom editor needed)
  - Native email engine for newsletters
  - Members API for authentication and subscriptions
  - SQLite for MVP → MySQL for production

#### Authentication
- **Ghost Members API** - Native authentication system
  - Handles user signup, login, and session management
  - Integrated with Next.js frontend
  - No need for separate auth service

#### Email Delivery
- **Mailgun** / **Postmark** / **Amazon SES**
  - Connected directly to Ghost's email engine
  - Handles transactional and newsletter emails
  - Built-in open tracking and analytics

#### Database
- **Ghost's Built-in Database**
  - SQLite for MVP (simple, no separate DB needed)
  - MySQL for production (scalable)
  - No separate database layer required

#### Hosting
- **Ghost**: DigitalOcean / Fly.io (self-hosted)
- **Web App**: Vercel (optimized for Next.js)

### Why This Stack?

1. **Ghost CMS**: 
   - Open source, battle-tested
   - Built-in editor (saves development time)
   - Native email capabilities
   - Members API for auth (no custom auth needed)
   - Active community and documentation

2. **Next.js**:
   - Server-side rendering for SEO
   - App Router for modern React patterns
   - Easy deployment on Vercel
   - Great developer experience

3. **Tailwind CSS**:
   - Rapid UI development
   - Consistent design system
   - Mobile-first responsive design

4. **Email Services**:
   - Proven deliverability
   - Built-in analytics
   - No need to build email infrastructure

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Web App Layer (Next.js)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Auth &       │  │ Devotion     │  │ Church       │  │
│  │ Profiles     │  │ Feed         │  │ Spaces       │  │
│  │              │  │              │  │              │  │
│  │ - Sign up    │  │ - Browse     │  │ - Onboard    │  │
│  │ - Login      │  │ - Subscribe  │  │ - Manage     │  │
│  │ - Profile    │  │ - Archive    │  │ - Track      │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└───────────────────────┬─────────────────────────────────┘
                        │
                        │ Ghost Members API
                        │ Ghost Content API
                        ↓
┌─────────────────────────────────────────────────────────┐
│         Ghost CMS (Content & Email Engine)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Editor       │  │ Email Engine │  │ Subscriptions│  │
│  │              │  │              │  │              │  │
│  │ - Rich text  │  │ - Scheduling │  │ - Members    │  │
│  │ - Scheduling │  │ - Templates  │  │ - Plans      │  │
│  │ - Media      │  │ - Analytics  │  │ - Preferences│  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │         Database (SQLite → MySQL)                │   │
│  │  - Content storage                                │   │
│  │  - User data                                      │   │
│  │  - Subscriptions                                  │   │
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

## User Personas

### 1. Content Creator
**Goals:**
- Publish daily devotions easily
- Reach and grow audience
- Track engagement

**Features:**
- Ghost's built-in editor
- Content scheduling
- Analytics dashboard
- Subscriber management

### 2. Individual User
**Goals:**
- Receive daily devotions
- Access devotion archive
- Manage subscriptions

**Features:**
- Email subscription
- Web-based devotion feed
- Subscription preferences
- Archive access

### 3. Church Administrator
**Goals:**
- Onboard church members
- Manage devotion plans
- Track member engagement

**Features:**
- Bulk member onboarding
- Church-specific devotion plans
- Member engagement tracking
- Subscription management

## Success Metrics (MVP)

Track these key metrics to measure MVP success:

1. **Adoption Metrics**
   - Number of creators onboarded
   - Number of churches onboarded
   - Total active users

2. **Engagement Metrics**
   - Daily email open rate
   - Click-through rate
   - User retention rate

3. **Delivery Metrics**
   - Consistency of devotion delivery (target: 99%+)
   - Email delivery success rate
   - Average time to deliver

4. **Growth Metrics**
   - New subscriptions per week
   - Active devotion plans
   - User growth rate

## Development Phases

### Phase 1: Foundation (Current)
- Project setup (Next.js, Tailwind, TypeScript)
- Ghost CMS integration planning
- Basic authentication flow
- Ghost instance setup (in progress)
- API integration (in progress)

### Phase 2: Core Features
- Devotion publishing workflow
- User subscription system
- Email delivery setup
- Basic church features

### Phase 3: Polish & Launch
- UI/UX improvements
- Performance optimization
- Documentation completion
- Beta testing

### Phase 4: Post-MVP
- WhatsApp delivery (paid add-on)
- Advanced analytics
- Mobile app (future consideration)
- Additional integrations

## Security Considerations

- **Authentication**: Ghost Members API handles secure authentication
- **API Keys**: Environment variables for sensitive data
- **HTTPS**: Required for all production deployments
- **Data Privacy**: GDPR-compliant data handling
- **Email Security**: SPF, DKIM, DMARC configuration

## Scalability Plan

### MVP (Current)
- SQLite database
- Single Ghost instance
- Basic email service

### Production
- MySQL database migration
- Load balancing for Ghost
- CDN for static assets
- Email service scaling
- Monitoring and logging

## Design Principles

1. **Simplicity**: Clean, uncluttered interface
2. **Accessibility**: WCAG 2.1 AA compliance
3. **Mobile-First**: Responsive design priority
4. **Performance**: Fast load times, optimized assets
5. **User-Centric**: Intuitive navigation and workflows

## Key Resources

- [Ghost Documentation](https://ghost.org/docs/)
- [Ghost Members API](https://ghost.org/docs/members/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## Open Source Strategy

We leverage open-source solutions to:

1. **Reduce Development Time**: Use proven solutions instead of building from scratch
2. **Ensure Quality**: Battle-tested software with active communities
3. **Maintain Focus**: Focus on business logic, not infrastructure
4. **Enable Contribution**: Open-source base allows community contributions

## Learning & Growth

This project serves as:

- A learning platform for modern web development
- A demonstration of open-source integration
- A foundation for future features
- A contribution opportunity for the community

---

**Built with love for the BTE community**

*Last Updated: December 2024*

