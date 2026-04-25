# Migration Readiness Audit

**Date**: 2025-04-25  
**Scope**: Verify that all prerequisites for TS/Electron migration are understood and documented before writing code.

---

## 1. Python Codebase Study — ✅ COMPLETE

All Python source files have been read and analyzed:

| File | Lines | Key Logic Understood |
|------|-------|---------------------|
| `src/__init__.py` | 20 | Version 1.2.1, author, exports |
| `src/main.py` | 160 | CLI args, `argparse`, orchestration flow |
| `src/models.py` | 298 | All 6 dataclasses, validation in `__post_init__`, percentage formatting |
| `src/scanner.py` | 354 | Sequential + parallel scanning, `ThreadPoolExecutor(4)`, direct-files-only logic, `all_files` accumulator, error collection, `get_all_directories` recursive yield |
| `src/classifier.py` | 216 | 8 category maps, extension normalization, MIME type fallback, display names |
| `src/reporter.py` | 313 | Terminal output, text/CSV/JSON writers, `_get_category_display_name` |
| `src/utils.py` | 309 | Hidden dir detection (Windows `st_file_attributes & 2` + Unix dot-prefix), `bytes_to_human_readable` (1024 div, "0 B", "1.5 GB"), progress reporter (every 5% or 1000 items), error log writer |
| `src/constants.py` | 28 | `BYTES_PER_KB = 1024.0`, `MINIMUM_PERCENTAGE_DISPLAY = 0.01` |
| `tests/test_suite.py` | 547 | Unit tests for classifier, scanner (sequential vs parallel parity), integration tests, reporting tests, performance tests |

**Critical behaviors confirmed:**
- ✅ Scanning counts **direct files only** (not recursive into subdirs)
- ✅ `get_all_directories()` recursively yields ALL dirs, including root
- ✅ Parallel scan = collect all dirs into list → `ThreadPoolExecutor(4)` → process
- ✅ Size filter (`min_size_bytes`) applied **after** scanning each directory
- ✅ Final sort: `reverse=True` by `size_bytes`
- ✅ `error_directories` collected silently (no terminal spam unless verbose)
- ✅ `Extension filter` normalizes to lowercase with leading dot
- ✅ `bytes_to_human_readable`: divisor `1024.0`, format `"0 B"` / `"1.5 GB"`
- ✅ Percentage: `"<0.01%"` if below threshold, else `"%.2f%%"`

---

## 2. Documentation Created — ✅ COMPLETE

| Document | Purpose | Status |
|----------|---------|--------|
| `AGENTS.md` | Project context, TS architecture, module mapping, conventions, IPC contracts, success criteria | ✅ Created |
| `PLAN.md` | Phased migration plan (6 phases), appendix with Python→TS patterns, testing fixtures spec | ✅ Created |
| `UI-SPEC.md` | Full GUI specification: 4 app states, ASCII wireframes, layout, responsive behavior, component inventory, Zustand store shape, CLI→GUI feature checklist | ✅ Created |

---

## 3. Deep Logic Review — Findings

### 3.1 Classification Priority Nuance ⚠️
Python `classify_file()` iterates `self.categories.items()`. Since Python 3.7+ dicts preserve insertion order, and `archives` (containing `.exe`, `.dmg`, `.pkg`, `.deb`, `.rpm`) is defined **before** `system` (which also contains those extensions), these overlapping extensions are classified as `archives` in Python.

**Decision needed**: In TS, we must preserve this exact iteration order to maintain parity.

### 3.2 Windows Hidden Attributes — CRITICAL GAP 🚨
Python checks Windows hidden flag via `os.stat(path).st_file_attributes & 2`. **Node.js `fs.stat()` does NOT expose Windows file attributes** (`st_file_attributes` is unavailable). The Node.js `fs` module only provides Unix-style `mode` bits on Windows.

