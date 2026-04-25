# Directory Analyzer v2.0.0 — Аудит кода

**Дата:** 2026-04-25  
**Аудитор:** AI Code Reviewer  
**Объект:** TypeScript + Electron десктопное приложение (миграция с Python CLI v1.2.1)

---

## Резюме

Проект находится в функционально работоспособном состоянии: 47/47 тестов проходят, сканер корректно обрабатывает файловую систему, экспорт работает во всех трёх форматах. Однако обнаружен **ряд критических и значительных проблем**, требующих внимания: функциональный баг в UI, мёртвые IPC-события и мёртвые поля ScanOptions, отсутствие защиты от symlink-циклов, мёртвая зависимость, рассинхронизация пакетного менеджера, отсутствие pre-commit хуков, дублирование кода и недостаточное покрытие тестами.

**Обнаружено:**
- 🔴 Критических: **5**
- 🟠 Значительных: **12**
- 🟡 Умерённых: **9**
- 🔵 Незначительных: **8**

---

## 1. Критические проблемы (🔴)

### 1.1. `DirectoryDetail` — кнопка «Show in Finder» открывает save dialog

**Файл:** `src/renderer/components/DirectoryDetail.tsx:26-28`

```typescript
const openInFinder = (): void => {
  void window.electronAPI.showSaveDialog({})
}
```

Функция `openInFinder` вызывает `showSaveDialog` вместо открытия директории в системном файловом менеджере. Пользователь нажимает «Show in Finder / Explorer» и получает диалог сохранения файла.

**Рекомендация:** Добавить новый IPC-канал `shell:open-path` и использовать `shell.openPath(dir.path)` в main process.

### 1.2. IPC-события `SCAN_COMPLETE` и `SCAN_ERROR` никогда не отправляются

**Файлы:** `src/main/ipc/handlers.ts`, `src/preload/index.ts:39-51`

Main process использует `ipcMain.handle` для `SCAN_START`, который возвращает результат через `return { success, result }`. Однако preload скрипт регистрирует слушатели на `scan:complete` и `scan:error` через `ipcRenderer.on()`, а renderer подключает их в `useScan.ts:15-32`.

Main process **нигде не вызывает** `webContents.send(IPC_CHANNELS.SCAN_COMPLETE, ...)` или `SCAN_ERROR`. Подписки `onScanComplete` и `onScanError` — **мёртвый код**.

**Влияние:**
- `useScan.ts` подписывается на `onScanComplete`/`onScanError`, но результат приходит через return value `scanStart()`.
- Двойная логика обработки: через IPC-событие (неработающее) + через return value. При модификации можно случайно добавить логику в неработающий слушатель.
- `onScanError` никогда не сработает, ошибки обрабатываются только в `startScan` callback.

**Рекомендация:** Выбрать одну модель:
- **Вариант A (рекомендуется):** Убрать подписки на `SCAN_COMPLETE`/`SCAN_ERROR` из preload и useScan, убрать `onScanComplete`/`onScanError` из ElectronAPI.
- **Вариант B:** Переписать handlers.ts на отправку событий через `webContents.send()`.

### 1.3. `topCount` из ScanOptions **никогда не применяется** к результатам

**Файлы:** `src/shared/types.ts:35`, `src/main/core/scanner.ts`, `src/main/ipc/handlers.ts:128`

Пользователь настраивает «Top count» в UI (по умолчанию 50). Значение проходит через store → IPC → валидацию в handlers.ts. Но **сканер никогда не использует `options.topCount`** — он возвращает **все** найденные директории без ограничения. Экспортер тоже не ограничивает вывод.

Для файловой системы с 10 000+ директорий UI получит полный список, что негативно скажется на производительности таблицы и потреблении памяти.

**Рекомендация:** Применять `topCount` после сортировки:
```typescript
results.sort((a, b) => b.sizeBytes - a.sizeBytes)
results = results.slice(0, this.options.topCount)
```

### 1.4. Нет защиты от symlink-циклов — потенциально бесконечный обход

**Файл:** `src/main/core/scanner.ts:116-140` (`collectAllDirectories`)

