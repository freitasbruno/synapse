import Link from 'next/link'
import { getAgentRuns } from '@/lib/data/agent'
import { AgentRunner } from '@/components/admin/AgentRunner'
import { EmbedExistingButton } from '@/components/admin/EmbedExistingButton'
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
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

export default async function AgentPage() {
  const runs = await getAgentRuns()

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 style={{ color: 'var(--text-primary)' }} className="text-2xl font-bold tracking-tight">
            Research Agent
          </h1>
          <p style={{ color: 'var(--text-secondary)' }} className="mt-1 text-sm">
            Autonomous AI use-case discovery and asset drafting
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/agent/review"
            style={{ borderColor: 'var(--bg-border)', color: 'var(--text-secondary)' }}
            className="rounded-lg border px-3 py-1.5 text-sm transition-colors hover:[color:var(--text-primary)]"
          >
            Review Queue
          </Link>
        </div>
      </div>

      {/* Embed existing assets for deduplication */}
      <EmbedExistingButton />

      {/* Launch + live progress */}
      <AgentRunner />

      {/* Run history */}
      {runs.length > 0 && (
        <div>
          <h2 style={{ color: 'var(--text-primary)' }} className="mb-3 text-base font-semibold">
            Run History
          </h2>
          <div className="overflow-hidden rounded-xl border" style={{ borderColor: 'var(--bg-border)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderColor: 'var(--bg-border)' }} className="border-b">
                  {['Domain', 'Focus', 'Started', 'Status', 'Found', 'Drafted', 'Approved'].map((h) => (
                    <th
                      key={h}
                      style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
                      className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {runs.map((run, i) => (
                  <tr
                    key={run.id}
                    style={{
                      backgroundColor: 'var(--bg)',
                      borderTop: i > 0 ? '1px solid var(--bg-border)' : undefined,
                    }}
                    className="transition-colors hover:[background-color:var(--bg-surface)]"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/agent/${run.id}`}
                        style={{ color: 'var(--text-primary)' }}
                        className="font-medium hover:underline"
                      >
                        {run.domain}
                      </Link>
                    </td>
                    <td className="max-w-[180px] px-4 py-3">
                      <span style={{ color: 'var(--text-secondary)' }} className="line-clamp-1 text-xs">
                        {run.focus_notes ?? '—'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span style={{ color: 'var(--text-secondary)' }} className="text-xs">{fmt(run.started_at)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[run.status]}`}>
                        {run.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span style={{ color: 'var(--text-secondary)' }} className="text-xs tabular-nums">{run.assets_found}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span style={{ color: 'var(--text-secondary)' }} className="text-xs tabular-nums">{run.assets_drafted}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span style={{ color: 'var(--text-secondary)' }} className="text-xs tabular-nums">{run.assets_approved}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
