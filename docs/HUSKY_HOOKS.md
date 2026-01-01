# Husky Git Hooks Documentation

This document describes the Git hooks configured for the BTE Devotions Platform monorepo using Husky and Bun.

## Overview

The project uses [Husky](https://typicode.github.io/husky/) to manage Git hooks that enforce code quality, dependency management, and build consistency across the monorepo. All hooks are configured to use **Bun** as the package manager.

## Hook Lifecycle

The hooks run at different stages of the Git workflow:

```
┌─────────────┐
│   Commit    │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐
│ pre-commit  │────▶│   Commit    │
└─────────────┘     └──────┬──────┘
                           │
                           ▼
                      ┌─────────────┐
                      │   Push      │
                      └──────┬──────┘
                             │
                             ▼
                        ┌─────────────┐     ┌─────────────┐
                        │  pre-push   │────▶│   Push      │
                        └─────────────┘     └─────────────┘
                                            
┌─────────────┐                            ┌─────────────┐
│   Merge     │                            │    Pull     │
└──────┬──────┘                            └──────┬──────┘
       │                                           │
       ▼                                           ▼
┌─────────────┐                            ┌─────────────┐
│ post-merge  │                            │  post-pull  │
└─────────────┘                            └─────────────┘
```

## Hooks

### 1. `pre-commit` Hook

**Location:** `.husky/pre-commit`

**When it runs:** Before a commit is finalized

**What it does:**
1. Identifies staged files and changed workspaces (`apps/*` and `packages/*`)
2. Compares current branch against `origin/main` to detect all changed workspaces
3. Runs linting for all affected workspaces using `bun run lint`
4. Provides feedback on which workspaces are being checked

**Key Features:**
- Detects both staged files and branch changes
- Only lints relevant workspaces (apps and packages)
- Uses Turborepo's lint command which scopes to changed workspaces

**Example Output:**
```
🔍 Running pre-commit hook...
📦 Changed workspaces (staged for commit):
apps/user-app
packages/lib
📊 Workspaces changed compared to origin/main:
apps/user-app
apps/admin-app
packages/lib
🚀 Running lint for staged files in these workspaces:
apps/user-app
apps/admin-app
packages/lib
```

**If lint fails:** Commit is blocked until issues are resolved.

---

### 2. `pre-push` Hook

**Location:** `.husky/pre-push`

**When it runs:** Before code is pushed to the remote repository

**What it does:**
1. Identifies all workspaces changed compared to `origin/main`
2. Runs TypeScript type checking (`type-check`) for each changed workspace
3. Ensures type safety before allowing push

**Key Features:**
- Type checks only changed workspaces (efficient)
- Falls back to `tsc --noEmit` if workspace doesn't have a `type-check` script
- Provides clear feedback on which workspaces are being checked

**Example Output:**
```
🔍 Running pre-push hook...
📊 Workspaces changed compared to origin/main:
apps/user-app
packages/database
➡️ Running type check in apps/user-app...
➡️ Running type check in packages/database...
✅ Type checks passed. Proceeding with push...
```

**If type check fails:** Push is blocked until type errors are resolved.

---

### 3. `post-merge` Hook

**Location:** `.husky/post-merge`

**When it runs:** After a merge operation completes (e.g., `git merge`, `git pull`)

**What it does:**
1. Installs dependencies with frozen lockfile (`bun install --frozen-lockfile`)
2. Detects if `packages/database` was changed in the merge
3. Provides reminders about database migrations if database package changed
4. Logs timestamps for debugging

**Key Features:**
- Enforces lockfile consistency (prevents dependency drift)
- Detects database schema changes
- Provides helpful reminders for next steps

**Example Output:**
```
🔍 Running post-merge hook...
📦 Installing dependencies with strict lockfile sync...
✅ Dependencies are up to date.
💡 Reminder: Since packages/database changed, you may need to run:
   bun run db:generate
   bun run db:push
💡 For all projects, ensure database connection strings are configured correctly.
🎉 Post-merge checks completed successfully at 2024-01-01 12:00:00 GMT.
```

**If install fails:** Operation fails with clear error message and timestamp.

---

### 4. `post-pull` Hook

**Location:** `.husky/post-pull`

**When it runs:** After a pull operation completes (`git pull`)

**What it does:**
1. Installs dependencies with frozen lockfile (`bun install --frozen-lockfile`)
2. Detects if `packages/database` was changed in the pull
3. Provides reminders about database migrations if database package changed
4. Logs timestamps for debugging

**Key Features:**
- Same as `post-merge` but specifically for pull operations
- Compares against `origin/main` to detect changes
- Ensures local environment stays in sync with remote

**Example Output:**
```
🔍 Running post-pull hook...
📦 Installing dependencies with strict lockfile sync...
✅ Dependencies are up to date.
💡 Reminder: Since packages/database changed, you may need to run:
   bun run db:generate
   bun run db:push
💡 For all projects, ensure database connection strings are configured correctly.
🎉 Post-pull checks completed successfully at 2024-01-01 12:00:00 GMT.
```

**If install fails:** Operation fails with clear error message and timestamp.

---

## Monorepo Structure

The hooks are designed to work with the following monorepo structure:

```
bte-devotions-platform/
├── apps/
│   ├── user-app/          # User-facing Next.js app
│   └── admin-app/         # Admin-facing Next.js app
├── packages/
│   ├── database/          # Prisma database package
│   └── lib/               # Shared library package
└── .husky/                # Git hooks directory
    ├── pre-commit
    ├── pre-push
    ├── post-merge
    └── post-pull
```

## Workspace Detection

The hooks use pattern matching to detect changed workspaces:

- **Apps:** `apps/*` (e.g., `apps/user-app`, `apps/admin-app`)
- **Packages:** `packages/*` (e.g., `packages/database`, `packages/lib`)

Pattern: `^(apps|packages)/` extracts the top-level directory structure.

## Database Package Detection

The `post-merge` and `post-pull` hooks specifically watch for changes to `packages/database/` because:

1. Database schema changes require Prisma client regeneration
2. Database migrations may need to be applied
3. Connection strings may need verification

When database changes are detected, the hooks remind developers to run:
```bash
bun run db:generate  # Regenerate Prisma client
bun run db:push      # Push schema changes to database
```

## Bun Integration

All hooks use **Bun** commands:

- `bun install --frozen-lockfile` - Install dependencies with strict lockfile
- `bun run lint` - Run linting (via Turborepo)
- `bun run type-check` - Run type checking (via Turborepo)
- `bun exec tsc --noEmit` - Fallback TypeScript check

The `--frozen-lockfile` flag ensures that:
- Dependencies match exactly what's in `bun.lock`
- No unexpected dependency updates occur
- Team members have consistent dependency versions

## Error Handling

All hooks include error handling:

1. **Exit codes:** Hooks exit with code `1` on failure, blocking the Git operation
2. **Error messages:** Clear, actionable error messages with timestamps
3. **Graceful degradation:** Hooks continue even if some checks pass

## Troubleshooting

### Hook not running
```bash
# Ensure hooks are executable
chmod +x .husky/*

# Reinstall Husky
bun run prepare
```

### Bypassing hooks (not recommended)
```bash
# Skip pre-commit hook
git commit --no-verify

# Skip pre-push hook
git push --no-verify
```

**⚠️ Warning:** Only bypass hooks in emergencies. They exist to maintain code quality.

### Lockfile conflicts
If `bun install --frozen-lockfile` fails:
1. Check if `bun.lock` is up to date
2. Run `bun install` manually to resolve conflicts
3. Commit the updated lockfile

### Type check failures
If type checks fail:
1. Review TypeScript errors in the affected workspace
2. Fix type errors
3. Re-run the push operation

## Configuration

Hooks are configured in:
- **Husky setup:** `package.json` → `"prepare": "husky"`
- **Hook scripts:** `.husky/*` files
- **Lint config:** `turbo.json` → `lint` task
- **Type check config:** `turbo.json` → `type-check` task

## Best Practices

1. **Always commit lockfile changes:** `bun.lock` should be committed
2. **Run hooks locally:** Don't bypass hooks; fix issues instead
3. **Keep hooks fast:** Hooks should complete quickly (< 30 seconds)
4. **Update hooks carefully:** Test hook changes before committing
5. **Document hook changes:** Update this doc when modifying hooks

## Related Documentation

- [Turborepo Configuration](../turbo.json)
- [Package Manager Setup](../package.json)
- [Project Summary](./PROJECT_SUMMARY.md)