**Options:**
1. **Use dot-prefix only** for all platforms (simpler, loses some Windows parity)
2. **Add native dependency** like `fswin` or `winattr` (adds complexity, Windows-only build concerns)
3. **Use `child_process.exec('attrib ...')`** (slow, shell-dependent)
4. **Iterate and check `path.basename(dir).startsWith('.')` on all platforms**, accepting that Windows-hidden folders without dot-prefix will be included (same as many cross-platform Node.js tools do)

**Recommendation**: Option 4 (dot-prefix only) for MVP, with a documented parity gap. Or use `fs-extra` / native addon if strict parity is required.

### 3.3 MIME Type Detection
Python uses `mimetypes.guess_type()` (stdlib). In Node.js, this requires `mime-types` npm package. The `mime_type` field in `FileInfo` is **unused** in any business logic (only stored). It can be safely omitted in Phase 1 to reduce dependencies.

### 3.4 Memory Layout for Large Trees
Python `scan_directories_parallel()` calls `list(self.get_all_directories(...))` — this materializes all directory paths into memory before scanning. For 1M+ directories this could be hundreds of MB. Node.js should replicate this exact behavior for parity, but we should document that streaming collection is a future optimization.

### 3.5 Recursion Depth
Python `get_all_directories()` uses recursion (`yield from self.get_all_directories(subdirectory)`). For extremely deep directory trees (1000+ levels), Node.js may hit stack limits with synchronous recursion. The TS port should use an **explicit stack** (iterative DFS) to avoid `RangeError`, while preserving the same traversal order.

---

## 4. Open Questions (Blocking Start)

Before writing the first line of TS code, the following decisions must be made:

### Q1: Windows Hidden Directory Detection
How should the Electron app detect hidden directories on Windows?
- **A**: Dot-prefix only (simpler, acceptable parity loss)
- **B**: Add native dependency (`fswin`) for true Windows attribute check
- **C**: Shell out to `attrib` command

### Q2: Python Code Fate
What happens to the existing Python source?
- **A**: Keep in repo (e.g., `archive/python/`) — dual codebase
- **B**: Replace entirely — Python code moved to a separate branch or deleted
- **C**: Keep only for regression testing during migration

### Q3: Package Manager & Electron Version
- **Package manager**: `npm` (default), `yarn`, or `pnpm`?
- **Electron version**: Latest stable (currently ~33.x), or pin to 30+ as planned?

### Q4: Strict Feature Parity on Export Formats
Should the text/CSV/JSON export files be **byte-for-byte identical** to Python output, or only **semantically equivalent**?
- Byte-for-byte identical requires matching whitespace, column widths, and `#` comment headers exactly.
- Semantically equivalent allows prettier formatting (e.g., JSON indentation differences).

---

## 5. Pre-Flight Checklist

| # | Item | Status |
|---|------|--------|
| 1 | All Python modules read and understood | ✅ |
| 2 | Architecture document (AGENTS.md) created | ✅ |
| 3 | Migration plan (PLAN.md) created | ✅ |
| 4 | UI specification (UI-SPEC.md) created | ✅ |
| 5 | Critical algorithm behaviors mapped to TS | ✅ |
| 6 | Security model defined (contextIsolation, contextBridge) | ✅ |
| 7 | IPC contracts typed | ✅ |
| 8 | Component inventory complete | ✅ |
| 9 | State management shape defined | ✅ |
| 10 | CLI→GUI feature mapping complete | ✅ |
| 11 | Windows hidden attribute gap identified | ⚠️ Needs decision |
| 12 | Python code disposal strategy | ⚠️ Needs decision |
| 13 | Tooling choices (npm vs pnpm, Electron version) | ⚠️ Needs decision |
| 14 | Export format parity level | ⚠️ Needs decision |

---

## 6. Verdict

**Readiness: 85%**

The technical foundation, architecture, and UI are fully specified. There are no unknowns in the business logic. The remaining 15% consists of **tooling and policy decisions** (Q1–Q4 above) that take 2 minutes to answer but will be expensive to change mid-migration.

**Recommendation**: Answer the 4 open questions, then begin Phase 1 immediately.