`getSubdirectories` использует `readdir({ withFileTypes: true })`, при котором `entry.isDirectory()` возвращает `true` для symlink на директорию. Если в файловой системе есть циклические symlinks (например, `a/b -> a`), метод `collectAllDirectories` зациклится и никогда не завершится.

Кроме того, symlinks могут указывать за пределы сканируемого корня, что приведёт к обходу непредусмотренных областей диска.

**Рекомендация:**
- Использовать `realpath()` для canonicalize каждого пути и проверять, что он не повторяется (Set canonical paths).
- Или использовать `lstat` + `isSymbolicLink` для исключения symlinks из обхода.

### 1.5. Несоответствие пакетного менеджера — npm вместо pnpm

**Файлы:** `package-lock.json`, `AGENTS.md`

AGENTS.md прямо указывает: **"Package Manager: pnpm (deterministic, disk-efficient, workspace-ready)"**. Однако в проекте присутствует `package-lock.json` (npm) и отсутствует `pnpm-lock.yaml`. Это несоответствие documentation vs reality — проблема для showcase-проекта.

**Рекомендация:** Либо переключиться на pnpm (как заявлено), либо обновить AGENTS.md.

---

## 2. Значительные проблемы (🟠)

### 2.1. `outputFile` и `errorLogFile` — мёртвые поля ScanOptions

**Файлы:** `src/shared/types.ts:33,44`, `src/main/ipc/handlers.ts:125-126`

Эти поля устанавливаются в `useScan.ts:57,61` как bare filenames (`'largest_directories.txt'`, `'no-access.txt'`), проходят валидацию в handlers.ts через `resolve(normalize(...))`, превращаясь в абсолютные пути относительно CWD, — но **нигде не используются**: ни scanner, ни exporter их не читают. Экспорт использует путь из save dialog.

Это мёртвый код, который вводит в заблуждение и увеличивает поверхность валидации без пользы.

**Рекомендация:** Удалить из `ScanOptions` или реализовать логику записи error log и default output.

### 2.2. `verbose` из ScanOptions **никогда не используется**

**Файл:** `src/shared/types.ts:41`

Пользователь может включить «Verbose progress» в UI. Опция проходит через IPC, но сканер **нигде не проверяет** `options.verbose`. В `ScanProgressUpdate.currentPath` всегда записывается `''` (handlers.ts:38). Тип `ScanProgressUpdate` имеет поле `currentPath` с пометкой «when verbose», но оно всегда пустое.

**Рекомендация:** Реализовать verbose mode (передавать текущий путь в progress update) или убрать из UI.

### 2.3. Покрытие тестами ниже заявленного порога (68.28% vs 80%)

**Файл:** `vitest.config.ts` требует ≥80% lines.  
**Факт:** `lines: 68.28%`, `statements: 68.28%`.

| Модуль | Lines | Branches | Комментарий |
|--------|-------|----------|-------------|
| `main/index.ts` | 0% | 0% | Electron bootstrap |
| `main/ipc/handlers.ts` | 0% | 0% | Нет тестов вообще |
| `main/core/exporter.ts` | 98.42% | **45.45%** | Error branches не покрыты |
| `main/utils/progress.ts` | 93.84% | **37.5%** | Оба режима (null/known total) |
| `main/core/scanner.ts` | 89.71% | 79.16% | Error paths не покрыты |
| `main/utils/fs.ts` | 83.91% | 72.72% | Catch блоки не покрыты |

**Рекомендация:** Добавить тесты для IPC handlers (mock electron), progress reporter edge cases, scanner error paths, fs catch-блоки.

### 2.4. Мёртвая зависимость `electron-updater`

**Файл:** `package.json:61`

`electron-updater` указан в `dependencies`, но **нигде не используется** в исходном коде. Нет `import`, нет `autoUpdater`, нет конфигурации publish в electron-builder. Это увеличивает размер bundle и атаковую поверхность.

**Рекомендация:** Удалить из зависимостей или реализовать auto-update.

### 2.5. Отсутствие pre-commit хуков (Husky)

`package.json` содержит конфигурацию `lint-staged` и `husky` в devDependencies, но **нет директории `.husky/`**. Commit'ы не блокируются при провале lint/tests.

