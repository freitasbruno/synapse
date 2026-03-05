'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface DayUsage {
  date: string
  calls: number
  tokens: number
}

function fmtDate(d: string) {
  const [, m, day] = d.split('-')
  return `${m}/${day}`
}

export function UsageLineChart({ data }: { data: DayUsage[] }) {
  const hasData = data.some((d) => d.calls > 0 || d.tokens > 0)

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
        <LineChart data={data} margin={{ top: 4, right: 32, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickFormatter={fmtDate}
            interval={4}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="calls"
            allowDecimals={false}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="tokens"
            orientation="right"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--bg-border)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '12px',
            }}
            labelFormatter={(l) => (typeof l === 'string' ? fmtDate(l) : String(l))}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }}
          />
          <Line
            yAxisId="calls"
            type="monotone"
            dataKey="calls"
            stroke="#818cf8"
            strokeWidth={2}
            dot={false}
            name="Calls"
          />
          <Line
            yAxisId="tokens"
            type="monotone"
            dataKey="tokens"
            stroke="#34d399"
            strokeWidth={2}
            dot={false}
            name="Tokens"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
