# Directory Analyzer Electron — UI Specification

## Design Philosophy

**Концепция:** "Аналитическая панель управления хранилищем" (Storage Analytics Dashboard).

**Принципы:**
1. **Минимум кликов до результата.** Пользователь открывает приложение → выбирает папку → жмёт Scan → через секунды видит интерактивный дашборд.
2. **CLI внутри GUI.** Все возможности Python-версии (`--extensions`, `--min-size`, `--no-hidden`, `--top-count`, `--verbose`, `--format`) должны быть доступны как элементы управления.
3. **Данные первичны.** Максимум пространства экрана отдаётся результатам. Контролы компактные, но очевидные.
4. **Визуальная иерархия.** Размер = важность. Большие директории визуально доминируют.

---

## App States (Конечный автомат состояний)

Приложение находится в одном из 4 состояний:

```
┌──────────┐     Start Scan      ┌─────────────┐
│  IDLE    │ ──────────────────> │  SCANNING   │
│          │                     │             │
│ Настройка│ <────────────────── │  Прогресс   │
│ скан-я   │    Cancel / Error   │             │
└──────────┘                     └──────┬──────┘
     ▲                                  │
     │                                  │ Scan Complete
     │                                  ▼
     │                         ┌─────────────┐
     │                         │   RESULTS   │
     └──────────────────────── │             │
        New Scan / Clear       │  Результаты │
                               └─────────────┘
```

| State | Описание | Что видит пользователь |
|-------|----------|------------------------|
| **IDLE** | Начальное состояние, конфигурация | Форма выбора папки + фильтры, пустая область результатов или приветственный экран |
| **SCANNING** | Идёт сканирование | Блокированные контролы, анимированный прогресс, статистика в реальном времени |
| **RESULTS** | Сканирование завершено | Полный дашборд: summary, таблица, графики, детали |
| **ERROR** | Ошибка сканирования | Форма + красное уведомление с текстом ошибки |

---

## Общий Layout (Результаты)

Когда данные есть, окно делится на 3 зоны:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  HEADER (60px)                                                               │
│  [📁 /Users/alsiv/Documents]  [Scan] [Cancel]  [⚙ Settings]  [🌙 Dark Mode] │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  SUMMARY CARDS (высота: auto, padding: 16px)                            │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │ │
│  │  │ 📂 Dirs     │ │ 📄 Files    │ │ 💾 Total    │ │ ⏱ Duration  │      │ │
│  │  │ 1,234       │ │ 15,678      │ │ 45.2 GB     │ │ 2.34s       │      │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘      │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  ┌──────────────────────────────┐  ┌───────────────────────────────────────┐ │
│  │  RESULTS TABLE               │  │  RIGHT SIDEBAR (400px)                │ │
│  │  (flex: 1, min-width: 500px) │  │                                       │ │
│  │                              │  │  ┌─────────────────────────────────┐  │ │
│  │  Rank │ Directory │ Size  │% │  │  │  CATEGORY CHART (Pie/Bar)       │  │ │
│  │  ─────────────────────────── │  │  │  [Pie: Images 27%]               │  │ │
│  │  1    │ Photos    │ 8.2GB │18│  │  │  [Bar: Top 5 categories]         │  │ │
│  │  2    │ Videos    │ 4.8GB │10│  │  └─────────────────────────────────┘  │ │
│  │  3    │ Archives  │ 2.1GB │ 5│  │                                       │ │
│  │  ...                         │  │  ┌─────────────────────────────────┐  │ │
│  │                              │  │  │  DIRECTORY DETAIL (при клике)   │  │ │
│  │  [Sort ▼] [Filter...]        │  │  │  Path: /Users/.../Photos        │  │ │
│  │                              │  │  │  Size: 8.2 GB (18.14%)          │  │ │
│  │                              │  │  │  Files: 1,234                   │  │ │
│  │                              │  │  │  Dominant: 📸 Images            │  │ │
│  │                              │  │  │  [Table: files in this dir]     │  │ │
│  │                              │  │  │  [Category breakdown mini-bar]  │  │ │
│  └──────────────────────────────┘  └───────────────────────────────────────┘ │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  EXPORT BAR (50px)                                                       │ │
│  │  [📤 Export TXT] [📤 Export CSV] [📤 Export JSON]                        │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Размеры:**
- Окно по умолчанию: **1280x800** (можно ресайзить, min: 900x600)
- Sidebar справа: **фиксирован 400px**, на малых экранах (<1100px) — сворачивается под таблицу или в drawer
- Header: **60px**
- Summary cards: ~**120px** высотой

