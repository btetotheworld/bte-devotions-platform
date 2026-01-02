#!/bin/bash

echo ""
echo "⚠️  IMPORTANT: Tests use Vitest, not Bun's built-in test runner"
echo ""
echo "❌ Don't use: bun test (this uses Bun's test runner which doesn't support Vitest mocks)"
echo ""
echo "✅ Use these commands instead:"
echo "   bunx vitest run        - Run tests once"
echo "   bun run test:watch     - Run tests in watch mode"
echo "   bun run test:coverage  - Run tests with coverage"
echo ""
echo "💡 Note: 'bun test' is a built-in command. Always use 'bun run test' or 'bunx vitest run'"
echo ""
exit 1

