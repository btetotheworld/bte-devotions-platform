#!/bin/bash

# Ghost Setup Script
# Quick setup for local Ghost development

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 Setting up Ghost for BTE Devotions Platform..."
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose."
    exit 1
fi

# Start Ghost
echo "📦 Starting Ghost container..."
if docker compose version &> /dev/null; then
    docker compose up -d
else
    docker-compose up -d
fi

echo ""
echo "⏳ Waiting for Ghost to start..."
sleep 5

# Check if Ghost is running
if docker ps | grep -q bte-ghost-local; then
    echo "✅ Ghost is running!"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Open Ghost Admin: http://localhost:2368/ghost"
    echo "   2. Create your admin account (first-time setup)"
    echo "   3. Go to Settings → Integrations → Add custom integration"
    echo "   4. Copy the Content API Key and Admin API Key"
    echo "   5. Add them to bte-devotions-platform/.env.local"
    echo ""
    echo "💡 Useful commands:"
    echo "   - View logs: docker compose logs -f ghost"
    echo "   - Stop Ghost: docker compose down"
    echo "   - Restart Ghost: docker compose restart"
    echo ""
else
    echo "❌ Ghost failed to start. Check logs with: docker compose logs ghost"
    exit 1
fi


