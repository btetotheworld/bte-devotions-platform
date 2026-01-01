# Ghost CMS Setup Guide

This guide explains how to set up and manage Ghost CMS for the BTE Devotions Platform.

## Overview

Ghost CMS serves as the **content engine** for our platform. It handles:
- Content storage and management
- Email delivery to subscribers
- Content API for fetching devotions
- Members API for authentication

**Important:** Ghost runs separately from the monorepo. Each developer has their own local Ghost instance.

## Folder Structure

```
apps/web/
├── bte-devotions-platform/  # Monorepo (Next.js apps)
│   ├── templates/
│   │   └── ghost/          # Ghost template files (version controlled)
│   └── ...
└── ghost/                   # Ghost CMS (local instance, created from template)
    ├── docker-compose.yml  # Copied from templates/ghost/
    ├── setup.sh            # Copied from templates/ghost/
    ├── README.md           # Copied from templates/ghost/
    └── content/            # Ghost database & content (gitignored)
```

**Note:** The `templates/ghost/` directory in the monorepo contains the template files. These are automatically copied to `../ghost/` when you run `bun setup`.

## Local Development Setup

### Step 1: Set Up Ghost Directory

The setup script (`bun setup`) automatically copies Ghost template files to `../ghost`. If you haven't run it yet:

```bash
# Run the monorepo setup (copies Ghost files automatically)
bun setup
```

Or manually copy the template files:

```bash
# Copy template files
cp -r templates/ghost ../ghost

# Make setup script executable
chmod +x ../ghost/setup.sh
```

### Step 2: Start Ghost

```bash
cd ../ghost
./setup.sh
```

Or manually:

```bash
cd ../ghost
docker compose up -d
```

Ghost will be available at:
- **Admin Panel**: http://localhost:2368/ghost
- **Public Site**: http://localhost:2368

### Step 3: First-Time Setup

1. Open http://localhost:2368/ghost
2. Create your admin account (name, email, password)
3. Complete the initial setup wizard

### Step 4: Get API Keys

1. In Ghost Admin, go to **Settings → Integrations**
2. Click **Add custom integration**
3. Name it: "BTE Devotions Platform"
4. Copy these keys:
   - **Content API Key** → Used to fetch posts
   - **Admin API Key** → Used to create posts

### Step 5: Configure Frontend

Add to `bte-devotions-platform/.env.local`:

```env
GHOST_URL=http://localhost:2368
GHOST_CONTENT_API_KEY=your-content-api-key-here
GHOST_ADMIN_API_KEY=your-admin-api-key-here
GHOST_MEMBERS_API_URL=http://localhost:2368
```

### Step 6: Create Test Content

1. In Ghost Admin, create a test post
2. Add a church tag: `church_id:test-church-123`
3. Publish the post
4. Verify it appears in your frontend via the Content API

## Daily Workflow

### Starting Ghost
```bash
cd ../ghost
docker compose up -d
```

### Stopping Ghost
```bash
cd ../ghost
docker compose down
```

### Viewing Logs
```bash
cd ../ghost
docker compose logs -f ghost
```

### Resetting Ghost (⚠️ Deletes all content)
```bash
cd ../ghost
docker compose down -v
docker compose up -d
```

## Environment-Specific Configuration

