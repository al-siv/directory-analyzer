import { useScanStore } from '@renderer/store/scanStore'
import { useMemo, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

const COLORS: Record<string, string> = {
  images: '#8b5cf6',
  videos: '#ef4444',
  audio: '#f59e0b',
  documents: '#3b82f6',
  office: '#10b981',
  archives: '#6366f1',
  code: '#14b8a6',
  system: '#6b7280',
  other: '#9ca3af'
}

export function CategoryChart(): JSX.Element {
  const scanResult = useScanStore((s) => s.scanResult)
  const [view, setView] = useState<'pie' | 'bar'>('pie')

  const data = useMemo(() => {
    if (!scanResult?.statistics) return []
    return Object.entries(scanResult.statistics.categoryBreakdown)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: COLORS[name] ?? '#9ca3af'
      }))
      .sort((a, b) => b.value - a.value)
  }, [scanResult])

  const total = scanResult?.statistics?.totalSizeBytes ?? 1

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h3 className="mb-2 text-sm font-semibold">Content Breakdown</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">No data</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Content Breakdown</h3>
        <div className="flex gap-1">
          <button
            onClick={() => setView('pie')}
            className={`rounded px-2 py-0.5 text-xs ${view === 'pie' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-slate-500'}`}
          >
            Pie
          </button>
          <button
            onClick={() => setView('bar')}
            className={`rounded px-2 py-0.5 text-xs ${view === 'bar' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-slate-500'}`}
          >
            Bar
          </button>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {view === 'pie' ? (
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={(entry) => `${entry.name} ${((entry.value / total) * 100).toFixed(1)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [
                  `${(value / 1024 / 1024).toFixed(1)} MB`,
                  'Size'
                ]}
              />
            </PieChart>
          ) : (
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: number) => [`${(value / 1024 / 1024).toFixed(1)} MB`, 'Size']} />
              <Bar dataKey="value">
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}