**Рекомендация:** Выполнить `npx husky init` и добавить хуки.

### 2.6. Отсутствует хук `useIpc` из архитектуры

**Файл:** `src/renderer/hooks/` — нет `useIpc.ts`

AGENTS.md описывает `useIpc` как отдельный хук. Его функциональность встроена в `useScan.ts`. Это архитектурное отклонение от плана.

**Рекомендация:** Создать хук или обновить документацию.

### 2.7. Отсутствует Worker Thread (`scan.worker.ts`) — документация не обновлена

**Файл:** `src/main/workers/scan.worker.ts` — не существует

AGENTS.md Phase 2 описывает Worker Thread. Вместо этого scanner использует async task pool (с обоснованием в комментарии scanner.ts:170-173). Документация не обновлена.

**Рекомендация:** Обновить AGENTS.md: заменить "Worker Threads" на "Async Task Pool" с обоснованием.

### 2.8. Неиспользуемый тип `EnhancedDirectoryInfo`

**Файл:** `src/shared/types.ts:156-168`

Интерфейс определён, но **нигде не используется**. DirectoryDetail показывает только базовую информацию из `DirectoryInfo`.

### 2.9. Дублирование логики форматирования в renderer

**Файлы:**
- `src/renderer/components/ResultsTable.tsx:65-75` — `formatSize()`
- `src/renderer/components/SummaryCards.tsx:32-42` — `formatSize()`
- `src/renderer/components/ResultsTable.tsx:77-83` — `formatPct()`

Функции форматирования дублируются вместо использования `bytesToHumanReadable` и `formatPercentage`. `@main/utils/format` недоступен в renderer.

**Рекомендация:** Создать `src/renderer/utils/format.ts` (или вынести в `src/shared/utils/format.ts`).

### 2.10. `sandbox: false` в webPreferences

**Файл:** `src/main/index.ts:25`

Sandbox отключён. AGENTS.md заявляет о приоритете безопасности, но не обосновывает отключение sandbox.

**Рекомендация:** Если необходимо — задокументировать причину в комментарии. Иначе включить.

### 2.11. `ScanProgress` — мёртвый conditional render

**Файл:** `src/renderer/components/ScanProgress.tsx:32-37`

```tsx
{scanResult && (
  <p>{scanResult.totalScanned.toLocaleString()} directories found so far</p>
)}
```

`scanResult` всегда `null` во время сканирования — он очищается в `useScan.ts:44` перед стартом и устанавливается только после завершения. Этот блок **никогда не рендерится**.

**Рекомендация:** Использовать `progress.current` вместо `scanResult.totalScanned`, или убрать блок.

### 2.12. `window.alert()` для ошибок экспорта

**Файл:** `src/renderer/components/ExportBar.tsx:12`

```typescript
window.alert(`Export failed: ${result.error}`)
```

Нативный `alert()` блокирует render thread и выглядит неуместно в десктопном приложении. AGENTS.md предусматривает «toast notifications for permission errors».

**Рекомендация:** Заменить на toast notification или inline error message.

---

## 3. Умерённые проблемы (🟡)

### 3.1. Устаревшие зависимости (29 из 29 пакетов outdated)

| Пакет | Текущая | Последняя | Разрыв |
|-------|---------|-----------|--------|
| `electron` | 33.x | 41.x | 8 major |
| `vite` | 5.x | 8.x | 3 major |
| `vitest` | 1.x | 4.x | 3 major |
| `eslint` | 8.x | 10.x | 2 major |
| `react` | 18.x | 19.x | 1 major |
| `recharts` | 2.x | 3.x | 1 major |
| `zustand` | 4.x | 5.x | 1 major |
| `tailwindcss` | 3.x | 4.x | 1 major |
| `typescript` | 5.x | 6.x | 1 major |
| `electron-builder` | 25.x | 26.x | 1 major |
| `electron-vite` | 2.x | 5.x | 3 major |

**Рекомендация:** Запланировать обновление. Приоритет: electron-builder (устраняет tar уязвимости), потом vitest, vite, react.

### 3.2. 18 уязвимостей безопасности (npm audit)

