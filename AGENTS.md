# Directory Analyzer — AGENTS.md (v2)

> **Project Mission**: Professional-grade personal storage analytics tool.  
> **Current Phase**: Migration from Python CLI v1.2.1 → TypeScript + Electron desktop application.  
> **Intent**: This is a **public showcase project** ("витрина"). Every line of code, every architectural decision, and every test must demonstrate professional capability in delivering reliable, secure, and high-quality software.

---

## 1. Project Context

| Attribute | Value |
|-----------|-------|
| **Project Name** | Directory Analyzer |
| **Author** | Alexander Sivolobov |
| **Python Version** | 1.2.1 (CLI) — archived in `archive/python/` |
| **Target Stack** | TypeScript 5.4+ + Electron 33+ + React 18+ + Vite |
| **Package Manager** | `pnpm` (deterministic, disk-efficient, workspace-ready) |
| **License** | MIT |
| **Repository Visibility** | Public — acts as a professional portfolio piece |

**Goal**: Port the existing Python CLI application to a cross-platform desktop GUI application while **exceeding** the original in architecture, type safety, test coverage, security, and user experience.

### Why TS/Electron
- **Cross-platform**: Windows, macOS, Linux from single codebase
- **Familiar web tech**: HTML/CSS/JS for UI, easy to iterate
- **Node.js filesystem access**: Full `fs` module access in main process
- **Type safety**: TypeScript strict mode catches errors at compile time
- **Desktop-native feel**: Native menus, file dialogs, system integrations

---

## 2. Quality Charter (Showcase Standards)

This project is a **public-facing demonstration of engineering excellence**. All decisions prioritize:

1. **Reliability** — graceful error handling, no silent failures, predictable behavior
2. **Security** — read-only filesystem operations, path validation, no `nodeIntegration`, context isolation
3. **Maintainability** — strict TypeScript, explicit types, modular architecture, comprehensive TSDoc
4. **Testability** — unit tests for all core logic, integration tests for workflows, E2E for critical paths
5. **Performance** — non-blocking UI, worker threads, efficient data structures
6. **Accessibility** — keyboard navigation, screen-reader friendly markup, sufficient contrast

### Code Quality Gates (Non-negotiable)

| Gate | Tool | Rule |
|------|------|------|
| **Type Safety** | TypeScript | `strict: true`, no `any` in core logic, explicit return types |
| **Linting** | ESLint + `@typescript-eslint/strict-type-checked` | No warnings in CI, `no-explicit-any` enforced, type-aware rules active |
| **Security Linting** | `eslint-plugin-security` + `eslint-plugin-security-node` | Detect unsafe regex, path traversal, eval, child_process risks |
| **Formatting** | Prettier | Consistent style, 2-space indent, single quotes |
| **Pre-commit** | Husky + lint-staged | Block commit if lint/tests fail |
| **Test Coverage** | Vitest (`v8` provider) | Minimum 80% line coverage on `src/main/core/` |
| **E2E** | Playwright | Critical path: scan → results → export |

### TypeScript Strict Rules

```json
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true,
  "strictFunctionTypes": true,
  "strictBindCallApply": true,
  "strictPropertyInitialization": true,
  "noImplicitThis": true,
  "alwaysStrict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noImplicitReturns": true,
  "noFallthroughCasesInSwitch": true
}
```

---

## 3. Target Architecture

### Electron Process Architecture

