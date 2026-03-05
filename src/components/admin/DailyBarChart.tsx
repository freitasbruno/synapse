'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface DayCount {
  date: string // YYYY-MM-DD
  count: number
}

function fmtDate(d: string) {
  const [, m, day] = d.split('-')
  return `${m}/${day}`
}

export function DailyBarChart({ data, label }: { data: DayCount[]; label: string }) {
  const hasData = data.some((d) => d.count > 0)

  if (!hasData) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p style={{ color: 'var(--text-secondary)' }} className="text-sm">No data yet</p>
      </div>
    )
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickFormatter={fmtDate}
            interval={4}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--bg-border)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '12px',
            }}
            formatter={(value) => [value, label]}
            labelFormatter={(l) => (typeof l === 'string' ? fmtDate(l) : String(l))}
          />
          <Bar dataKey="count" fill="#6366f1" radius={[3, 3, 0, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