- **10 High:** `tar` (через `electron-builder`) — Arbitrary File Overwrite, Symlink Poisoning, Path Traversal
- **6 Moderate:** через `vitest`, `@vitest/coverage-v8`
- **2 Low:** `@tootallnate/once`

**Fix:** Обновление `electron-builder` до 26.x решает большинство.

### 3.3. `WebkitAppRegion` — type assertion `as string`

**Файлы:** `App.tsx:24,27`, `ThemeToggle.tsx:13`

```typescript
style={{ ['WebkitAppRegion' as string]: 'drag' }}
```

Обходит TypeScript type checking.

**Рекомендация:** Добавить type augmentation:
```typescript
declare module 'react' {
  interface CSSProperties {
    WebkitAppRegion?: 'drag' | 'no-drag'
  }
}
```

### 3.4. Theme persist — отсутствует localStorage

**Файл:** `src/renderer/store/scanStore.ts`

AGENTS.md заявляет: "theme preference persisted to localStorage". Тема хранится только в Zustand store и **сбрасывается при перезагрузке**. Начальное значение всегда `'dark'` (hardcoded).

**Рекомендация:** Использовать `zustand/middleware` с `persist`.

### 3.5. Progress reporter — некорректная логика отчётности для малых total

**Файл:** `src/main/utils/progress.ts:46`

```typescript
if (percent > this.lastReported && percent % 5 === 0) {
```

При `total < 20` прогресс может не отправиться ни разу (ни одно число не кратно 5). `finish()` всегда отправляет финальное значение, но промежуточный прогресс отсутствует.

**Рекомендация:** Использовать пороговый подход:
```typescript
if (percent - this.lastReported >= PROGRESS_PERCENTAGE_INTERVAL) {
```

### 3.6. `classifier.ts` — перекрывающиеся расширения

`.exe`, `.dmg`, `.pkg`, `.deb`, `.rpm` находятся в **обоих** категориях (archives и system). Текущее поведение: побеждает archives (inserted first). Семантически `.exe` — исполняемый файл, `.dmg` — образ диска.

**Рекомендация:** Выделить пересекающиеся расширения в `installers` или удалить из archives.

### 3.7. `.csv` отсутствует в классификаторе

Файл `data.csv` в тестах будет классифицирован как `other`, хотя логически это office/document.

**Рекомендование:** Добавить `.csv`, `.tsv` в категорию `office`.

### 3.8. Неконсистентное построение путей в `getSubdirectories`

**Файл:** `src/main/utils/fs.ts:135`

```typescript
!isHiddenDirectory(`${directory}/${entry.name}`)
```

Используется string concatenation с `/` вместо `path.join()`. На Windows создаёт пути с mixed slashes (`C:\Users\foo/.config`). Вся остальная кодовая база использует `path.join()`.

**Рекомендация:** Заменить на `path.join(directory, entry.name)`.

### 3.9. `isAccessibleDirectory` — избыточный вызов `access()`

**Файл:** `src/main/utils/fs.ts:72-80`

```typescript
await access(dirPath)    // без mode — проверяет только существование
await readdir(dirPath)   //这才是 реальная проверка read-доступа
```

`access()` без mode аргумента проверяет только существование файла. `readdir()` уже проверяет и существование, и read-доступ. Первый вызов избыточен и тратит системный вызов.

**Рекомендация:** Убрать `access()`, оставить только `readdir()`.

---

## 4. Незначительные проблемы (🔵)

### 4.1. `.gitignore` содержит Python-артефакты

130 строк Python-специфичных паттернов (`__pycache__`, `.tox`, Django, Flask, Scrapy, и т.д.) в TypeScript/Electron проекте.

**Рекомендация:** Удалить Python-специфичные паттерны.

### 4.2. `scripts/generate-icon.js` не используется в npm scripts

Назначение не документировано, не вызывается из npm scripts.

### 4.3. `tests/fixtures/run-python-scan.py` — нет npm script для запуска

Полезен для регрессии, но нет способа запуска через npm.

### 4.4. Hardcoded version string

**Файл:** `src/renderer/App.tsx:29`

```tsx
<span>v2.0.0</span>
```

**Рекомендация:** Использовать Vite env variable или IPC.