---

## 1. Header (Всегда виден)

```
┌──────────────────────────────────────────────────────────────────────┐
│ 🗂 Directory Analyzer    v2.0.0                                       │
│                                                                       │
│  ┌────────────────────────────────────────┐  ┌─────┐  ┌────────┐     │
│  │ 📁 /Users/alsiv/Documents       [🔍]   │  │Scan │  │Cancel  │     │
│  └────────────────────────────────────────┘  └─────┘  └────────┘     │
│                                                                       │
│  [ℹ️] [⚙️] [🌙/☀️]                                                    │
└──────────────────────────────────────────────────────────────────────┘
```

**Элементы:**
- **Логотип + версия** (слева)
- **Path Input + Browse Button**: 
  - Текстовое поле с полным путём (read-only, но можно вставить)
  - Кнопка "📁 Browse" — открывает `dialog.showOpenDialog({ properties: ['openDirectory'] })`
  - Кнопка "📋" — копировать путь
- **Scan Button**: Зелёная, основное действие. Disabled если путь пустой или идёт сканирование.
- **Cancel Button**: Красная, видна только в состоянии `SCANNING`. При нажатии — `worker.terminate()`.
- **Filters Toggle (⚙️ или 🔽)**: Кнопка раскрытия панели фильтров под хедером.

---

## 2. Filters Panel (Раскрывающаяся панель)

Появляется под Header при клике на "Filters" или "⚙️".

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  FILTERS                                                                    ╳│
│  ┌────────────────┐ ┌────────────────┐ ┌─────────────┐ ┌───────────────────┐  │
│  │ Include hidden │ │ Min size: [50] │ │ Top: [50] │ │ Extensions: [.jpg  │  │
│  │ ☑ yes / ☐ no   │ │ MB             │ │ results   │ │  .png .mp4]       │  │
│  └────────────────┘ └────────────────┘ └─────────────┘ └───────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Элементы управления:**
| Контрол | Тип | Значение по умолчанию | Соответствие CLI |
|---------|-----|----------------------|------------------|
| **Target Path** | Text + Dialog | — | `target` positional arg |
| **Include Hidden** | Toggle/Switch | `true` | inverted `--no-hidden` |
| **Minimum Size** | Number input + unit (MB) | `0` | `--min-size` (ввод в MB) |
| **Top Count** | Number input | `50` | `--top-count` |
| **Extensions** | Chips input (tag input) | empty | `--extensions` |
| **Verbose** | Toggle | `false` | `--verbose` (показывать текущую директорию в прогрессе) |
| **Output File** | Text (только для Export, не для Scan) | `results.txt` | `--output-file` |

**UX замечания:**
- Extensions: пользователь вводит `.jpg`, жмёт Enter — появляется chip. Можно удалить крестиком.
- Minimum Size: слайдер 0-1000 MB + числовой инпут для точности.
- Панель можно свернуть крестиком. Настройки запоминаются в Zustand (в рамках сессии, пока без localStorage).

---

## 3. Scanning State (Прогресс)

Когда нажат Scan — вся нижняя область заменяется на прогресс.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ... Header ...                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                         Scanning...                                          │
│                                                                              │
│              ████████████████████░░░░░░░  72%                                │
│                                                                              │
│         ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                   │
│         │ Directories │  │ Files       │  │ Current     │                   │
│         │ 1,234 / 1700│  │ 15,678      │  │ /Users/...  │                   │
│         └─────────────┘  └─────────────┘  └─────────────┘                   │
│                                                                              │
│         Elapsed: 2.3s  |  Errors: 3 dirs (permission denied)                 │
│                                                                              │
│                          [ Cancel Scan ]                                     │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Элементы:**
- **Progress Bar**: индетерминатный если `total` неизвестен (для sequential), процентный если `total` известен (для parallel с предварительным подсчётом).
- **Live Stats Cards**: Dirs scanned, Files found, Current path.
- **Current Path** (только если `verbose=true`): показывает последнюю сканируемую директорию, monospace, truncating с середины.
- **Error Counter**: мелким серым текстом "3 access errors (logged)".
- **Cancel Button**: красная кнопка по центру.