```
┌─────────────────────────────────────────┐
│           Electron App                  │
├─────────────────────────────────────────┤
│  Main Process (Node.js + TS)            │
│  ├── File system scanning (fs, path)    │
│  ├── Worker threads for parallel scan   │
│  ├── IPC handlers (validated inputs)    │
│  └── Window management                  │
├─────────────────────────────────────────┤
│  Renderer Process (Chromium + TS)       │
│  ├── React 18 + Tailwind CSS            │
│  ├── Tables, charts (Recharts)          │
│  ├── Zustand state store                │
│  └── IPC calls to main process          │
├─────────────────────────────────────────┤
│  Preload Script (bridge)                │
│  └── Secure IPC API exposure            │
└─────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Runtime | Electron 33+ (latest stable) | Desktop shell |
| Language | TypeScript 5.4+ | Type-safe code |
| Bundler | Vite (electron-vite) | Fast HMR and bundling |
| UI | React 18+ | Component-based UI |
| Styling | Tailwind CSS 3.4+ | Utility-first CSS |
| State | Zustand 4.5+ | Lightweight global state |
| Charts | Recharts 2.12+ | Data visualization |
| Icons | Lucide React | Consistent iconography |
| Windows FFI | koffi 2.8+ | Call `GetFileAttributesW` without C++ addon compilation |
| Unit Tests | Vitest 1.5+ | Fast TS-native testing |
| E2E Tests | Playwright 1.43+ | Cross-platform E2E |
| React Tests | @testing-library/react 15+ | Component testing |
| Linting | ESLint 8+ + Prettier 3+ | Code quality |
| Security Lint | eslint-plugin-security 2+ | Security patterns |
| Validation | Zod 3.23+ | Runtime schema validation for IPC boundaries |
| IPC | Raw typed IPC (no wrapper lib) | Full control, zero abstraction overhead |

### Module Mapping: Python → TypeScript

| Python | TypeScript | Notes |
|--------|-----------|-------|
| `src/models.py` | `src/shared/types.ts` | Shared interfaces (main + renderer) |
| `src/constants.py` | `src/shared/constants.ts` | Shared constants |
| `src/classifier.py` | `src/main/core/classifier.ts` | Node.js main process |
| `src/scanner.py` | `src/main/core/scanner.ts` | `fs/promises`, `path`, `worker_threads` |
| `src/reporter.py` | `src/main/core/exporter.ts` | Export CSV/JSON/TXT; UI rendering in renderer |
| `src/utils.py` | `src/main/utils/fs.ts`, `format.ts`, `progress.ts` | Split by concern |
| `src/main.py` | `src/main/index.ts` + `src/main/ipc/handlers.ts` | Main entry + IPC routing |
| N/A | `src/preload/index.ts` | Secure API bridge |
| N/A | `src/renderer/` | React app |

---

## 4. Project Structure

```
directory-analyzer/
├── .cursorrules              # LLM context & contract rules
├── .eslintrc.cjs             # ESLint + security plugins
├── .prettierrc               # Formatting rules
├── .gitignore                # Ignore patterns
├── electron.vite.config.ts   # Vite config for main/preload/renderer
├── package.json              # pnpm, scripts, dependencies
├── pnpm-lock.yaml            # Deterministic lockfile
├── tsconfig.json             # Solution-only root (project references)
├── tsconfig.main.json        # Main process + shared + tests
├── tsconfig.web.json         # Renderer + preload + shared
├── tsconfig.node.json        # Build tooling TS config
├── vitest.config.ts          # Unit test config
├── playwright.config.ts      # E2E test config
├── resources/                # Static assets (icons, images)
│   └── icon.png
├── src/
│   ├── shared/               # Code shared between main and renderer
│   │   ├── types.ts          # All interfaces (ScanOptions, DirectoryInfo, etc.)
│   │   ├── constants.ts      # BYTES_PER_KB, MINIMUM_PERCENTAGE_DISPLAY
│   │   ├── ipc-channels.ts   # IPC channel constants (type-safe)
│   │   └── schemas.ts        # Zod schemas for runtime IPC validation
│   │
│   ├── main/                 # Electron main process (Node.js)
│   │   ├── index.ts          # Main entry, window creation, menu
│   │   ├── ipc/
│   │   │   └── handlers.ts   # IPC handler registration + input validation
│   │   ├── core/
│  │   │   ├── scanner.ts    # Directory scanning (Async Task Pool)
│   │   │   ├── classifier.ts # File classification engine
│   │   │   └── exporter.ts   # CSV/JSON/TXT export generation
│   │   ├── utils/
│   │   │   ├── fs.ts         # Filesystem helpers (isHidden, safeStat)
│   │   │   ├── format.ts     # bytesToHumanReadable, formatPercentage
│   │   │   └── progress.ts   # Progress reporting for scans
│   │   └── workers/

