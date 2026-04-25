# Directory Analyzer

**Author:** Alexander Sivolobov  
**Version:** 2.0.0  
**License:** MIT

A professional-grade cross-platform desktop application for personal storage analytics. Built with **TypeScript**, **Electron**, and **React**.

---

## Overview

Directory Analyzer helps power users identify and manage forgotten content that consumes significant disk space. It scans directories, classifies files into content categories, and presents interactive visualizations — all inside a native desktop application that runs on Windows, macOS, and Linux.

This project demonstrates professional-grade engineering: strict TypeScript, comprehensive unit tests, security-hardened IPC, native Windows hidden-directory detection via FFI, and a polished dark-mode UI.

---

## Architecture

```
Electron Main Process          Preload Script (bridge)        React Renderer
├─ fs/promises scanner         ├─ contextBridge API           ├─ ScanConfigForm
├─ Worker-like concurrent pool  │  (typed, secure)             ├─ ResultsTable
├─ ContentClassifier            │                              ├─ CategoryChart (Recharts)
├─ Exporter (TXT/CSV/JSON)     └──────────────────────────────├─ DirectoryDetail
└─ IPC Handlers                                                └─ ExportPanel
```

- **Security-first**: `contextIsolation: true`, `contextBridge` only, no `nodeIntegration`
- **Type safety**: Strict TypeScript (`strict: true`, `no-explicit-any` in core)
- **Cross-platform native feel**: macOS hidden title bar with draggable region, native file dialogs
- **Performance**: Concurrent async I/O pool for scanning without blocking the UI

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Electron 33 |
| Language | TypeScript 5.5 (strict) |
| Bundler | Vite (electron-vite) |
| UI | React 18 + Tailwind CSS |
| State | Zustand |
| Charts | Recharts |
| Tests | Vitest (unit) + Playwright (E2E) |
| Lint | ESLint + security plugins + Prettier |

---

## Quick Start

```bash
# Install dependencies
npm install

# Development (with HMR)
npm run dev

# Run tests
npm test                 # 47 unit tests
npx playwright test      # E2E

# Production build
npm run build

# Package for distribution
npm run dist             # .app / .exe / .AppImage
```

---

## Features

- **Interactive scan configuration** — folder picker, extension filters, min-size threshold, hidden-directory toggle
- **Real-time progress** — live directory counter with progress bar
- **Sortable results table** — path, size, percentage, file count; client-side filtering
- **Content breakdown charts** — pie and bar charts by category (Images, Videos, Audio, Documents, Office, Archives, Code, System)
- **Directory detail panel** — per-directory file list and dominant category
- **Export** — TXT, CSV, JSON via native save dialog
- **Dark / light theme** — persistent toggle
- **Cancel scan** — abort long-running scans instantly

---

## Project Structure

```
src/
  shared/          # Types, constants, IPC contracts (main + renderer)
  main/            # Electron main process
    core/          # Scanner, Classifier, Exporter
    utils/         # Format, FS helpers (koffi FFI for Windows hidden attrs)
    ipc/           # IPC handlers with input validation
    workers/       # (reserved for future Worker Threads)
  preload/         # Secure contextBridge API
  renderer/        # React application
    components/    # UI components
    hooks/         # useScan lifecycle hook
    store/         # Zustand store
```

---

## Quality Gates

- **TypeScript strict** — no `any` in core logic
- **ESLint + security** — `eslint-plugin-security`, `eslint-plugin-security-node`
- **Unit tests** — 47 tests covering classifier, scanner, exporter, formatters, FS utils
- **Parity test** — TS scanner verified against Python fixture sizes byte-for-byte
- **E2E** — Playwright launches real Electron window

---

## License

MIT — see [LICENSE](LICENSE).
