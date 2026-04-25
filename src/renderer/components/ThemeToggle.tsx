import { useScanStore } from '@renderer/store/scanStore'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle(): JSX.Element {
  const theme = useScanStore((s) => s.theme)
  const setTheme = useScanStore((s) => s.setTheme)

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  )
}
