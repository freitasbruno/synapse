import Link from 'next/link'
import { getAIUsageStats } from '@/lib/data/admin'
import { UsageLineChart } from '@/components/admin/UsageLineChart'

function StatCard({
  label,
  value,
  subtitle,
}: {
  label: string
  value: string | number
  subtitle?: string
}) {
  return (
    <div
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--bg-border)' }}
      className="rounded-xl border p-5"
    >
      <p style={{ color: 'var(--text-secondary)' }} className="text-xs font-medium uppercase tracking-wide">
        {label}
      </p>
      <p style={{ color: 'var(--accent)' }} className="mt-2 text-3xl font-bold tabular-nums">
        {value}
      </p>
      {subtitle && (
        <p style={{ color: 'var(--text-secondary)' }} className="mt-1 text-xs">
          {subtitle}
        </p>
      )}
    </div>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--bg-border)' }}
      className="rounded-xl border p-5"
    >
      <h2 style={{ color: 'var(--text-primary)' }} className="mb-4 text-sm font-semibold">
        {title}
      </h2>
      {children}
    </div>
  )
}

function fmtCost(usd: number) {
  return `$${usd.toFixed(4)}`
}

function fmtTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

export default async function AIUsagePage() {
  const stats = await getAIUsageStats()

  const totalCalls = stats.totalRefinements + stats.totalTagSuggestions
  const totalTokens = stats.totalTokensInput + stats.totalTokensOutput

  return (
    <div className="space-y-6">
      <div>
        <h1 style={{ color: 'var(--text-primary)' }} className="text-2xl font-bold tracking-tight">
          AI Usage
        </h1>
        <p style={{ color: 'var(--text-secondary)' }} className="mt-1 text-sm">
          Operational cost and token usage monitoring
        </p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total AI Calls"
          value={totalCalls}
          subtitle={`${stats.totalRefinements} refine · ${stats.totalTagSuggestions} tag`}
        />
        <StatCard
          label="Total Tokens"
          value={fmtTokens(totalTokens)}
          subtitle={`${fmtTokens(stats.totalTokensInput)} in · ${fmtTokens(stats.totalTokensOutput)} out`}
        />
        <StatCard
          label="Est. Cost This Month"
          value={fmtCost(stats.estimatedCostThisMonthUSD)}
          subtitle={`${fmtCost(stats.estimatedCostUSD)} all time`}
        />
        <StatCard
          label="Avg Tokens / Call"
          value={totalCalls > 0 ? fmtTokens(stats.avgTokensPerCall) : '—'}
          subtitle="input + output"
        />
      </div>

      {/* ── Usage trend ── */}
      <SectionCard title="Daily Usage — Last 30 Days">
        <UsageLineChart data={stats.dailyUsage} />
      </SectionCard>

      {/* ── Top users table ── */}
      {stats.topUsersByUsage.length > 0 && (
        <SectionCard title="Top Users by AI Usage">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderColor: 'var(--bg-border)' }} className="border-b">
                  {['Member', 'Refinements', 'Tag Suggestions', 'Total Tokens', 'Est. Cost'].map(
                    (h) => (
                      <th
                        key={h}
                        style={{ color: 'var(--text-secondary)' }}
                        className="pb-2 text-left text-xs font-medium"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {stats.topUsersByUsage.map((u) => {
                  const pct = totalTokens > 0 ? u.tokens / totalTokens : 0
                  const highUsage = pct > 0.2
                  return (
                    <tr
                      key={u.userId}
                      style={{ borderColor: 'var(--bg-border)' }}
                      className={`border-b last:border-0 ${highUsage ? 'bg-amber-500/5' : ''}`}
                    >
                      <td className="py-2.5 pr-4">
                        <Link
                          href={`/profile`}
                          style={{ color: highUsage ? '#fbbf24' : 'var(--text-primary)' }}
                          className="font-medium hover:underline"
                        >
                          {u.displayName}
                        </Link>
                        {highUsage && (
                          <span className="ml-1.5 text-[10px] text-amber-400">
                            ⚠ {Math.round(pct * 100)}% of total
                          </span>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }} className="py-2.5 pr-4 tabular-nums">
                        {u.refinements}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }} className="py-2.5 pr-4 tabular-nums">
                        {u.tagSuggestions}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }} className="py-2.5 pr-4 tabular-nums">
                        {fmtTokens(u.tokens)}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }} className="py-2.5 tabular-nums">
                        {fmtCost(u.estimatedCost)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {/* ── Pricing note ── */}
      <div
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--bg-border)', color: 'var(--text-secondary)' }}
        className="rounded-xl border px-4 py-3 text-xs leading-relaxed"
      >
        Costs are estimated based on Gemini pricing: $3.00/M input tokens, $15.00/M output tokens.
        Actual billing may vary.
      </div>
    </div>
  )
}
