# Contributing to BTE Devotions Platform

Thank you for your interest in contributing to the BTE Devotions Platform! This document provides guidelines and instructions for contributing.

**Important**: Contributors should join our dedicated WhatsApp group for discussions, questions, and collaboration: [Join the BTE Devotions Platform WhatsApp Group](https://chat.whatsapp.com/GOfWeuAKerICPOqFbLdH4x)

## Project Goals

Before contributing, please understand our project goals:

- **MVP Focus**: We're building a web-first, free SaaS platform
- **Open Source Leverage**: We use Ghost CMS to avoid reinventing the wheel
- **Simplicity**: Keep the codebase clean and maintainable
- **User Experience**: Prioritize ease of use for creators, users, and churches

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different viewpoints and experiences

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) 1.1.0+ (required - enforced via preinstall script)
- Node.js 20+ (if not using Bun)
- Git
- A code editor (VS Code recommended)

### Setup

1. **Fork the repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/your-username/bte-devotions-platform.git
   cd bte-devotions-platform
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Ghost instance credentials
   ```

4. **Start development server**
   ```bash
   bun dev
   ```

5. **Verify setup**
   - Visit http://localhost:3000
   - Ensure no errors in console

## Development Workflow

### Branch Naming

Use descriptive branch names following this pattern:

```
<type>/<short-description>
```

Types:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions/changes
- `chore/` - Maintenance tasks

Examples:
- `feature/user-subscription-flow`
- `fix/ghost-api-authentication`
- `docs/readme-update`

### Workflow Steps

1. **Create a branch from main**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, maintainable code
   - Follow coding standards (see below)
   - Add tests if applicable
   - Update documentation as needed

3. **Test your changes**
   ```bash
   bun type-check  # Type checking
   bun lint        # Linting
   bun dev         # Manual testing
   ```

4. **Commit your changes** (see [Commit Guidelines](#commit-guidelines))

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request** (see [Pull Request Process](#pull-request-process))

## Commit Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/) with commitlint.

### Commit Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Test additions/changes
- `chore`: Maintenance tasks
- `perf`: Performance improvements

### Examples

```bash
feat(auth): add Ghost Members API integration

Implement authentication flow using Ghost Members API
for user signup and login functionality.

Closes #123

fix(devotions): resolve email delivery issue

The email delivery was failing due to incorrect API
key configuration. Fixed by updating environment
variable handling.

docs(readme): update installation instructions

Add missing environment variable setup steps.
```

### Commitlint

Commits are automatically validated using commitlint. If your commit doesn't follow the format, it will be rejected.

## Pull Request Process

### Before Submitting

- [ ] Code follows project coding standards
- [ ] All tests pass (`bun type-check`, `bun lint`)
- [ ] Documentation is updated (if needed)
- [ ] Commit messages follow conventional commits format
- [ ] Branch is up to date with main

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How was this tested?

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated
```

### Review Process

1. **Automated Checks**: CI will run type checking and linting
2. **Code Review**: At least one maintainer will review your PR
3. **Feedback**: Address any requested changes
4. **Approval**: Once approved, your PR will be merged

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Avoid `any` types - use proper types or `unknown`
- Use interfaces for object shapes
- Prefer type inference where possible

```typescript
// ✅ Good
interface User {
  id: string;
  email: string;
  name: string;
}

const getUser = async (id: string): Promise<User> => {
  // ...
};

// ❌ Bad
const getUser = async (id: any): Promise<any> => {
  // ...
};
```

### React/Next.js

- Use functional components with hooks
- Follow Next.js App Router conventions
- Use server components by default, client components when needed
- Keep components small and focused

```typescript
// ✅ Good
export default async function DevotionPage({ params }: { params: { id: string } }) {
  const devotion = await getDevotion(params.id);
  return <DevotionContent devotion={devotion} />;
}

// ❌ Bad
export default function DevotionPage(props: any) {
  // ...
}
```

### Styling

- Use Tailwind CSS utility classes
- Follow mobile-first responsive design
- Use shadcn/ui components when available
- Keep custom CSS minimal

```tsx
// ✅ Good
<div className="flex flex-col gap-4 p-6 md:flex-row md:gap-8">
  <Card className="w-full md:w-1/2">
    {/* ... */}
  </Card>
</div>

// ❌ Bad
<div style={{ display: 'flex', padding: '24px' }}>
  {/* ... */}
</div>
```

### File Organization

- Group related files together
- Use descriptive file names
- Keep files focused (single responsibility)
- Use index files for clean imports

```
components/
  devotion/
    DevotionCard.tsx
    DevotionList.tsx
    index.ts
  church/
    ChurchSpace.tsx
    index.ts
```

### Naming Conventions

- **Components**: PascalCase (`DevotionCard.tsx`)
- **Utilities**: camelCase (`formatDate.ts`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Types/Interfaces**: PascalCase (`User`, `DevotionData`)

## Testing

### Manual Testing

Before submitting a PR, manually test:

1. **Functionality**: Ensure feature works as expected
2. **Responsive Design**: Test on mobile and desktop
3. **Browser Compatibility**: Test in Chrome, Firefox, Safari
4. **Error Handling**: Test error cases

### Type Checking

```bash
bun type-check
```

### Linting

```bash
bun lint
```

## Documentation

### Code Comments

- Add comments for complex logic
- Use JSDoc for public APIs
- Keep comments up to date

```typescript
/**
 * Fetches a devotion by ID from Ghost CMS
 * @param id - The devotion ID
 * @returns Promise resolving to devotion data
 * @throws Error if devotion not found
 */
async function getDevotion(id: string): Promise<Devotion> {
  // ...
}
```

### README Updates

- Update README.md for new features
- Add setup instructions for new dependencies
- Document new environment variables

## Reporting Bugs

### Bug Report Template

```markdown
## Description
Clear description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g., macOS 14.0]
- Browser: [e.g., Chrome 120]
- Node version: [e.g., 20.10.0]
- Bun version: [e.g., 1.1.0]

## Screenshots
If applicable

## Additional Context
Any other relevant information
```

## Feature Requests

### Feature Request Template

```markdown
## Feature Description
Clear description of the feature

## Use Case
Why is this feature needed?

## Proposed Solution
How should it work?

## Alternatives Considered
Other approaches you've thought about

## Additional Context
Any other relevant information
```

## Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Ghost API Documentation](https://ghost.org/docs/api/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## Questions?

- Open an issue for questions
- Check existing issues and discussions
- Review documentation first

## Thank You!

Your contributions make this project better for everyone. Thank you for taking the time to contribute!

---

**Happy Coding!**