---

## 4. Results State (Дашборд)

После завершения сканирования.

### 4.1 Summary Cards

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   📂        │  │   📄        │  │   💾        │  │   ⏱         │  │   ⚠️        │
│  1,234      │  │  15,678     │  │  45.2 GB    │  │  2.34s      │  │   3         │
│ directories │  │ files       │  │ total size  │  │ duration    │  │ errors      │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
```

- Hover на карточку: лёгкая тень, плавная анимация.
- Карточка Errors: если 0 — зелёная галочка. Если >0 — жёлтая/оранжевая, кликабельная (показать список ошибок в модалке).

### 4.2 Results Table

**Колонки:**
| Колонка | Ширина | Сортируемая | Примечание |
|---------|--------|-------------|------------|
| Rank | 60px | Нет | Авто-номер |
| Directory Path | fill (min 300px) | Да (по алфавиту) | Truncating, `title` атрибут с полным путём. Клик — выбор. |
| Size | 100px | Да (по умолчанию desc) | Human-readable |
| Percentage | 90px | Да | `18.14%` или `<0.01%` |
| Files | 80px | Да | `1,234` |
| Dominant Category | 120px | Да | Badge с цветом: 🟣 Images, 🔴 Videos, и т.д. |

**Строка:**
```
  1.  /Users/alsiv/Documents/Photos        8.2 GB    18.14%   1,234   [🟣 Images]
  2.  /Users/alsiv/Documents/Videos        4.8 GB    10.62%     234   [🔴 Videos]
  3.  /Users/alsiv/Documents/Archives      2.1 GB     4.64%      45   [🟡 Archives]
```

**Поведение:**
- **Сортировка**: клик по заголовку. Стрелка ▲▼ показывает направление.
- **Выбор строки**: click — строка выделяется (`bg-blue-50`), справа открывается Directory Detail.
- **Double-click**: открывает системный файловый менеджер на этой директории (через `shell.openPath`).
- **Пагинация / Virtualization**: если >1000 результатов — виртуализация (react-window) или пагинация по 100.
- **Search / Filter в таблице**: поле над таблицей фильтрует по пути (client-side).

### 4.3 Category Chart (Правая панель, верх)

```
┌──────────────────────────────┐
│  Content Breakdown           │
│                              │
│      [  PIE CHART  ]         │
│      Images   27.4%          │
│      Videos   19.7%          │
│      Docs     13.7%          │
│      ...                     │
│                              │
│  [ Toggle: Pie | Bar ]       │
└──────────────────────────────┘
```

- **Pie Chart** (Recharts `<PieChart>`): по `categoryBreakdown` (size). Топ-7 категорий, остальное — "Other".
- **Bar Chart** (Recharts `<BarChart>`): горизонтальные бары, топ категорий по размеру.
- Переключатель Pie/Bar.
- Hover на сегмент: tooltip с размером и процентом.
- Цвета категорий фиксированные:
  - Images: `#8b5cf6` (violet)
  - Videos: `#ef4444` (red)
  - Audio: `#f59e0b` (amber)
  - Documents: `#3b82f6` (blue)
  - Office: `#10b981` (emerald)
  - Archives: `#6366f1` (indigo)
  - Code: `#14b8a6` (teal)
  - System: `#6b7280` (gray)
  - Other: `#9ca3af` (light gray)

### 4.4 Directory Detail (Правая панель, низ)

Показывается когда выбрана строка в таблице.

```
┌──────────────────────────────────────┐
│  📂 Photos                           │
│  /Users/alsiv/Documents/Photos       │
│                                      │
│  💾 8.2 GB  (18.14% of total)       │
│  📄 1,234 files                      │
│  🕒 Scanned: 14:32:05                │
│                                      │
│  Dominant: [🟣 Images]               │
│                                      │
│  Category breakdown:                 │
│  Images    ████████████████████ 99%  │
│  Videos    █                      1% │
│                                      │
│  [Show in Finder]  [Copy Path]       │
└──────────────────────────────────────┘
```

**Файловый лист (expandable):**
- "Show files (1234)" — раскрывает мини-таблицу файлов в этой директории:
  - Name | Size | Type
  - Скролл если много.
  - Это даёт ту же детализацию, что и в Python при `--verbose`, но по требованию.

