#!/usr/bin/env node

/**
 * BTE Devotions Platform - Setup Script
 * 
 * This script automates the initial setup process:
 * 1. Creates .env.local from .env.example if it doesn't exist
 * 2. Sets up the database
 * 3. Generates Prisma client
 * 4. Seeds the database
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const ENV_EXAMPLE = path.join(ROOT_DIR, '.env.example');
const ENV_LOCAL = path.join(ROOT_DIR, '.env.local');
const PRISMA_DIR = path.join(ROOT_DIR, 'packages', 'database', 'prisma');
const DB_DIR = path.join(PRISMA_DIR, '..');

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    warning: '\x1b[33m', // Yellow
    error: '\x1b[31m',   // Red
    reset: '\x1b[0m'
  };
  const icon = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  };
  console.log(`${colors[type]}${icon[type]} ${message}${colors.reset}`);
}

function checkPrerequisites() {
  log('Checking prerequisites...', 'info');
  
  // Check if Bun is installed
  try {
    execSync('bun --version', { stdio: 'ignore' });
    log('Bun is installed', 'success');
  } catch (error) {
    log('Bun is not installed. Please install Bun: https://bun.sh', 'error');
    process.exit(1);
  }

  // Check if Docker is installed (for Ghost)
  try {
    execSync('docker --version', { stdio: 'ignore' });
    log('Docker is installed', 'success');
  } catch (error) {
    log('Docker is not installed. Ghost setup will require Docker.', 'warning');
  }
}

function setupEnvFile() {
  log('Setting up environment variables...', 'info');
  
  if (fs.existsSync(ENV_LOCAL)) {
    log('.env.local already exists, skipping creation', 'warning');
    return;
  }

  if (!fs.existsSync(ENV_EXAMPLE)) {
    log('.env.example not found. Creating basic .env.local...', 'warning');
    
    // Create basic .env.local with required variables
    const envContent = `# Ghost CMS Configuration
# Get these from your local Ghost instance: http://localhost:2368/ghost
GHOST_URL=http://localhost:2368
GHOST_CONTENT_API_KEY=your-content-api-key-here
GHOST_ADMIN_API_KEY=your-admin-api-key-here
GHOST_MEMBERS_API_URL=http://localhost:2368

# Database (Multi-Tenant SaaS Layer)
# Path is relative to packages/database/prisma/
DATABASE_URL=file:./dev.db

# JWT Secret for Session Management
JWT_SECRET=dev-secret-key-change-in-production-${Date.now()}
SESSION_COOKIE_NAME=bte-devotions-session

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Environment
NODE_ENV=development
`;
    
    fs.writeFileSync(ENV_LOCAL, envContent);
    log('.env.local created with default values', 'success');
    log('⚠️  Remember to update Ghost API keys after setting up Ghost!', 'warning');
  } else {
    fs.copyFileSync(ENV_EXAMPLE, ENV_LOCAL);
    log('.env.local created from .env.example', 'success');
    log('⚠️  Remember to update Ghost API keys after setting up Ghost!', 'warning');
  }
}

function setupDatabase() {
  log('Setting up database...', 'info');
  
  // Ensure database directory exists
  const dbPath = path.join(PRISMA_DIR, 'dev.db');
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Load environment variables from .env.local
  let env = { ...process.env };
  if (fs.existsSync(ENV_LOCAL)) {
    const envContent = fs.readFileSync(ENV_LOCAL, 'utf8');
    envContent.split('\n').forEach(line => {
      // Skip comments and empty lines
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        return;
      }
      
      const match = trimmedLine.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        
        // Strip quotes from value (both single and double quotes)
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        
        if (key && value) {
          env[key] = value;
        }
      }
    });
  }

  // Ensure DATABASE_URL is set (relative to prisma directory)
  // Also ensure it doesn't have quotes and starts with file:
  if (!env.DATABASE_URL) {
    env.DATABASE_URL = 'file:./dev.db';
  } else {
    // Remove quotes if present and ensure it starts with file:
    env.DATABASE_URL = env.DATABASE_URL.replace(/^["']|["']$/g, '');
    if (!env.DATABASE_URL.startsWith('file:')) {
      log('Warning: DATABASE_URL should start with file: for SQLite', 'warning');
      env.DATABASE_URL = 'file:./dev.db';
    }
  }

  try {
    // Generate Prisma client
    log('Generating Prisma client...', 'info');
    execSync('bun prisma generate', { 
      cwd: PRISMA_DIR, 
      stdio: 'inherit',
      env: env
    });
    log('Prisma client generated', 'success');

    // Push database schema
    log('Pushing database schema...', 'info');
    execSync('bun prisma db push', { 
      cwd: PRISMA_DIR, 
      stdio: 'inherit',
      env: env
    });
    log('Database schema pushed', 'success');

    // Seed database
    log('Seeding database...', 'info');
    execSync('bun prisma/seed.ts', { 
      cwd: DB_DIR, 
      stdio: 'inherit',
      env: env
    });
    log('Database seeded', 'success');
  } catch (error) {
    log('Database setup failed. Please check the error above.', 'error');
    process.exit(1);
  }
}

function setupGhostDirectory() {
  log('Setting up Ghost directory...', 'info');
  
  const ghostTemplateDir = path.join(ROOT_DIR, 'templates', 'ghost');
  const ghostDir = path.join(ROOT_DIR, '..', 'ghost');
  
  // Check if template exists
  if (!fs.existsSync(ghostTemplateDir)) {
    log('Ghost template not found at templates/ghost', 'warning');
    log('Ghost setup files should be in templates/ghost directory', 'info');
    return false;
  }

  // Create ghost directory if it doesn't exist
  if (!fs.existsSync(ghostDir)) {
    log('Creating Ghost directory at ../ghost...', 'info');
    fs.mkdirSync(ghostDir, { recursive: true });
  }

  // Copy template files to ghost directory
  const filesToCopy = [
    'docker-compose.yml',
    'setup.sh',
    'README.md',
    '.gitignore',
    '.dockerignore'
  ];

  let filesCopied = 0;
  filesToCopy.forEach(file => {
    const src = path.join(ghostTemplateDir, file);
    const dest = path.join(ghostDir, file);
    
    if (fs.existsSync(src)) {
      // Don't overwrite existing files
      if (!fs.existsSync(dest)) {
        fs.copyFileSync(src, dest);
        filesCopied++;
      }
    }
  });

  // Make setup.sh executable
  const setupShPath = path.join(ghostDir, 'setup.sh');
  if (fs.existsSync(setupShPath)) {
    try {
      fs.chmodSync(setupShPath, 0o755);
    } catch (error) {
      // Ignore chmod errors on Windows
    }
  }

  if (filesCopied > 0) {
    log(`Copied ${filesCopied} Ghost template files to ../ghost`, 'success');
  } else if (fs.existsSync(path.join(ghostDir, 'docker-compose.yml'))) {
    log('Ghost directory already set up', 'info');
  }

  // Check if Ghost is running
  try {
    execSync('docker ps --filter "name=bte-ghost-local" --format "{{.Names}}"', { 
      cwd: ghostDir,
      stdio: 'pipe' 
    });
    log('Ghost appears to be running', 'success');
    return true;
  } catch (error) {
    log('Ghost is not running. Start it with: cd ../ghost && ./setup.sh', 'warning');
    return false;
  }
}

function main() {
  console.log('\n🚀 BTE Devotions Platform - Setup\n');
  
  checkPrerequisites();
  setupEnvFile();
  setupDatabase();
  const ghostRunning = setupGhostDirectory();
  
  console.log('\n✨ Setup complete!\n');
  
  if (!ghostRunning) {
    console.log('📋 Next steps:');
    console.log('  1. Set up Ghost: cd ../ghost && ./setup.sh');
    console.log('  2. Get API keys from http://localhost:2368/ghost');
    console.log('  3. Update .env.local with your Ghost API keys');
    console.log('  4. Run: bun dev:user or bun dev:admin\n');
  } else {
    console.log('📋 Next steps:');
    console.log('  1. Get API keys from http://localhost:2368/ghost (if not done)');
    console.log('  2. Update .env.local with your Ghost API keys');
    console.log('  3. Run: bun dev:user or bun dev:admin\n');
  }
}

main();

