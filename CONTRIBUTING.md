# Contributing to Directory Analyzer

Thank you for your interest in contributing. This is a **public showcase project** — every line of code should demonstrate professional-grade quality.

## Development Setup

### Prerequisites
- Node.js 20+ (LTS)
- npm (bundled with Node)

### Installation
```bash
npm install
```

### Running
```bash
# Development with HMR
npm run dev

# Production build
npm run build

# Package for distribution
npm run dist
```

### Testing
```bash
# Unit tests (Vitest)
npm test

# With coverage
npm run test:coverage

# E2E tests (Playwright)
npx playwright test
```

### Code Quality
```bash
# Lint + typecheck + build (CI gate)
npm run lint
npm run typecheck
npm run build

# Auto-fix lint and format
npm run lint:fix
npm run format
```

## Standards

### TypeScript
- `strict: true` — no exceptions
- No `any` in `src/main/core/` or `src/shared/`
- Explicit return types on exported functions
- Prefer `interface` over `type` for object shapes

### Documentation
Every exported function, class, and interface must have TSDoc with:
- `@description`, `@param`, `@returns`, `@throws`
- `@example` for non-trivial usage

### Security
- Never expose Node.js APIs to renderer directly (use IPC + `contextBridge`)
- Validate all paths in IPC handlers before `fs` calls
- Read-only scanning; export writes only to native save dialog results

### Git
- Clear, descriptive commit messages
- Start with a verb: `Add`, `Fix`, `Refactor`, `Update`
- One logical change per commit

## Pull Request Checklist

- [ ] `npm run lint` passes with zero warnings
- [ ] `npm test` passes (47+ tests)
- [ ] `npm run build` succeeds
- [ ] New functionality has unit tests
- [ ] TSDoc added for new public APIs

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
