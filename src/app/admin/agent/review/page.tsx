import { getAllAgentDraftAssets } from '@/lib/data/agent'
import { getAgentRuns } from '@/lib/data/agent'
import { ReviewQueue } from '@/components/admin/ReviewQueue'
import Link from 'next/link'

export default async function ReviewPage() {
  const [assets, runs] = await Promise.all([
    getAllAgentDraftAssets(),
    getAgentRuns(),
  ])

  const domainOptions = Array.from(
    new Set(
      assets
        .map((a) => {
          const run = runs.find((r) => r.id === a.agent_run_id)
          return run?.domain ?? null
        })
        .filter(Boolean) as string[],
    ),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 style={{ color: 'var(--text-primary)' }} className="text-2xl font-bold tracking-tight">
            Review Queue
          </h1>
          <p style={{ color: 'var(--text-secondary)' }} className="mt-1 text-sm">
            Agent-drafted assets pending approval — {assets.length} waiting
          </p>
        </div>
        <Link
          href="/admin/agent"
          style={{ borderColor: 'var(--bg-border)', color: 'var(--text-secondary)' }}
          className="rounded-lg border px-3 py-1.5 text-sm transition-colors hover:[color:var(--text-primary)]"
        >
          ← Agent Dashboard
        </Link>
      </div>

      <ReviewQueue initialAssets={assets} runs={runs} domainOptions={domainOptions} />
    </div>
  )
}
