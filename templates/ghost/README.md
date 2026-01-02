# Ghost CMS - Local Development

This directory contains the Docker setup for running Ghost CMS locally for the BTE Devotions Platform.

## Quick Start

```bash
# Make setup script executable (if not already)
chmod +x setup.sh

# Run setup script
./setup.sh
```

Or manually:

```bash
# Start Ghost
docker compose up -d

# View logs
docker compose logs -f ghost

# Stop Ghost
docker compose down
```

## First-Time Setup

1. **Start Ghost**: `./setup.sh` or `docker compose up -d`
2. **Open Ghost Admin**: http://localhost:2368/ghost
3. **Create admin account** (first-time setup)
4. **Get API Keys**:
   - Go to Settings → Integrations
   - Click "Add custom integration"
   - Name it: "BTE Devotions Platform"
   - Copy the **Content API Key** and **Admin API Key**
5. **Add keys to monorepo**: Update `bte-devotions-platform/.env.local` with your API keys

## Configuration

- **URL**: http://localhost:2368
- **Database**: SQLite (stored in `content/data/ghost.db`)
- **Mail**: Direct (emails don't send in development)
- **Port**: 2368

## Important Notes

- **Don't commit `content/` directory** - It's gitignored for a reason
- **Each developer has their own local Ghost** - Never share databases
- **Ghost content is local only** - Not synced between developers

## Useful Commands

```bash
# Start Ghost
docker compose up -d

# Stop Ghost
docker compose down

# View logs
docker compose logs -f ghost

# Restart Ghost
docker compose restart

# Reset Ghost (⚠️ deletes all content)
docker compose down -v
docker compose up -d
```

## Troubleshooting

### Ghost won't start
- Check if port 2368 is in use: `lsof -i :2368`
- Check Docker is running: `docker ps`
- View logs: `docker compose logs ghost`

### Can't access Ghost Admin
- Verify container is running: `docker ps`
- Check logs: `docker compose logs ghost`
- Try restarting: `docker compose restart`

For more detailed information, see the [Ghost Setup Guide](../../docs/GHOST_SETUP.md) in the monorepo.