│   │
│   ├── preload/              # Preload script (isolated context)
│   │   └── index.ts          # Expose safe API via contextBridge
│   │
│   └── renderer/             # React app (Chromium)
│       ├── main.tsx          # React entry point
│       ├── App.tsx           # Root component
│       ├── index.html
│       ├── components/
│       │   ├── ScanConfigForm.tsx
│       │   ├── ScanProgress.tsx
│       │   ├── ResultsTable.tsx
│       │   ├── CategoryChart.tsx
│       │   ├── DirectoryDetail.tsx
│       │   ├── ExportPanel.tsx
│       │   ├── SummaryCards.tsx
│       │   ├── ErrorAlert.tsx
│       │   └── ThemeToggle.tsx
│       ├── hooks/
│       │   └── useScan.ts
│       └── store/
│           └── scanStore.ts
└── tests/
    ├── unit/                 # Vitest tests mirroring Python test_suite.py
    │   ├── classifier.spec.ts
    │   ├── scanner.spec.ts
    │   ├── exporter.spec.ts
    │   ├── format.spec.ts
    │   └── fs.spec.ts
    ├── e2e/                  # Playwright tests
    │   └── scan-workflow.spec.ts
    └── fixtures/             # Test directory structures
        ├── mixed-content/
        ├── hidden-dirs/
        └── large-structure/
```

---

## 5. Key Design Decisions

### 5.1 Async Task Pool for Scanning
The Python version uses `ThreadPoolExecutor`. In Node.js, filesystem scanning is I/O-bound, so `fs/promises` with an async task pool (limited concurrency via `Promise.race`) is sufficient to keep the UI responsive without the overhead of `worker_threads`. The async task pool is implemented directly in `scanner.ts`.

### 5.2 IPC Communication Pattern
Typed IPC layer with **zero abstraction libraries** (full control, easier to debug, no hidden magic):
- **Scan Start**: Renderer → Main with `ScanOptions`
- **Scan Progress**: Main → Renderer with `ScanProgressUpdate`
- **Scan Complete**: Main → Renderer with `ScanResult`
- **Export Request**: Renderer → Main → file dialog → write file
- **Cancel Scan**: Renderer → Main → terminate workers / AbortController

### 5.3 State Management
- **Main process**: Minimal state (active scan controllers, AbortControllers)
- **Renderer process**: Zustand store holds `ScanResult`, UI state, theme preference (persisted to `localStorage`)
- **No main→renderer streaming of partial results**: send final result (or chunked batches for very large scans)

### 5.4 UI/UX Vision
Replace terminal output with:
- **Folder picker dialog** instead of CLI path argument
- **Real-time progress** with directory count, files scanned, elapsed time
- **Sortable data grid** for top directories with percentages
- **Charts**: Pie chart for category breakdown, bar chart for top N
- **Detail panel**: Click a directory to see files within it
- **Export**: One-click CSV/JSON/TXT export with native save dialog
- **Filters**: Interactive toggles for hidden dirs, extension filter chips, min size slider

### 5.5 File Classification Preservation
Port the **exact** extension mappings from `classifier.py` `CATEGORY_MAPPINGS` to TypeScript. Keep normalization logic (lowercase, ensure leading dot).

**Critical**: In Python, `CATEGORY_MAPPINGS` is a dict. Overlapping extensions (e.g., `.exe` in both `archives` and `system`) resolve to whichever category appears first in iteration. In TypeScript, use a `Map` with identical insertion order to preserve parity.

### 5.6 Windows Hidden Directory Detection (Native)
On Windows, hidden flag must be detected via native API, not just dot-prefix.

**Solution**: Use `koffi` (FFI library) to call `GetFileAttributesW` from `kernel32.dll` at runtime. No C++ addon compilation required. Graceful fallback to dot-prefix if FFI fails or on non-Windows platforms.

```typescript
// Conceptual implementation in src/main/utils/fs.ts
import koffi from 'koffi';

const kernel32 = koffi.load('kernel32.dll');
const GetFileAttributesW = kernel32.func('uint32 __stdcall GetFileAttributesW', ['const uint16 *']);

const FILE_ATTRIBUTE_HIDDEN = 0x00000002;

