'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import type { AgentRunRow, AgentCandidateRow } from '@/lib/types/database'

// ─── types ────────────────────────────────────────────────────────────────────

type Phase = 'idle' | 'running' | 'done' | 'error'

interface RunSummary {
  found: number
  passed_evaluation: number
  passed_dedup: number
  drafted: number
}

interface RecentCandidate {
  id: string
  title: string
  status: AgentCandidateRow['status']
  evaluation_score: number | null
  source_url: string | null
}

interface StatusResponse {
  run: AgentRunRow
  summary: RunSummary
  recentCandidates: RecentCandidate[]
}

// ─── helpers ──────────────────────────────────────────────────────────────────

const STEPS: AgentRunRow['status'][] = ['searching', 'evaluating', 'deduplicating', 'drafting', 'completed']

const STEP_LABELS: Record<string, string> = {
  searching:     '🔍 Searching',
  evaluating:    '⚖️ Evaluating',
  deduplicating: '🔄 Deduplicating',
  drafting:      '✍️ Drafting',
  completed:     '✅ Done',
}

const STATUS_COLORS: Record<AgentRunRow['status'], string> = {
  pending:       'bg-zinc-500/20 text-zinc-400',
  searching:     'bg-blue-500/20 text-blue-400',
  evaluating:    'bg-amber-500/20 text-amber-400',
  deduplicating: 'bg-violet-500/20 text-violet-400',
  drafting:      'bg-indigo-500/20 text-indigo-400',
  completed:     'bg-emerald-500/20 text-emerald-400',
  failed:        'bg-red-500/20 text-red-400',
}

const CANDIDATE_STATUS_LABELS: Record<AgentCandidateRow['status'], string> = {
  found:        'Found',
  evaluated:    'Evaluated',
  deduplicated: 'Dedup\'d',
  drafted:      'Drafted',
  skipped:      'Skipped',
}

