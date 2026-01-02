#!/bin/bash

# Clean script for BTE Devotions Platform
# Removes node_modules, build artifacts, caches, and other generated files

set -e

echo "🧹 Cleaning BTE Devotions Platform..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to remove directory if it exists
remove_dir() {
  if [ -d "$1" ]; then
    echo -e "${YELLOW}Removing:${NC} $1"
    rm -rf "$1"
  fi
}

# Function to remove file if it exists
remove_file() {
  if [ -f "$1" ]; then
    echo -e "${YELLOW}Removing:${NC} $1"
    rm -f "$1"
  fi
}

# Root level
echo "📦 Cleaning root..."
remove_dir "node_modules"
remove_dir ".turbo"
remove_dir ".next"
remove_dir "out"
remove_dir "dist"
remove_dir "coverage"
remove_dir ".nyc_output"
# remove_file "bun.lock"
remove_file "*.tsbuildinfo"
find . -maxdepth 1 -name "*.tsbuildinfo" -type f -delete 2>/dev/null || true

# Apps
echo ""
echo "📱 Cleaning apps..."
for app in apps/*/; do
  if [ -d "$app" ]; then
    app_name=$(basename "$app")
    echo "  Cleaning $app_name..."
    remove_dir "${app}node_modules"
    remove_dir "${app}.next"
    remove_dir "${app}out"
    remove_dir "${app}dist"
    remove_dir "${app}.turbo"
    remove_file "${app}*.tsbuildinfo"
    find "$app" -name "*.tsbuildinfo" -type f -delete 2>/dev/null || true
  fi
done

# Packages
echo ""
echo "📚 Cleaning packages..."
for pkg in packages/*/; do
  if [ -d "$pkg" ]; then
    pkg_name=$(basename "$pkg")
    echo "  Cleaning $pkg_name..."
    remove_dir "${pkg}node_modules"
    remove_dir "${pkg}dist"
    remove_dir "${pkg}.turbo"
    remove_file "${pkg}*.tsbuildinfo"
    find "$pkg" -name "*.tsbuildinfo" -type f -delete 2>/dev/null || true
  fi
done

# Test files
echo ""
echo "🧪 Cleaning test artifacts..."
remove_dir "tests/test.db"
remove_dir "tests/test.db-journal"
find tests -name "*.db" -type f -delete 2>/dev/null || true
find tests -name "*.db-journal" -type f -delete 2>/dev/null || true

# Prisma generated files (keep schema, remove generated client)
echo ""
echo "🗄️  Cleaning Prisma generated files..."
for prisma_dir in packages/*/prisma packages/database/prisma; do
  if [ -d "$prisma_dir" ]; then
    echo "  Cleaning $prisma_dir..."
    remove_dir "${prisma_dir}/node_modules/.prisma"
    # Note: We keep dev.db and migrations, but remove generated client
    find "$prisma_dir" -name ".prisma" -type d -exec rm -rf {} + 2>/dev/null || true
  fi
done

# Vercel
echo ""
echo "☁️  Cleaning Vercel artifacts..."
remove_dir ".vercel"

# IDE
echo ""
echo "💻 Cleaning IDE files..."
remove_dir ".vscode/.ropeproject"
remove_dir ".idea"
find . -type d -name ".cursor" -exec rm -rf {} + 2>/dev/null || true
find . -name "*.swp" -type f -delete 2>/dev/null || true
find . -name "*.swo" -type f -delete 2>/dev/null || true
find . -name "*~" -type f -delete 2>/dev/null || true

# OS files
echo ""
echo "🖥️  Cleaning OS files..."
find . -name ".DS_Store" -type f -delete 2>/dev/null || true
find . -name "Thumbs.db" -type f -delete 2>/dev/null || true

# Bun cache (optional - uncomment if you want to clear Bun's cache too)
# echo ""
# echo "🍞 Cleaning Bun cache..."
# bun pm cache rm 2>/dev/null || true

echo ""
echo -e "${GREEN}✅ Clean complete!${NC}"
echo ""
echo "💡 Next steps:"
echo "   bun install    - Reinstall dependencies"
echo "   bun db:generate - Regenerate Prisma client"
echo ""