function isHiddenWindows(path: string): boolean {
  try {
    const attrs = GetFileAttributesW(Buffer.from(path + '\0', 'utf16le'));
    return attrs !== 0xFFFFFFFF && (attrs & FILE_ATTRIBUTE_HIDDEN) !== 0;
  } catch {
    return false;
  }
}
```

### 5.7 Security (Electron Best Practices)
- `contextIsolation: true`
- `contextBridge` in preload **only**
- `nodeIntegration: false` in renderer
- Validate all paths received from renderer before filesystem access (prevent path traversal)
- `webSecurity: true`
- Read-only operations: never write, move, or delete user files except explicit export
- Export path validated: must be inside user-selected save dialog result

---

## 6. Code Conventions

### TypeScript Style
- **Strict mode**: `strict: true` in tsconfig
- **Explicit return types** for all public functions
- **Interfaces over types** for object shapes (`interface DirectoryInfo` not `type DirectoryInfo = {...}`)
- **Named exports** preferred over default exports (better tree-shaking, explicit imports)
- **File naming**: `kebab-case.ts` for utilities, `PascalCase.tsx` for React components, `kebab-case.spec.ts` for tests

### Python → TypeScript Patterns

| Python Pattern | TypeScript Equivalent |
|---------------|----------------------|
| `@dataclass` | `interface` + plain objects + factory functions |
| `Path` | `string` (paths as strings in Node.js) |
| `datetime` | `number` (Unix timestamps in ms) |
| `list[T]` | `readonly T[]` (immutability by default) |
| `dict[str, int]` | `Readonly<Record<string, number>>` |
| `set[str]` | `ReadonlySet<string>` |
| `Iterator[T]` | `AsyncGenerator<T>` or `T[]` |
| `ClassVar` | `static readonly` or module-level `const` |
| `try/except` | `try/catch` with typed errors |
| `ThreadPoolExecutor` | `Worker` from `worker_threads` |
| `argparse` | React form components + IPC |

### Development-by-Contract (Docs-in-Code)

Every public function, class, and interface must include **TSDoc** with:
- `@description` — what it does
- `@param` — each parameter with type and constraints
- `@returns` — return value and possible states
- `@throws` — what errors can be thrown and why
- `@example` — minimal usage example (where non-trivial)
- `@precondition` — conditions that must hold before call
- `@postcondition` — conditions guaranteed after successful execution

Example:
```typescript
/**
 * Calculates human-readable size string from bytes.
 *
 * @description Formats a byte count using binary prefixes (KiB = 1024).
 *              Matches Python v1.2.1 behavior exactly.
 * @param sizeBytes - Size in bytes. Must be >= 0.
 * @returns Formatted string, e.g. "0 B", "1.5 GB".
 * @precondition sizeBytes >= 0
 * @postcondition Returns non-empty string with valid unit suffix.
 * @throws {RangeError} If sizeBytes is negative.
 *
 * @example
 * bytesToHumanReadable(0);     // "0 B"
 * bytesToHumanReadable(1610612736); // "1.5 GB"
 */
