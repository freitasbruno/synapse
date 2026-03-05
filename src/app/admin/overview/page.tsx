import { getAdminOverviewStats } from '@/lib/data/admin'
import { DonutChart } from '@/components/admin/DonutChart'
import { DailyBarChart } from '@/components/admin/DailyBarChart'

const TYPE_COLORS: Record<string, string> = {
  prompt: '#818cf8',
  tool: '#34d399',
  app: '#fbbf24',
  workflow: '#a78bfa',
}

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

export default async function AdminOverviewPage() {
  const stats = await getAdminOverviewStats()

  const donutData = stats.assetsByType.map(({ type, count }) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: count,
    color: TYPE_COLORS[type] ?? '#94a3b8',
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 style={{ color: 'var(--text-primary)' }} className="text-2xl font-bold tracking-tight">
          Overview
        </h1>
        <p style={{ color: 'var(--text-secondary)' }} className="mt-1 text-sm">
          Platform growth and content metrics
        </p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Members"
          value={stats.totalMembers}
          subtitle={`↑ ${stats.newMembersThisWeek} new this week`}
        />
        <StatCard
          label="Published Assets"
          value={stats.publishedAssets}
          subtitle={`↑ ${stats.newAssetsThisWeek} new this week`}
        />
        <StatCard
          label="Validated Assets"
          value={stats.validatedAssets}
          subtitle={`${stats.validationRatio}% of published`}
        />
        <StatCard
          label="Total Stars"
          value={stats.totalStars}
          subtitle={`${stats.draftAssets} draft${stats.draftAssets !== 1 ? 's' : ''} pending`}
        />
      </div>

      {/* ── Charts ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Asset Distribution by Type">
          <DonutChart data={donutData} />
        </SectionCard>

        <SectionCard title="New Assets — Last 30 Days">
          <DailyBarChart data={stats.dailyAssets} label="New Assets" />
        </SectionCard>
      </div>
    </div>
  )
}