---

## 5. Export Bar

Фиксированная панель внизу окна (или кнопки в header/toolbar).

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Export Results:  [📄 Save as TXT]  [📊 Save as CSV]  [📋 Save as JSON]     │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Поведение:**
- Клик → `dialog.showSaveDialog` с соответствующим `defaultPath` и `filters`.
- После сохранения → toast уведомление "Saved to /path/to/file.csv".
- Формат файла 1:1 с Python (`text`, `csv`, `json`).

---

## 6. Error State

Если сканирование завершилось ошибкой или были access errors:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ... Header ...                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │  ⚠️ Scan Error                                                      │    │
│   │                                                                     │    │
│   │  Permission denied accessing /System/Volumes/Data/private           │    │
│   │                                                                     │    │
│   │  [Retry]  [Dismiss]                                                 │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│   (предыдущие результаты, если есть, остаются на месте)                     │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

- **Inline Alert**: красный/жёлтый баннер под header.
- **Access Errors Modal**: если были permission denied, кнопка "View Access Errors" открывает модалку со списком недоступных директорий (как `no-access.txt` в Python).

---

## 7. Responsive Behavior

| Ширина окна | Layout |
|-------------|--------|
| > 1100px | Таблица + Sidebar справа (400px) |
| 900-1100px | Sidebar сжимается до 320px |
| < 900px | Sidebar скрывается за кнопку "Details →". Таблица на всю ширину. При клике на строку — открывается Drawer/Modal с деталями. |
| < 600px | Summary cards в 2 колонки. Таблица горизонтальный скролл или упрощённый вид (только Path + Size). |

---

## 8. Theme

**Dark Mode** (по умолчанию, так как аналитика/диск — тёмная тема приятнее глазам):
- Фон: `#0f172a` (slate-900)
- Карточки: `#1e293b` (slate-800)
- Текст: `#f1f5f9` (slate-100)
- Вторичный текст: `#94a3b8` (slate-400)
- Акценты: Tailwind colors
- Границы: `#334155` (slate-700)

**Light Mode**:
- Фон: `#ffffff`
- Карточки: `#f8fafc` (slate-50)
- Текст: `#0f172a` (slate-900)
- Границы: `#e2e8f0` (slate-200)

**Переключатель**: в Header, иконка 🌙/☀️. Состояние хранится в Zustand + localStorage.

---

## 9. Keyboard Shortcuts

| Shortcut | Действие |
|----------|----------|
| `Cmd/Ctrl + O` | Browse for folder |
| `Cmd/Ctrl + Enter` | Start Scan (если в фокусе форма) |
| `Esc` | Cancel Scan (если scanning), или закрыть Drawer/Modal |
| `Cmd/Ctrl + Shift + T` | Toggle Theme |

---

## 10. Component Inventory

| Компонент | Файл | Описание |
|-----------|------|----------|
| `App` | `App.tsx` | Корень, управление layout и theme |
| `Header` | `Header.tsx` | Логотип, путь, Scan/Cancel, настройки |
| `FilterPanel` | `FilterPanel.tsx` | Раскрывающаяся панель фильтров |
| `ScanProgress` | `ScanProgress.tsx` | Прогресс-бар, live stats |
| `SummaryCards` | `SummaryCards.tsx` | Карточки статистики |
| `ResultsTable` | `ResultsTable.tsx` | Основная таблица результатов |
| `CategoryChart` | `CategoryChart.tsx` | Pie/Bar график |
| `DirectoryDetail` | `DirectoryDetail.tsx` | Панель деталей директории |
| `ExportBar` | `ExportBar.tsx` | Кнопки экспорта |
| `ErrorAlert` | `ErrorAlert.tsx` | Баннер ошибок |
| `AccessErrorsModal` | `AccessErrorsModal.tsx` | Список ошибок доступа |
| `PathBreadcrumb` | `PathBreadcrumb.tsx` | Отображение пути с truncating |
| `CategoryBadge` | `CategoryBadge.tsx` | Цветной бейдж категории |
| `ThemeToggle` | `ThemeToggle.tsx` | Переключатель темы |

---

## 11. State Management (Zustand Store)

