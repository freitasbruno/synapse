'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

interface DonutSlice {
  name: string
  value: number
  color: string
}

export function DonutChart({ data }: { data: DonutSlice[] }) {
  if (data.length === 0 || data.every((d) => d.value === 0)) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p style={{ color: 'var(--text-secondary)' }} className="text-sm">No data yet</p>
      </div>
    )
  }

  return (
    <div>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              dataKey="value"
              nameKey="name"
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--bg-border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '12px',
              }}
              formatter={(value, name) => [value, name]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {/* Custom legend */}
      <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-2">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center gap-1.5 text-xs">
            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
            <span style={{ color: 'var(--text-secondary)' }}>{entry.name}</span>
            <span style={{ color: 'var(--text-primary)' }} className="font-semibold">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