### Local Development
- **URL**: http://localhost:2368
- **Database**: SQLite (stored in `ghost/content/data/ghost.db`)
- **Mail**: Direct (emails don't send)
- **Purpose**: Feature development

**Configuration:**
```yaml
# docker-compose.yml
database__client: sqlite3
mail__transport: Direct
```

### Staging (Future)
- **URL**: https://staging.ghost.bte.com
- **Database**: MySQL
- **Mail**: Mailgun (sandbox)
- **Purpose**: Pre-production testing

### Production (Future)
- **URL**: https://ghost.believerstechexpo.com
- **Database**: MySQL
- **Mail**: Production email provider (Mailgun/Postmark/SES)
- **Purpose**: Real users and content

## Multi-Tenant Content Strategy

### Church Tags

All devotions must be tagged with the church ID for multi-tenant isolation:

**Format:** `church_id:{churchId}`

**Example:** `church_id:abc123`

### Creating Church-Scoped Content

When creating posts via the Admin API:

```typescript
const post = {
  posts: [{
    title: "Daily Devotion",
    html: "<p>Content here...</p>",
    tags: [
      { name: `church_id:${churchId}` },
      { name: "devotion" }
    ]
  }]
};
```

### Fetching Church-Scoped Content

Use the Content API with tag filtering:

```
GET /ghost/api/content/posts/?key={contentKey}&filter=tag:church_id:abc123
```

## API Endpoints

### Admin API
- **Base URL**: `http://localhost:2368/ghost/api/admin/`
- **Authentication**: Admin API Key
- **Use Case**: Creating posts, managing content

### Content API
- **Base URL**: `http://localhost:2368/ghost/api/content/`
- **Authentication**: Content API Key
- **Use Case**: Fetching published posts

### Members API
- **Base URL**: `http://localhost:2368/ghost/api/members/`
- **Authentication**: Members API Key (if needed)
- **Use Case**: Member authentication, subscriptions

## Important Rules

### 🚫 Never Do This

1. **Don't commit Ghost content to Git**
   - The `ghost/content/` directory is gitignored
   - Each dev has their own local database

2. **Don't share Ghost databases between devs**
   - Each developer runs their own local Ghost
   - Prevents conflicts and "it works on my machine" issues

3. **Don't point staging frontend to production Ghost**
   - Each environment has its own Ghost instance
   - Prevents accidental data leaks

4. **Don't test email in production**
   - Use staging Ghost with sandbox email provider
   - Production emails go to real users

### ✅ Always Do This

1. **Use church tags for all devotions**
   - Enables multi-tenant content isolation
   - Required for church-scoped queries

2. **Keep Ghost separate from monorepo**
   - Ghost runs in its own directory
   - Managed via Docker Compose

3. **Use environment-specific Ghost instances**
   - Local → localhost
   - Staging → staging.ghost.bte.com
   - Production → ghost.believerstechexpo.com

## Troubleshooting

### Ghost won't start

```bash
# Check if port 2368 is in use
lsof -i :2368

# Check Docker is running
docker ps

# View Ghost logs
cd ../ghost
docker compose logs ghost
```

### Can't access Ghost Admin

1. Verify container is running: `docker ps`
2. Check logs: `docker compose logs ghost`
3. Try restarting: `docker compose restart`

### API keys not working

1. Verify keys in Ghost Admin → Settings → Integrations
2. Check `.env.local` has correct keys
3. Restart Next.js apps after changing env vars

### Database issues

```bash
# Reset Ghost completely
cd ../ghost
docker compose down -v
docker compose up -d
# Then recreate admin account and API keys
```

## Content Management Workflow

### For Creators (via Frontend)

Creators use the **Admin App** (http://localhost:3001) to:
1. Create devotions using our custom editor
2. Posts are automatically tagged with `church_id`
3. Content is created via Ghost Admin API
4. Creators **never see Ghost Admin interface**

### For Developers

Developers can use Ghost Admin directly for:
- Testing content creation
- Verifying API integrations
- Debugging content issues

## Email Configuration

### Local Development
- **Transport**: Direct
- **Behavior**: Emails are logged but not sent
- **Purpose**: Safe testing without sending real emails

### Staging
- **Transport**: Mailgun (sandbox)
- **Behavior**: Emails sent to test addresses
- **Purpose**: Test email delivery without affecting real users

### Production
- **Transport**: Mailgun/Postmark/SES
- **Behavior**: Real emails to subscribers
- **Purpose**: Actual email delivery

## Next Steps

1. ✅ Set up local Ghost instance
2. ✅ Get API keys
3. ✅ Configure frontend environment variables
4. ✅ Create test content with church tags
5. ✅ Verify Content API integration
6. ⏳ Set up staging Ghost (when ready)
7. ⏳ Set up production Ghost (when ready)

## Additional Resources

- [Ghost Admin API Documentation](https://ghost.org/docs/admin-api/)
- [Ghost Content API Documentation](https://ghost.org/docs/content-api/)
- [Ghost Members API Documentation](https://ghost.org/docs/members-api/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

