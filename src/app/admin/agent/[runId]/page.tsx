import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getAgentRun, getAgentCandidates, getAgentDraftAssets } from '@/lib/data/agent'
import { RunInspector } from '@/components/admin/RunInspector'
import type { AgentRunRow } from '@/lib/types/database'

const STATUS_COLORS: Record<AgentRunRow['status'], string> = {
  pending:       'bg-zinc-500/20 text-zinc-400',
  searching:     'bg-blue-500/20 text-blue-400',
  evaluating:    'bg-amber-500/20 text-amber-400',
  deduplicating: 'bg-violet-500/20 text-violet-400',
  drafting:      'bg-indigo-500/20 text-indigo-400',
  completed:     'bg-emerald-500/20 text-emerald-400',
  failed:        'bg-red-500/20 text-red-400',
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default async function RunPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params

  const run = await getAgentRun(runId)
  if (!run) redirect('/admin/agent')

  const [candidates, draftAssets] = await Promise.all([
    getAgentCandidates(runId),
    getAgentDraftAssets(runId),
  ])

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/admin/agent"
        style={{ color: 'var(--text-secondary)' }}
        className="inline-flex items-center gap-1.5 text-sm transition-colors hover:[color:var(--text-primary)]"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        All Runs
      </Link>

      {/* Header */}
      <div
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--bg-border)' }}
        className="rounded-xl border p-5"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 style={{ color: 'var(--text-primary)' }} className="text-xl font-bold">{run.domain}</h1>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[run.status]}`}>
                {run.status}
              </span>
            </div>
            {run.focus_notes && (
              <p style={{ color: 'var(--text-secondary)' }} className="mt-1 text-sm">{run.focus_notes}</p>
            )}
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              <span style={{ color: 'var(--text-secondary)' }} className="text-xs">
                Started: {fmt(run.started_at)}
              </span>
              {run.completed_at && (
                <span style={{ color: 'var(--text-secondary)' }} className="text-xs">
                  Completed: {fmt(run.completed_at)}
                </span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-4 text-right">
            {[
              { label: 'Found', value: run.assets_found },
              { label: 'Evaluated', value: run.assets_evaluated },
              { label: 'Passed eval', value: run.assets_passed_evaluation },
              { label: 'Passed dedup', value: run.assets_passed_deduplication },
              { label: 'Drafted', value: run.assets_drafted },
            ].map(({ label, value }) => (
              <div key={label}>
                <p style={{ color: 'var(--text-secondary)' }} className="text-xs">{label}</p>
                <p style={{ color: 'var(--text-primary)' }} className="text-lg font-bold tabular-nums">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {run.error_message && (
          <div className="mt-3 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3">
            <p className="text-sm text-red-400">{run.error_message}</p>
          </div>
        )}
      </div>

      {/* Tabbed inspector */}
      <RunInspector candidates={candidates} draftAssets={draftAssets} runId={runId} initialDraftedCount={run.assets_drafted} />
    </div>
  )
}