### 4.5. `ScanConfigForm` — `useScanStore()` без selector

**Файл:** `src/renderer/components/ScanConfigForm.tsx:10`

```typescript
const store = useScanStore()  // subscribes to ALL state changes → лишние рендеры
```

**Рекомендация:** Использовать selectors для каждого поля.

### 4.6. `SHOW_SAVE_DIALOG` — мёртвый IPC handler

Вызывается только из сломанного `openInFinder` в DirectoryDetail. ExportBar использует `EXPORT_RESULTS` с собственным dialog.

### 4.7. ESLint config исключает `tests/` из lint

**Файл:** `.eslintrc.cjs:12`

```javascript
ignorePatterns: ['dist', 'out', 'node_modules', '*.cjs', '*.mjs', 'tests'],
```

Тесты полностью исключены из lint.

**Рекомендация:** Удалить `tests` из ignorePatterns, оставить overrides.

### 4.8. `pluralize` и `formatPathForDisplay` экспортируются, но не используются

**Файл:** `src/main/utils/format.ts:79,100`

Обе функции покрываются только тестами. В product code не вызываются.

---

## 5. Архитектурные наблюдения

### 5.1. Отсутствует shared utils layer

Renderer не может импортировать из `@main/`, а `@shared/` содержит только types и constants. Функции форматирования дублируются. Необходимо создать `src/shared/utils/`.

### 5.2. IPC model: смешаны две модели

Проект объявляет `ipcRenderer.on()` подписки (events), но реально использует только `ipcMain.handle` / `ipcRenderer.invoke` (request-response). `SCAN_PROGRESS` — единственное событие, реально отправляемое через `webContents.send()`.

### 5.3. Нет React Error Boundary

При ошибке рендера приложение упадёт с белым экраном. AGENTS.md (Phase 5) предусматривает «Error handling UI (toast notifications for permission errors)».

### 5.4. Временные файлы тестов в репозитории

`scanner.spec.ts` создаёт `tests/fixtures/tmp-scanner-test/`, `exporter.spec.ts` — `tests/fixtures/tmp-export-test.txt`. При crash тестов файлы остаются. При force kill процесса cleanup не сработает.

**Рекомендация:** Использовать `os.tmpdir()`.

### 5.5. Нет logging infrastructure

Main process не имеет структурированного логирования. Ошибки молча проглатываются в catch-блоках.

### 5.6. Потенциальная проблема с памятью для больших сканов

`DirectoryScanner.allFiles: FileInfo[]` накапливает метаданные **каждого** файла в памяти. Для файловой системы с 1M+ файлов каждый `FileInfo` (~200 bytes) потребует ~200 MB только на этот массив.

**Рекомендация:** Рассмотреть streaming-подход: агрегировать статистику на лету, не сохраняя все FileInfo.

---

## 6. Мёртвый код — сводка

| Элемент | Расположение | Статус |
|---------|-------------|--------|
| `SCAN_COMPLETE` listener | `preload/index.ts:39-44`, `useScan.ts:20-25` | Событие никогда не отправляется |
| `SCAN_ERROR` listener | `preload/index.ts:47-50`, `useScan.ts:27-32` | Событие никогда не отправляется |
| `EnhancedDirectoryInfo` | `shared/types.ts:156-168` | Тип не используется |
| `ScanOptions.outputFile` | `shared/types.ts:33` | Поле не читается |
| `ScanOptions.errorLogFile` | `shared/types.ts:44` | Поле не читается |
| `ScanOptions.verbose` | `shared/types.ts:41` | Никогда не проверяется |
| `ScanProgressUpdate.currentPath` | `shared/types.ts:150` | Всегда `''` |
| `pluralize()` | `main/utils/format.ts:100` | Только в тестах |
| `formatPathForDisplay()` | `main/utils/format.ts:79` | Только в тестах |
| `SHOW_SAVE_DIALOG` handler | `ipc/handlers.ts:91-99` | Вызывается только из сломанного openInFinder |
| `ScanProgress` scanResult block | `ScanProgress.tsx:32-37` | scanResult всегда null при сканировании |
| `electron-updater` | `package.json:61` | Нет import в коде |
| `ErrorAlert` компонент | (не создан) | Упомянут в AGENTS.md |
| `useIpc` hook | (не создан) | Упомянут в AGENTS.md |
| `scan.worker.ts` | (не создан) | Упомянут в AGENTS.md |
| `large-structure/` fixture | (не создан) | Упомянут в AGENTS.md |

