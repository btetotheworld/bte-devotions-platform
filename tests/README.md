# Testing Guide

This directory contains comprehensive tests for the BTE Devotions Platform API endpoints.

## Test Setup

Tests are written using [Vitest](https://vitest.dev/) and use a separate test database.

### Prerequisites

- Bun runtime
- Test database (SQLite by default, configured via `TEST_DATABASE_URL`)

### Running Tests

**⚠️ IMPORTANT:** Tests use Vitest, not Bun's built-in test runner.

```bash
# ❌ Don't use: bun test (Bun's test runner doesn't support Vitest mocks)

# ✅ Run all tests once
bunx vitest run
# OR
bun run test

# ✅ Run tests in watch mode
bun run test:watch

# ✅ Run tests with coverage
bun run test:coverage
```

**Note:** `bun test` is a built-in command that bypasses package.json scripts. Always use `bunx vitest run` or `bun run test` instead.

## Test Structure

```
tests/
├── setup.ts              # Test database setup and teardown
├── api/
│   ├── auth.test.ts      # Authentication endpoints
│   ├── creators.test.ts  # Creator management endpoints
│   ├── subscriptions.test.ts  # Subscription endpoints
│   ├── ghost-posts.test.ts    # Ghost posts integration
│   └── ghost-author-setup.test.ts  # Ghost author setup
└── README.md
```

## Test Coverage

### Authentication API (`/api/auth`)
- ✅ POST `/api/auth/login` - User login
- ✅ GET `/api/auth/me` - Get current user

### Creators API (`/api/creators`)
- ✅ GET `/api/creators` - List creators
- ✅ POST `/api/creators` - Create creator
- ✅ GET `/api/creators/[id]` - Get creator by ID
- ✅ PATCH `/api/creators/[id]` - Update creator
- ✅ POST `/api/creators/[id]/invite` - Invite user to manage creator
- ✅ POST `/api/creators/[id]/setup-ghost-author` - Set up Ghost author

### Subscriptions API (`/api/subscriptions`)
- ✅ GET `/api/subscriptions` - Get user subscriptions
- ✅ POST `/api/subscriptions` - Subscribe to creator
- ✅ DELETE `/api/subscriptions/[creatorId]` - Unsubscribe from creator

### Ghost Posts API (`/api/ghost/posts`)
- ✅ POST `/api/ghost/posts` - Create post in Ghost
- ✅ GET `/api/ghost/posts` - Fetch posts from Ghost

## Test Database

Tests use a separate SQLite database (configured via `TEST_DATABASE_URL`). The database is:
- Cleaned before each test
- Isolated from the development database
- Automatically set up and torn down

## Mocking

External services (Ghost API) are mocked in tests to:
- Avoid making real API calls during testing
- Ensure tests run quickly and reliably
- Test error scenarios without affecting real services

## Writing New Tests

1. Create a new test file in `tests/api/`
2. Import test utilities from `tests/setup.ts`
3. Use Vitest's `describe` and `it` blocks
4. Mock external dependencies
5. Clean up test data in `beforeEach`

Example:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "../setup";

describe("My API", () => {
  beforeEach(async () => {
    // Set up test data
  });

  it("should do something", async () => {
    // Test implementation
  });
});
```

## Environment Variables

Tests use the following environment variables:
- `TEST_DATABASE_URL` - Test database connection string (defaults to `file:./test.db`)
- `GHOST_URL` - Ghost instance URL (mocked in tests)
- `GHOST_ADMIN_API_KEY` - Ghost Admin API key (mocked in tests)
- `GHOST_CONTENT_API_KEY` - Ghost Content API key (mocked in tests)


