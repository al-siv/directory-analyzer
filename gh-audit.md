# Directory Analyzer — GitHub Repository Audit

**Дата**: 2026-04-25
**Репозиторий**: `al-siv/directory-analyzer`
**Ветка**: `main`
**Размер на GH**: ~600 KB (код, без archive/)
**Статус GitHub**: 0 issues, 0 PR, 0 stars, 0 forks

<analysis>

## Критические проблемы

| # | Проблема | Влияние |
|---|----------|---------|
| 1 | **Нет `.github/`** — нет CI/CD, нет issue/PR шаблонов | Ничто не_enforces quality gates из AGENTS.md |
| 2 | **`eslint-plugin-security-node`** заявлен в README, CHANGELOG, AGENTS.md, CONTRIBUTING.md — **не установлен** | Обманчивая документация, неполная безопасность |
| 3 | **Нет `@testing-library/react`** — 0 тестов компонентов | AGENTS.md обязывает; покрытие UI = 0 |
| 4 | **CONTRIBUTING.md пишет `npm`** вместо `pnpm` | Внешний контрибутор не сможет собрать проект |
| 5 | **`analysis/` (аудит-отчёты LLM) закоммичен** в репозиторий | Мусор в истории, не gitignored |

---

## Высокий приоритет

| # | Проблема |
|---|----------|
| 6 | **Все версии в документации устарели**: README/AGENTS.md/.cursorrules пишут Electron 33, TS 5.4, React 18 — реально Electron 41, TS 6, React 19 |
| 7 | **PLAN.md: все задачи `[ ]`** — не отражает реальный статус (фазы 1-4 по факту завершены) |
| 8 | **UI-SPEC.md расходится с реализацией в 14+ пунктах**: нет Header, FilterPanel, ErrorAlert, AccessErrorsModal; нет клавиатурных шорткатов; нет адаптивности; нет dominant category column; chips input = text input |
| 9 | **E2E: 1 тест** (приложение открывается). Нет: scan→results→export, cancel, theme |
| 10 | **Нет тестов IPC handlers** (`validateScanOptions`, round-trip) |
| 11 | **18 stale `.js` артефактов** в `src/` (не в git, но засоряют working dir) |
| 12 | **`run-python-scan.py`** ссылается на `archive/python/` — которого нет на GH (gitignored), скрипт сломан |

---

## Средний приоритет

| # | Проблема |
|---|----------|
| 13 | `postcss` — неиспользуемая зависимость (Tailwind v4 использует Vite-плагин) |
| 14 | `jsdom` — установлена, но vitest использует `environment: 'node'` |
| 15 | `DEFAULT_TOP_COUNT`, `formatPathForDisplay`, `pluralize`, `ScanOptionsInput`, `IpcChannel` — экспортированы, но нигде не используются (dead code) |
| 16 | **Отсутствует TSDoc на 8 React-компонентах** и `useScanStore` — нарушение контракта AGENTS.md |
| 17 | Нет тестов: `schemas.spec.ts`, `progress.spec.ts`, `handlers.spec.ts` |
| 18 | Нет `tests/fixtures/large-structure/` (заявлен в AGENTS.md) |
| 19 | `App.tsx` использует `export default` — нарушение конвенции |
| 20 | `setAppUserModelId('com.electron')` вместо `'com.sivolobov.directory-analyzer'` (package.json appId) |
| 21 | Скрипты в package.json используют `npm run` вместо `pnpm run` |
| 22 | Порог покрытия branches = 70%, а AGENTS.md обещает 80% |

---

## Низкий приоритет

| # | Проблема |
|---|----------|
| 23 | Нет клавиатурных шорткатов (Cmd+O, Cmd+Enter, Esc — UI-SPEC.md) |
| 24 | Нет адаптивной вёрстки (breakpoints 1100/900/600 — UI-SPEC.md) |
| 25 | DirectoryDetail: нет file list, category mini-bar, copy path |
| 26 | ResultsTable: нет dominant category column, virtualization, double-click |
| 27 | Нет URL-валидации в `setWindowOpenHandler` (main/index.ts) |
| 28 | Даты в CHANGELOG.md противоречивы (v1.0.0 dated 2025-06-17, после v1.2.0 dated 2024-12-18) |

---

## Роадмап исправлений

### Этап 1 — Честность документации (1-2 дня)

1. Обновить версии в README, AGENTS.md, .cursorrules → актуальные (Electron 41, TS 6, React 19)
2. CONTRIBUTING.md: заменить все `npm` → `pnpm`
3. Удалить упоминания `eslint-plugin-security-node` из всех доков (или установить его)
4. Добавить `analysis/` в `.gitignore`, удалить файлы из git (`git rm -r --cached analysis/`)
5. Исправить даты в CHANGELOG.md
6. Обновить PLAN.md: отметить завершённые фазы

### Этап 2 — CI/CD (1 день)

7. Создать `.github/workflows/ci.yml`: lint → typecheck → test → build
8. Создать `.github/ISSUE_TEMPLATE/` (bug report, feature request)
9. Создать `.github/PULL_REQUEST_TEMPLATE.md`
10. Добавить branch protection rules (main: require CI pass, require review)

### Этап 3 — Зависимости и dead code (0.5 дня)

11. Удалить `postcss`, `jsdom` из devDependencies
12. Либо установить `eslint-plugin-security-node`, либо убрать из доков
13. Удалить или использовать: `DEFAULT_TOP_COUNT`, `formatPathForDisplay`, `pluralize`, `ScanOptionsInput`, `IpcChannel`
14. Очистить `.js` артефакты: добавить скрипт `pnpm prebuild` или `clean`
15. Исправить `setAppUserModelId` → корректный appId
16. Заменить `npm run` → `pnpm run` в скриптах package.json

### Этап 4 — Тестовое покрытие (2-3 дня)

17. Установить `@testing-library/react` + `jsdom`
18. Написать тесты IPC handlers (validateScanOptions, round-trip)
19. Написать тесты schemas (ScanOptionsSchema edge cases)
20. Написать тесты ProgressReporter
21. Написать React component tests (ScanConfigForm, ResultsTable, SummaryCards)
22. Написать Zustand store test
23. Добавить E2E: scan workflow, cancel, export, theme toggle
24. Поднять branch threshold 70% → 80%

### Этап 5 — UI-SPEC sync (3-5 дней, по желанию)

25. Реализовать клавиатурные шорткаты
26. Реализовать адаптивную вёрстку
27. Добавить DirectoryDetail: file list, category mini-bar
28. Добавить AccessErrorsModal
29. Обновить UI-SPEC.md чтобы отражал реальность (или дописать фичи)

### Этап 6 — Полировка (1-2 дня)

30. TSDoc на все 8 renderer-компонентов + useScanStore
31. Заменить `export default` в App.tsx на named export
32. Удалить или исправить `run-python-scan.py`
33. Финальный аудит ESLint security rules

---

## Итого

**34 проблемы**: 5 критических, 7 высокого приоритета, 10 средних, 6 низких.

Приоритетные направления:
- **Честность документации** — репозиторий заявляет то, чего нет (версии, плагины, покрытие)
- **CI/CD** — нет автоматического контроля качества, quality gates не enforced
- **Тестовое покрытие** — E2E и component tests практически отсутствуют

</analysis>