---

## 7. Матрица покрытия тестами

| Модуль | Lines | Branches | Статус |
|--------|-------|----------|--------|
| `classifier.ts` | 97.67% | 90.9% | ✅ Хорошее |
| `scanner.ts` | 89.71% | 79.16% | ⚠️ Error paths не покрыты |
| `exporter.ts` | 98.42% | **45.45%** | ⚠️ Branches провалены |
| `format.ts` | 97.08% | 95% | ✅ Хорошее |
| `fs.ts` | 83.91% | 72.72% | ⚠️ Catch блоки не покрыты |
| `progress.ts` | 93.84% | **37.5%** | ⚠️ Branches провалены |
| `handlers.ts` | **0%** | **0%** | ❌ Нет тестов |
| `index.ts` (main) | **0%** | **0%** | ❌ Нет тестов |
| **Общее** | **68.28%** | | ❌ Не достигает порога 80% |

---

## 8. План действий (рекомендации по приоритету)

### P0 — Немедленно (функциональные баги)
1. **Исправить `DirectoryDetail.openInFinder`** — заменить `showSaveDialog` на `shell.openPath`
2. **Применить `topCount` в сканере** — добавить `results.slice(0, topCount)` после сортировки
3. **Добавить защиту от symlink-циклов** — canonicalize paths + visited set в `collectAllDirectories`
4. **Устранить мёртвые IPC-события** — убрать `onScanComplete`/`onScanError` или реализовать отправку

### P1 — В ближайшем спринте
5. Удалить мёртвые поля `outputFile`, `errorLogFile`, `verbose` из ScanOptions или реализовать
6. Удалить `electron-updater` из dependencies или реализовать auto-update
7. Создать shared utils для форматирования (`src/shared/utils/format.ts`)
8. Добавить pre-commit хуки (husky)
9. Добавить тесты для IPC handlers (mock electron)
10. Добавить localStorage persist для темы
11. Заменить `window.alert()` на toast/inline error
12. Обновить AGENTS.md и PLAN.md — отразить реальную архитектуру

### P2 — Технический долг
13. Обновить `electron-builder` → 26.x (устраняет tar уязвимости)
14. Обновить vitest → 4.x, vite → 6+
15. Добавить React Error Boundary
16. Исправить `ScanConfigForm` — selectors вместо `useScanStore()`
17. Исправить progress reporter для малых total values
18. Очистить `.gitignore` от Python артефактов
19. Исправить path concatenation в `fs.ts:135` → `path.join()`
20. Убрать избыточный `access()` в `isAccessibleDirectory`
21. Удалить `EnhancedDirectoryInfo` или реализовать
22. Исправить мёртвый conditional в `ScanProgress.tsx:32-37`

### P3 — Улучшения качества
23. Добавить type augmentation для `WebkitAppRegion`
24. Разрешить перекрытие расширений (exe, dmg, pkg) — создать `installers`
25. Добавить `.csv`, `.tsv` в классификатор
26. Запланировать обновление React 19, Electron 41+
27. Рассмотреть streaming-подход вместо накопления allFiles[]

---

## 9. Заключение

Проект демонстрирует хорошую структуру и понимание Electron-архитектуры. Код хорошо типизирован, TSDoc на месте, тесты организованы логично. Однако обнаружены **функциональные баги** (кнопка Show in Finder, неработающие IPC события, неприменяемый topCount, уязвимость к symlink-циклам), **значительный объём мёртвого кода** (6 полей/типов/функций + 1 зависимость), **архитектурные рассинхронизации** между документацией и реализацией, и **технический долг** по зависимостям (29 устаревших пакетов, 18 уязвимостей). Покрытие тестами 68.28% не достигает заявленного порога 80%.

Для showcase проекта критически важно устранить P0-проблемы, убрать мёртвый код и обновить документацию.