function ScoreBar({ score }: { score: number | null }) {
  if (score === null) return <span style={{ color: 'var(--text-secondary)' }} className="text-xs">—</span>
  const pct = Math.round(score * 100)
  const color = score >= 0.7 ? '#10b981' : score >= 0.5 ? '#f59e0b' : '#ef4444'
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-zinc-700">
        <div style={{ width: `${pct}%`, backgroundColor: color }} className="h-full rounded-full" />
      </div>
      <span className="text-xs tabular-nums" style={{ color }}>{pct}%</span>
    </div>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

export function AgentRunner() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [domain, setDomain] = useState('')
  const [focusNotes, setFocusNotes] = useState('')
  const [maxAssets, setMaxAssets] = useState<5 | 10 | 15>(10)
  const [runId, setRunId] = useState<string | null>(null)
  const [runData, setRunData] = useState<AgentRunRow | null>(null)
  const [summary, setSummary] = useState<RunSummary>({ found: 0, passed_evaluation: 0, passed_dedup: 0, drafted: 0 })
  const [recentCandidates, setRecentCandidates] = useState<RecentCandidate[]>([])
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const poll = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/agent/status/${id}`)
      if (!res.ok) return
      const data = (await res.json()) as StatusResponse
      setRunData(data.run)
      setSummary(data.summary)
      setRecentCandidates(data.recentCandidates)
    } catch {
      // ignore polling errors
    }
  }, [])

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  async function startRun() {
    if (!domain.trim()) return
    setPhase('running')
    setErrorMsg(null)

    // 1. Create run record
    let id: string
    try {
      const res = await fetch('/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domain.trim(), focus_notes: focusNotes.trim() || null, max_assets: maxAssets }),
      })
      if (!res.ok) throw new Error('Failed to start run')
      const data = (await res.json()) as { runId: string }
      id = data.runId
      setRunId(id)
    } catch (err) {
      setPhase('error')
      setErrorMsg(err instanceof Error ? err.message : 'Failed to start run')
      return
    }

    // 2. Start polling every 3s
    pollingRef.current = setInterval(() => { void poll(id) }, 3000)

    // 3. Run steps sequentially
    const steps = ['search', 'evaluate', 'deduplicate', 'draft'] as const
    for (const step of steps) {
      try {
        const res = await fetch(`/api/agent/${step}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ runId: id }),
        })
        await poll(id) // immediate refresh after each step

        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as { error?: string }
          throw new Error(err.error ?? `Step ${step} failed`)
        }
      } catch (err) {
        stopPolling()
        await poll(id) // get final state
        setPhase('error')
        setErrorMsg(err instanceof Error ? err.message : `Step ${step} failed`)
        return
      }
    }

    // 4. Done
    stopPolling()
    await poll(id)
    setPhase('done')
  }

  function reset() {
    stopPolling()
    setPhase('idle')
    setRunId(null)
    setRunData(null)
    setSummary({ found: 0, passed_evaluation: 0, passed_dedup: 0, drafted: 0 })
    setRecentCandidates([])
    setErrorMsg(null)
    setDomain('')
    setFocusNotes('')
    setMaxAssets(10)
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const currentStatus = runData?.status ?? 'pending'
  const currentStepIdx = STEPS.indexOf(currentStatus as typeof STEPS[number])

  return (
    <div className="space-y-6">

      {/* ── Launch form ── */}
      {phase === 'idle' && (
        <div
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--bg-border)' }}
          className="rounded-xl border p-6"
        >
          <h2 style={{ color: 'var(--text-primary)' }} className="mb-4 text-base font-semibold">
            Launch New Research Run
          </h2>
          <div className="space-y-4">
            <div>
              <label style={{ color: 'var(--text-secondary)' }} className="mb-1.5 block text-sm font-medium">
                Domain <span style={{ color: 'var(--text-primary)' }}>*</span>
              </label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="e.g. Healthcare, Legal, Software Engineering, Finance"
                style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--bg-border)', color: 'var(--text-primary)' }}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:[border-color:var(--accent)] placeholder:[color:var(--text-secondary)]"
              />
            </div>
            <div>
              <label style={{ color: 'var(--text-secondary)' }} className="mb-1.5 block text-sm font-medium">
                Focus notes <span className="font-normal">(optional)</span>
              </label>
              <textarea
                value={focusNotes}
                onChange={(e) => setFocusNotes(e.target.value)}
                placeholder="e.g. focus on clinical documentation and patient communication"
                rows={2}
                style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--bg-border)', color: 'var(--text-primary)' }}
                className="w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:[border-color:var(--accent)] placeholder:[color:var(--text-secondary)]"
              />
            </div>
            <div>
              <label style={{ color: 'var(--text-secondary)' }} className="mb-2 block text-sm font-medium">
                Max assets to draft
              </label>
              <div className="flex gap-2">
                {([5, 10, 15] as const).map((n) => (
                  <button
                    key={n}
                    onClick={() => setMaxAssets(n)}
                    style={maxAssets === n
                      ? { backgroundColor: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' }
                      : { backgroundColor: 'var(--bg)', borderColor: 'var(--bg-border)', color: 'var(--text-secondary)' }}
                    className="rounded-lg border px-4 py-1.5 text-sm font-medium transition-colors"
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => { void startRun() }}
              disabled={!domain.trim()}
              style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
              className="rounded-lg px-5 py-2 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              🔍 Start Research Run
            </button>
          </div>
        </div>
      )}

      {/* ── Active run progress ── */}
      {(phase === 'running' || phase === 'done' || phase === 'error') && runData && (
        <div
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--bg-border)' }}
          className="rounded-xl border p-6 space-y-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 style={{ color: 'var(--text-primary)' }} className="text-base font-semibold">
                {runData.domain}
              </h2>
              {runData.focus_notes && (
                <p style={{ color: 'var(--text-secondary)' }} className="mt-0.5 text-xs">{runData.focus_notes}</p>
              )}
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[currentStatus as AgentRunRow['status']] ?? ''}`}>
              {currentStatus}
            </span>
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {STEPS.map((step, idx) => {
              const done = currentStepIdx > idx
              const active = currentStepIdx === idx && phase === 'running'
              return (
                <div key={step} className="flex items-center gap-1">
                  <div
                    className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-all ${
                      done    ? 'bg-emerald-500/20 text-emerald-400' :
                      active  ? 'bg-blue-500/20 text-blue-400 animate-pulse' :
                                'bg-zinc-800/60 text-zinc-500'
                    }`}
                  >
                    {done ? '✓ ' : ''}{STEP_LABELS[step] ?? step}
                  </div>
                  {idx < STEPS.length - 1 && (
                    <span style={{ color: 'var(--text-secondary)' }} className="text-xs">→</span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Counters */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Candidates found', value: summary.found },
              { label: 'Passed evaluation', value: `${summary.passed_evaluation} / ${summary.found}` },
              { label: 'Passed dedup', value: `${summary.passed_dedup} / ${summary.passed_evaluation}` },
              { label: 'Drafted', value: `${summary.drafted} / ${summary.passed_dedup}` },
            ].map(({ label, value }) => (
              <div key={label} style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--bg-border)' }} className="rounded-lg border p-3">
                <p style={{ color: 'var(--text-secondary)' }} className="text-xs">{label}</p>
                <p style={{ color: 'var(--text-primary)' }} className="mt-0.5 text-lg font-bold tabular-nums">{value}</p>
              </div>
            ))}
          </div>

          {/* Progress detail */}
          {runData.current_step_detail && (
            <p style={{ color: 'var(--text-secondary)' }} className="text-xs italic">
              {runData.current_step_detail}
            </p>
          )}

          {/* Error */}
          {phase === 'error' && errorMsg && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3">
              <p className="text-sm text-red-400">{errorMsg}</p>
            </div>
          )}

          {/* Recent candidates preview */}
          {recentCandidates.length > 0 && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p style={{ color: 'var(--text-secondary)' }} className="text-xs font-medium uppercase tracking-wide">
                  Recent candidates
                </p>
                {runId && (
                  <Link href={`/admin/agent/${runId}`} style={{ color: 'var(--accent)' }} className="text-xs hover:underline">
                    View all →
                  </Link>
                )}
              </div>
              <div className="overflow-hidden rounded-lg border" style={{ borderColor: 'var(--bg-border)' }}>
                {recentCandidates.map((c, i) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 px-3 py-2"
                    style={{
                      backgroundColor: 'var(--bg)',
                      borderTop: i > 0 ? '1px solid var(--bg-border)' : undefined,
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{c.title}</p>
                      {c.source_url && (
                        <a href={c.source_url} target="_blank" rel="noopener noreferrer"
                          style={{ color: 'var(--text-secondary)' }}
                          className="truncate text-[10px] hover:underline"
                        >
                          {c.source_url.slice(0, 60)}{c.source_url.length > 60 ? '...' : ''}
                        </a>
                      )}
                    </div>
                    <ScoreBar score={c.evaluation_score} />
                    <span style={{ color: 'var(--text-secondary)' }} className="shrink-0 text-[10px]">
                      {CANDIDATE_STATUS_LABELS[c.status]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completion actions */}
          {(phase === 'done' || phase === 'error') && (
            <div className="flex flex-wrap gap-3">
              {phase === 'done' && runId && (
                <Link
                  href="/admin/agent/review"
                  style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
                  className="rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90"
                >
                  Review Drafted Assets →
                </Link>
              )}
              {runId && (
                <Link
                  href={`/admin/agent/${runId}`}
                  style={{ borderColor: 'var(--bg-border)', color: 'var(--text-secondary)' }}
                  className="rounded-lg border px-4 py-2 text-sm hover:[color:var(--text-primary)]"
                >
                  Inspect Run
                </Link>
              )}
              <button
                onClick={reset}
                style={{ borderColor: 'var(--bg-border)', color: 'var(--text-secondary)' }}
                className="rounded-lg border px-4 py-2 text-sm hover:[color:var(--text-primary)]"
              >
                Start New Run
              </button>
            </div>
          )}

          {/* Running spinner */}
          {phase === 'running' && (
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
              <span style={{ color: 'var(--text-secondary)' }} className="text-xs">Running...</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
