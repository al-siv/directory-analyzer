# Security & Resilience Audit — Directory Analyzer v2.0.0

> **Date**: 2026-04-25  
> **Auditor**: Automated code review  
> **Scope**: `src/main/`, `src/preload/`, `src/renderer/`, `src/shared/`, configs  
> **Classification**: Critical / High / Medium / Low / Info  

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 1     |
| High     | 5     |
| Medium   | 8     |
| Low      | 6     |
| Info     | 4     |

The application has a solid security foundation (context isolation, nodeIntegration disabled, Zod validation on IPC), but several issues in edge-case handling, resource management, and input sanitization could lead to crashes, denial-of-service, or unexpected behavior.

---

## Critical

### C-01. `shell.openPath` allows opening arbitrary paths — potential RCE vector

**File**: `src/main/ipc/handlers.ts:103-109`

```typescript
ipcMain.handle(IPC_CHANNELS.OPEN_PATH, async (_event, dirPath: string) => {
  if (typeof dirPath !== 'string' || dirPath.length === 0) {
    return { success: false, error: 'Invalid path' };
  }
  const error = await shell.openPath(dirPath);
  return { success: error === '', error: error || undefined };
});
```

`shell.openPath()` opens a file or URL with the OS default application. If a malicious or corrupted `ScanResult` contains a `path` field pointing to a URL (`https://...`) or an executable, `openPath` will launch it. The validation only checks for non-empty string — there is no verification that the path is a directory, is absolute, or exists.

**Impact**: An attacker who can inject data into the Zustand store (via `localStorage` manipulation or a crafted `ScanResult`) can force the app to open arbitrary URLs, executables, or documents.

**Recommendation**:  
- Validate that `dirPath` is an absolute path with `path.isAbsolute()`  
- Verify it exists and is a directory with `fs.stat()` before calling `shell.openPath`  
- Reject paths containing `://` (URL schemes)  

---

## High

### H-01. Race condition: concurrent scans overwrite `activeScanner`

**File**: `src/main/ipc/handlers.ts:18, 27-51`

```typescript
let activeScanner: DirectoryScanner | null = null;

ipcMain.handle(IPC_CHANNELS.SCAN_START, async (event, options) => {
  activeScanner = new DirectoryScanner(validated);
  // ...
});
```

If the user starts a second scan before the first completes, `activeScanner` is overwritten. The first scan continues running in the background (its promise is still in-flight) but can no longer be cancelled. The old scan's progress events will still fire on the window.

**Impact**: Uncancellable orphan scans, memory leak, confusing progress updates.

**Recommendation**:  
- Reject new scans when `activeScanner !== null` (return an error)  
- Or cancel any in-flight scan before starting a new one  

---

### H-02. `window` reference may be null during progress callback

**File**: `src/main/ipc/handlers.ts:31-39`

```typescript
const window = BrowserWindow.fromWebContents(event.sender);

try {
  const result = await activeScanner.scan(true, (current, total) => {
    window?.webContents.send(IPC_CHANNELS.SCAN_PROGRESS, { ... });
  });
```

`BrowserWindow.fromWebContents()` can return `null` if the window was closed between scan start and progress callback invocation. The optional chaining (`window?.`) prevents a crash, but silently swallowing events means the scan continues in the background with no UI feedback and no way to cancel.

**Impact**: Ghost scan running after window closed, resource leak.

**Recommendation**:  
- Check `window?.isDestroyed()` before each send  
- Abort the scan if the window is closed or destroyed  

---

### H-03. `sandbox: false` in webPreferences

**File**: `src/main/index.ts:28`

```typescript
sandbox: false,
contextIsolation: true,
nodeIntegration: false,
```

Sandbox is disabled to allow koffi FFI in the preload script. This weakens the security boundary between the renderer and the OS. If the renderer process is compromised (XSS, dependency supply chain attack), the attacker gains access to the full preload bridge including `ipcRenderer`.

**Impact**: Expanded attack surface if renderer is compromised.