export function bytesToHumanReadable(sizeBytes: number): string {
  if (sizeBytes < 0) throw new RangeError('sizeBytes must be >= 0');
  // ...
}
```

**Rule**: If a function is exported, it must have TSDoc. No exceptions.

---

## 7. Migration Plan (Phased)

### Phase 1: Foundation
1. Initialize Electron + Vite + React + TypeScript project with `pnpm`
2. Set up build tooling (eslint + security plugins, prettier, husky, vitest)
3. Create `src/shared/types.ts` with all interfaces
4. Create `src/shared/constants.ts`
5. Implement preload script with typed IPC bridge
6. Set up IPC channel constants
7. Archive Python code to `archive/python/` (already done)

### Phase 2: Core Logic Port
1. Port `classifier.py` → `src/main/core/classifier.ts` (exact extension maps)
2. Port filesystem utilities from `utils.py` → `src/main/utils/fs.ts` (with koffi for Windows)
3. Port formatting utilities → `src/main/utils/format.ts` (exact Python parity)
4. Implement sequential scanner using `fs/promises`
5. Implement worker thread for parallel scanning
6. Port reporter/export logic → `src/main/core/exporter.ts`
7. Write unit tests for classifier, formatter, scanner, exporter

### Phase 3: IPC Layer
1. Define all IPC channels and payloads in `src/shared/ipc-channels.ts`
2. Implement main process handlers with input validation
3. Implement `useScan` hook with start/cancel/progress/completion
4. Test IPC round-trip

### Phase 4: UI Implementation
1. Build `ScanConfigForm` (path picker, filters, options)
2. Build `ScanProgress` component
3. Build `ResultsTable` (sortable, virtualized if needed)
4. Build `CategoryChart` with Recharts
5. Build `DirectoryDetail` panel
6. Build `ExportPanel`
7. Wire everything to Zustand store

### Phase 5: Polish & Testing
1. Error handling UI (toast notifications for permission errors)
2. Dark/light theme with `localStorage` persistence
3. Performance: virtualize large result lists
4. E2E tests with Playwright (critical path)
5. Cross-platform build setup (electron-builder)
6. Security audit: path traversal, prototype pollution, eval
7. Performance benchmark vs Python baseline

### Phase 6: Cleanup
1. Remove `archive/python/` directory once all tests pass
2. Update `README.md` with Electron app screenshots and install instructions
3. Final `CHANGELOG.md` entry for v2.0.0

---

## 8. Testing Strategy

### Unit Tests (Vitest)
- **Classifier**: Every category, every edge case from `tests/test_suite.py`
- **Formatter**: Boundary values (0, 1023, 1024, 1024³, negative — should throw)
- **Scanner**: Temp directory fixtures, sequential vs parallel parity, size filtering, extension filtering
- **Exporter**: Snapshot tests matching Python output (or improved format with documented deltas)
- **FS Utils**: Hidden detection (mocked Windows FFI + real Unix dot-prefix), safe stat, path validation

### Integration Tests (Vitest)
- Scan a temp directory → verify `ScanResult` structure
- Export all formats → verify files parse correctly
- IPC round-trip → verify serialization/deserialization of complex types

### E2E Tests (Playwright)
- **Critical Path**: Open app → browse folder → scan → results appear → export CSV → file exists
- **Cancel Path**: Start scan → cancel → UI returns to idle, no crash
- **Error Path**: Scan protected directory → error alert appears, app remains stable
- **Theme Path**: Toggle dark/light → preference persists after reload

### Performance Benchmarks
- Scan same large directory with Python CLI and Electron app
- Target: within 2x of Python scan speed
- Memory profiling: ensure <200MB for 100K file scans

---

## 9. Critical Success Criteria

1. **Feature parity**: All Python CLI features available in GUI (scan, filter, classify, export text/csv/json)
2. **Performance**: Within 2x of Python scan speed (Electron/Node.js overhead acceptable)
3. **Responsiveness**: UI never freezes during scan (Async Task Pool + IPC)
4. **Cross-platform**: Builds and runs on Windows, macOS, Linux
5. **Type safety**: No `any` types in core logic, strict TypeScript throughout
6. **Security**: Passes `eslint-plugin-security` audit, no path traversal vulnerabilities
7. **Test coverage**: ≥80% line coverage on `src/main/core/`, all E2E critical paths green
8. **Showcase quality**: Clean code, comprehensive TSDoc, consistent UI, professional README

---

## 10. Notes for AI Agents

### Preservation Rule
When porting logic, **preserve existing behavior exactly** unless explicitly asked to change it. The Python codebase is the **source of truth** for algorithms and business logic.

### Platform-Specific Logic
- **Hidden directories**: On Windows use `koffi` + `GetFileAttributesW`. On Unix check dot prefix.
- **Path handling**: Use Node.js `path` module. Never use `path-browserify` or manual string concatenation.
- **Permissions**: Always wrap `fs` calls in `try/catch`. Return 0 or skip on error — never crash.

### Formatting Parity
- Percentage calculation: 2 decimal places, `<0.01%` threshold
- Human-readable sizes: `1.5 GB`, `0 B` (not `0 Bytes`)
- CSV/JSON: must be machine-parseable; TXT: human-readable with same info density as Python

### Export Format Policy
TS exports may **improve** upon Python format (better alignment, headers, metadata) but must remain backward-compatible where applicable. Any format changes must be documented in `CHANGELOG.md`.

### LLM-Assisted Development
This project uses `.cursorrules` for LLM context. Agents must respect:
- TSDoc contracts on all public APIs
- Strict TypeScript rules
- Modular architecture (no god objects)
- Test-first for core logic (classifier, scanner, formatter)

---

## 11. References

- **Python source of truth**: `archive/python/src/` (preserved for regression testing)
- **Python tests**: `archive/python/tests/test_suite.py`
- **UI specification**: `UI-SPEC.md`
- **Migration plan**: `PLAN.md`
- **LLM contracts**: `.cursorrules`
- **Architecture history**: `archive/python/docs/architecture.md`
- **Product requirements**: `archive/python/docs/PRD.md`