```typescript
interface ScanStore {
  // Config
  targetPath: string;
  includeHidden: boolean;
  minSizeMb: number;
  topCount: number;
  extensions: string[];
  verbose: boolean;
  
  // Runtime
  appState: 'idle' | 'scanning' | 'results' | 'error';
  progress: ScanProgressUpdate | null;
  scanResult: ScanResult | null;
  error: string | null;
  accessErrors: string[];
  selectedDirectory: DirectoryInfo | null;
  theme: 'dark' | 'light';
  
  // Actions
  setTargetPath: (path: string) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  startScan: () => void;
  cancelScan: () => void;
  setProgress: (p: ScanProgressUpdate) => void;
  setResults: (r: ScanResult) => void;
  setError: (e: string) => void;
  selectDirectory: (d: DirectoryInfo | null) => void;
  toggleTheme: () => void;
  reset: () => void;
}
```

---

## 12. Миграция CLI → GUI (чеклист фич)

| Python CLI Flag | GUI Элемент | Статус |
|-----------------|-------------|--------|
| `target` (positional) | Path Input + Browse Dialog | ✅ Специфицировано |
| `--output-file` | Export Save Dialog (per format) | ✅ Специфицировано |
| `--top-count` | Number input в Filters | ✅ Специфицировано |
| `--no-hidden` | Toggle "Include hidden" (inverted) | ✅ Специфицировано |
| `--min-size` | Number input MB в Filters | ✅ Специфицировано |
| `--format` | Export buttons (TXT/CSV/JSON) | ✅ Специфицировано |
| `--verbose` | Toggle + показ текущего пути в прогрессе | ✅ Специфицировано |
| `--no-access-log` | Access Errors Modal + auto-log | ✅ Специфицировано |
| `--extensions` | Chips input в Filters | ✅ Специфицировано |
| `--version` | Показ в Header | ✅ Специфицировано |
| Terminal summary | Summary Cards | ✅ Специфицировано |
| Directory listing | Results Table | ✅ Специфицировано |
| Content breakdown | Category Chart | ✅ Специфицировано |
| Percentage analysis | Колонка % в таблице | ✅ Специфицировано |
| Error logging | Access Errors Modal | ✅ Специфицировано |

---

## 13. Implementation Status (as of 2026-04-25)

| Feature | Status | Notes |
|---------|--------|-------|
| Keyboard shortcuts (Cmd+O, Cmd+Enter, Esc, Cmd+Shift+T) | ✅ Implemented | Global handlers in `App.tsx` |
| AccessErrorsModal | ✅ Implemented | Opens from SummaryCards error count or auto |
| Dominant category column in ResultsTable | ✅ Implemented | Color-coded badge, sortable |
| Double-click row → open in file manager | ✅ Implemented | `ResultsTable.tsx` |
| DirectoryDetail file list (expandable) | ✅ Implemented | Toggle with file count |
| DirectoryDetail category mini-bar | ✅ Implemented | Per-directory breakdown bars |
| DirectoryDetail copy path | ✅ Implemented | Uses `navigator.clipboard` |
| Responsive layout >1280px sidebar | ✅ Implemented | `xl:w-[400px]` |
| Responsive layout 1024-1279px sidebar | ✅ Implemented | `lg:w-[320px]` |
| Mobile detail drawer (<1024px) | ✅ Implemented | Fixed overlay with close button |
| Summary cards 2-col on mobile | ✅ Implemented | `grid-cols-2 lg:grid-cols-5` |
| Chips input for extensions | ❌ Not implemented | Plain text input (UI-SPEC §2) |
| Verbose toggle | ❌ Not implemented | Not exposed in UI |
| Path breadcrumb / copy in header | ❌ Not implemented | Plain text input only |
| CategoryBadge standalone component | ❌ Not implemented | Inline styles in table/detail |
| Header component extracted from App | ❌ Not implemented | Inline in `App.tsx` |
| FilterPanel extracted component | ❌ Not implemented | Inline in `ScanConfigForm.tsx` |
| Virtualization for >1000 rows | ❌ Not implemented | No virtualization yet |
| Pagination | ❌ Not implemented | Not needed for typical use |
| Toast notifications for export | ❌ Not implemented | Inline error text only |

---

*Документ является дополнением к `AGENTS.md` и `PLAN.md`. При реализации UI компонентов этот spec является источником истины для вёрстки, поведения и user flow.*