**Recommendation**:  
- Move koffi loading to the main process only (it's already only used in `fs.ts` which runs in main)  
- Re-enable `sandbox: true` for the preload/renderer  
- The preload script currently only uses `contextBridge` and `ipcRenderer`, both of which work with sandboxing  

---

### H-04. Export handler accepts unsanitized `ScanResult` from renderer

**File**: `src/main/ipc/handlers.ts:58-84`

```typescript
ipcMain.handle(IPC_CHANNELS.EXPORT_RESULTS,
  async (_event, payload: { result: ScanResult; format: OutputFormat }) => {
    const { result, format } = payload;
    // No validation of result or format
    await exportResults(result, format, filePath);
```

The `EXPORT_RESULTS` handler does not validate `format` or `result` with Zod. The renderer sends the full `ScanResult` object over IPC. Since `ScanResult` contains arrays of user-controlled paths, a manipulated payload could contain:

- Paths with `..` segments or absolute paths in `result.scanOptions.targetPath` (written into the export file content)
- Extremely large `directories` arrays causing OOM
- Non-string values in path fields causing crashes in `bytesToHumanReadable` or string interpolation

**Impact**: Unexpected behavior or denial-of-service via crafted IPC payloads.

**Recommendation**:  
- Add Zod schemas for `ScanResult` and `OutputFormat`  
- Validate `format` is one of `'text' | 'csv' | 'json'`  
- Validate `result` structure before writing  

---

### H-05. CSV injection via path values in export

**File**: `src/main/core/exporter.ts:131`

```typescript
lines.push(
  `${i + 1},"${d.path}",${d.sizeBytes},...`
);
```

Directory paths are wrapped in double quotes but not sanitized for CSV injection. If a directory name contains `=`, `+`, `-`, or `@` at the start of a cell (e.g., a directory named `=CMD(...)`) and the CSV is opened in Excel/Sheets, it will execute formulas.

The `d.path` is always an absolute path (e.g., `/Users/.../`), so the first character is `/` or `C:\`, making exploitation unlikely in practice. However, the path is user-controllable and the spec says this is a showcase project.

**Impact**: CSV injection if export is opened in spreadsheet software.

**Recommendation**:  
- Escape leading formula characters (`=`, `+`, `-`, `@`, `\t`, `\r`) by prefixing with a single quote  
- Or strip/replace dangerous characters from directory path values in CSV output  

---

## Medium

### M-01. `collectAllDirectories` does not enforce recursion depth limit

**File**: `src/main/core/scanner.ts:129-163`

The iterative directory collection has no maximum depth or maximum count limit. On filesystems with circular symlinks (already partially mitigated by `realpath` + `visited` set) or extremely deep directory trees, this loop can:

- Consume unbounded memory (the `dirs` array grows without limit)
- Run indefinitely on network-mounted filesystems with high latency
- Collect millions of entries for large drives

**Impact**: Out-of-memory crash or UI freeze on very large or pathological directory structures.

**Recommendation**:  
- Add a configurable `maxDepth` option (default: 50)  
- Add a `maxDirectories` hard limit (e.g., 1,000,000)  
- Check `signal.aborted` more frequently (currently only at the top of the while loop)  

---

### M-02. Unbounded `allFiles` and `errorDirectories` arrays in scanner

**File**: `src/main/core/scanner.ts:50-51`

```typescript
private readonly errorDirectories: string[] = [];
private readonly allFiles: FileInfo[] = [];
```

`allFiles` grows with every file encountered. For a drive with 1M files, this array holds 1M `FileInfo` objects in memory simultaneously. Each `FileInfo` stores the full path string, which can be 200+ bytes.

Estimated worst case: 1M files × ~300 bytes = ~300 MB just for file metadata.

**Impact**: High memory consumption, possible OOM on large scans.

**Recommendation**:  
- Process `allFiles` in batches for category statistics  
- Or stream category aggregation incrementally instead of storing all `FileInfo` objects  

---

### M-03. `validateScanOptions` does not check for path traversal in `targetPath`

**File**: `src/main/ipc/handlers.ts:121-140`

```typescript
function validateScanOptions(options: unknown): ScanOptions {
  const parsed = ScanOptionsSchema.parse(options);
  const targetPath = resolve(normalize(parsed.targetPath));
  if (!isAbsolute(targetPath)) {
    throw new Error('targetPath must be absolute');
  }
  return { ...parsed, targetPath, ... };
}
```

While `resolve(normalize(...))` and `isAbsolute()` provide some protection, the code does not verify that the path actually exists or is a directory. A renderer could send:

- `/dev/null` (not a directory, but `isAbsolute` passes)
- `/proc/self/mem` (readable on Linux, but not a directory)
- A network path like `\\\\server\\share` on Windows

**Impact**: Unexpected behavior, confusing error messages, potential information disclosure.

**Recommendation**:  
- Verify the resolved path exists and is a directory using `fs.stat()` before scanning  

---

### M-04. Preload `onScanProgress` listener accumulates without cleanup on re-render

**File**: `src/renderer/hooks/useScan.ts:15-23`

```typescript
useEffect(() => {
  const unsubProgress = window.electronAPI.onScanProgress(update => {
    useScanStore.getState().setProgress(update);
  });
  return (): void => { unsubProgress(); };
}, []);
```

This `useEffect` correctly returns a cleanup function. However, `useScan()` is called from `ScanConfigForm`, which is always mounted. If `useScan` is ever called from multiple components (or if React StrictMode double-mounts in development), duplicate listeners could accumulate. The `useEffect` dependency array `[]` is correct, but the pattern relies on `ScanConfigForm` being the sole consumer.

**Impact**: Minor — potential duplicate progress callbacks in edge cases.

**Recommendation**:  
- Move the `onScanProgress` subscription to `App.tsx` or a dedicated provider to guarantee single-subscription semantics  

---

### M-05. Zustand `persist` middleware stores partial state in `localStorage` without encryption

**File**: `src/renderer/store/scanStore.ts:104-113`

```typescript
persist(
  (set) => ({ ... }),
  {
    name: 'directory-analyzer-config',
    partialize: (state) => ({
      theme: state.theme,
      includeHidden: state.includeHidden,
      topCount: state.topCount,
      minSizeMb: state.minSizeMb,
      extensions: state.extensions,
    }),
  }
)
```

`localStorage` is accessible by any JavaScript running in the renderer. While the persisted fields are low-risk (theme, filter settings), a malicious script injected via a dependency could modify `extensions` or `topCount` to extreme values, causing unexpected scan behavior.

**Impact**: Low — stored preferences manipulation.

**Recommendation**:  
- Validate persisted state on load (e.g., clamp `topCount` to max 10000, `minSizeMb` to >= 0)  
- Consider using Electron's `safeStorage` API for sensitive settings  

---

### M-06. `getSubdirectories` and `getDirectFiles` silently swallow errors

**File**: `src/main/utils/fs.ts:110-121, 130-146`

Both generators wrap their entire body in `try/catch` with empty catch blocks:

```typescript
export async function* getDirectFiles(directory: string): AsyncGenerator<string> {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    // ...
  } catch {
    // Swallow permission errors silently
  }
}
```

If `readdir` throws due to a transient error (e.g., network disconnect, disk I/O error), the generator silently terminates with no indication to the caller. The scanner has no way to distinguish "empty directory" from "readdir failed mid-scan."

**Impact**: Silent data loss — directories may appear to have 0 files when they actually had permission or I/O errors.

**Recommendation**:  
- Distinguish between ENOENT/ENOTDIR (expected) and EACCES/EIO (unexpected)  
- Yield error info to callers via a result type or error callback  
- Or at minimum, log errors with `console.warn`  

---

### M-07. `scanParallel` results array mutated concurrently without synchronization

**File**: `src/main/core/scanner.ts:204-238`

```typescript
const results: DirectoryInfo[] = [];
// ...
const processOne = async (dirPath: string): Promise<void> => {
  // ...
  results.push(dirInfo);  // concurrent push
};
```

Multiple async callbacks call `results.push()` concurrently. While V8's event loop ensures single-threaded execution (Node.js is single-threaded for JS), the `push` calls happen in different microtask iterations. This is safe in practice but architecturally fragile — a future migration to worker threads would introduce data races.

**Impact**: Currently safe, but fragile for future refactoring.

**Recommendation**:  
- Collect results via the `Promise.race` loop instead of shared mutable array  
- Or document the single-threaded assumption explicitly  

---

### M-08. No timeout for scan operations

**File**: `src/main/core/scanner.ts:70-117`

The `scan()` method has no maximum duration. A scan of a network drive or an extremely large directory structure could run for hours with no automatic termination. The user can cancel, but there is no automatic safeguard.

**Impact**: Unbounded resource consumption, poor UX on stalled scans.

**Recommendation**:  
- Add a configurable timeout (default: 30 minutes)  
- Abort with a clear error message if exceeded  

---

## Low

### L-01. `koffi` module loaded globally via `require()` with no cleanup

**File**: `src/main/utils/fs.ts:24-39`

The `koffiModule` and `getFileAttributesW` variables are module-level singletons that are never freed. The `kernel32` library handle is never closed (`kernel32.unload()`). On Windows, this leaks a DLL reference for the lifetime of the process.

**Impact**: Minor — one DLL handle leak per process lifetime.

**Recommendation**:  
- Call `kernel32.unload()` in an `app.on('before-quit')` handler  
- Or accept as negligible (single handle per process)  

---

### L-02. `ScanOptionsSchema` does not validate `targetPath` format

**File**: `src/shared/schemas.ts:16-23`

```typescript
export const ScanOptionsSchema = z.object({
  targetPath: z.string().min(1),
  // ...
});
```

`targetPath` only validates as a non-empty string. It accepts any string including URLs, relative paths, and paths with null bytes. The handler's `validateScanOptions` does further validation, but the schema itself is permissive.

**Impact**: Defense-in-depth gap — schema alone won't catch malformed paths.

**Recommendation**:  
- Add a `.refine()` to check for null bytes (`\0`) and path separators  
- Or use a custom Zod transformer for path validation  

---

### L-03. Error messages expose internal filesystem paths

**File**: `src/main/ipc/handlers.ts:47`

```typescript
return { success: false, error: err instanceof Error ? err.message : String(err) };
```

Node.js `fs` errors include full system paths in messages (e.g., `EPERM: operation not permitted, scandir '/Users/admin/private'`). These are sent to the renderer and could be logged or displayed.

**Impact**: Low — information disclosure of directory paths within the user's own system. Acceptable for a desktop app but noted for completeness.

**Recommendation**:  
- Sanitize error messages before sending to renderer (remove or truncate paths)  

---

### L-04. `extensionFilter` in `ScanOptions` bypasses Zod item-level validation

**File**: `src/shared/schemas.ts:22`

```typescript
extensionFilter: z.array(z.string().min(1)).nullable(),
```

The schema accepts any non-empty string. The handler normalizes extensions (`toLowerCase`, prefix dot), but does not validate characters. A crafted extension like `..` or `/.hidden` would pass Zod and handler validation.

**Impact**: Negligible — extensions are only used for filtering against actual file extensions, never as paths.

**Recommendation**:  
- Add regex validation: `z.string().min(1).regex(/^\.[a-z0-9]+$/i)`  

---

### L-05. No rate limiting on IPC calls

**File**: `src/main/ipc/handlers.ts:26-109`

All `ipcMain.handle()` registrations have no rate limiting. A compromised renderer could flood the main process with rapid `SCAN_START` calls, each creating a new `DirectoryScanner`.

**Impact**: Denial-of-service via IPC flooding.

**Recommendation**:  
- Add a simple debounce or throttle for `SCAN_START` (e.g., 1 request per second)  

---

### L-06. Hardcoded `appUserModelId`

**File**: `src/main/index.ts:55`

```typescript
electronApp.setAppUserModelId('com.electron');
```

The app user model ID is set to the generic `com.electron` instead of the app-specific `com.sivolobov.directory-analyzer` defined in `package.json` build config.

**Impact**: Incorrect taskbar grouping on Windows, confusion with other Electron apps.

**Recommendation**:  
- Change to `'com.sivolobov.directory-analyzer'`  

---

## Info

### I-01. Compiled `.js` artifacts in `src/` directory

18 `.js` files exist alongside `.ts`/`.tsx` sources (e.g., `src/shared/types.js`, `src/renderer/App.js`). While `.gitignore` has `src/**/*.js`, these may be committed artifacts. They should be verified and removed if tracked by git.

### I-02. `SCAN_COMPLETE` and `SCAN_ERROR` IPC channels defined but unused

**File**: `src/shared/ipc-channels.ts:16-20`

The channels `scan:complete` and `scan:error` are defined but never used. The scan completion/error is communicated via the return value of `SCAN_START` (`ipcMain.handle`), not via a separate push event. This is functionally correct but misleading for future developers.

### I-03. `large-structure/` test fixture directory missing

The AGENTS.md specifies `tests/fixtures/large-structure/` but it does not exist. This limits performance testing.

### I-04. `MAX_WORKERS = 4` is not based on CPU count

**File**: `src/shared/constants.ts:23`

The parallel scan concurrency is hardcoded to 4 regardless of the machine's CPU core count. `os.cpus().length` would be a more appropriate default.

---

## Security Postive Notes

The following practices are correctly implemented:

1. **`contextIsolation: true`** + **`nodeIntegration: false`** — strong renderer isolation
2. **Zod validation** on `SCAN_START` IPC input — runtime type safety
3. **`webSecurity: true`** — prevents cross-origin requests in renderer
4. **`contextBridge`** in preload — only a typed API object is exposed
5. **`setWindowOpenHandler`** — opens external URLs in system browser, denies in-app navigation
6. **Symlink cycle detection** via `realpath` + `visited` set in scanner
7. **Read-only filesystem operations** — app never writes, moves, or deletes user files
8. **ESLint security plugin** configured with relevant rules
9. **Husky + lint-staged** — pre-commit hooks enforce code quality
10. **Export path** comes from native save dialog, not renderer-supplied

---

## Recommended Priority for Fixes

| Priority | Issues | Effort |
|----------|--------|--------|
| **P0 — Immediate** | C-01, H-01, H-04 | 2-4 hours |
| **P1 — Before release** | H-02, H-03, H-05, M-01, M-02, M-06 | 1-2 days |
| **P2 — Next iteration** | M-03, M-04, M-05, M-07, M-08 | 1 day |
| **P3 — When convenient** | L-01 through L-06, I-01 through I-04 | 2-3 hours |
