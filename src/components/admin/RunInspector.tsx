'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { AgentCandidateRow } from '@/lib/types/database'
import type { AgentDraftAsset } from '@/lib/data/agent'

// ─── helpers ──────────────────────────────────────────────────────────────────

const TYPE_STYLES = {
  prompt:   'bg-indigo-500/20 text-indigo-400',
  agent:    'bg-emerald-500/20 text-emerald-400',
  app:      'bg-amber-500/20 text-amber-400',
  workflow: 'bg-violet-500/20 text-violet-400',
}

function ScoreBar({ score }: { score: number | null }) {
  if (score === null) return <span style={{ color: 'var(--text-secondary)' }} className="text-xs">—</span>
  const pct = Math.round(score * 100)
  const color = score >= 0.7 ? '#10b981' : score >= 0.5 ? '#f59e0b' : '#ef4444'
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-zinc-700">
        <div style={{ width: `${pct}%`, backgroundColor: color }} className="h-full rounded-full" />
      </div>
      <span className="text-xs tabular-nums" style={{ color }}>{pct}%</span>
    </div>
  )
}

function rowBg(c: AgentCandidateRow): string {
  if (c.status === 'drafted') return 'bg-emerald-500/5'
  if (c.passed_evaluation && c.status !== 'evaluated') return 'bg-amber-500/5'
  if (c.passed_evaluation === false) return 'bg-red-500/5'
  if (c.status === 'skipped') return 'bg-zinc-800/30'
  return ''
}

// ─── CandidatesTab ────────────────────────────────────────────────────────────

function CandidatesTab({ candidates }: { candidates: AgentCandidateRow[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (candidates.length === 0) {
    return (
      <p style={{ color: 'var(--text-secondary)' }} className="py-8 text-center text-sm">
        No candidates yet.
      </p>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border" style={{ borderColor: 'var(--bg-border)' }}>
      {/* Header */}
      <div
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--bg-border)' }}
        className="grid grid-cols-[1fr_80px_180px_80px_80px_80px] gap-4 border-b px-4 py-2.5"
      >
        {['Title', 'Score', 'Eval Reasoning', 'Dedup', 'Similarity', 'Status'].map((h) => (
          <span key={h} style={{ color: 'var(--text-secondary)' }} className="text-xs font-medium uppercase tracking-wide">
            {h}
          </span>
        ))}
      </div>

      {/* Rows */}
      {candidates.map((c, i) => (
        <div
          key={c.id}
          style={{ borderTop: i > 0 ? '1px solid var(--bg-border)' : undefined }}
          className={rowBg(c)}
        >
          {/* Main row */}
          <div
            className="grid cursor-pointer grid-cols-[1fr_80px_180px_80px_80px_80px] items-center gap-4 px-4 py-3 transition-colors hover:[background-color:var(--bg-surface)]"
            onClick={() => toggle(c.id)}
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{c.title}</p>
              {c.source_url && (
                <a
                  href={c.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{ color: 'var(--accent)' }}
                  className="text-[10px] hover:underline"
                >
                  {c.source_url.slice(0, 50)}{c.source_url.length > 50 ? '…' : ''}
                </a>
              )}
            </div>
            <ScoreBar score={c.evaluation_score} />
            <p className="line-clamp-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
              {c.evaluation_reasoning ?? '—'}
            </p>
            <span className="text-xs" style={{ color: c.passed_deduplication === true ? '#10b981' : c.passed_deduplication === false ? '#ef4444' : 'var(--text-secondary)' }}>
              {c.passed_deduplication === true ? '✓ Pass' : c.passed_deduplication === false ? '✗ Dup' : '—'}
            </span>
            <span className="text-xs tabular-nums" style={{ color: 'var(--text-secondary)' }}>
              {c.similarity_score !== null ? `${Math.round((c.similarity_score ?? 0) * 100)}%` : '—'}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                c.status === 'drafted'      ? 'bg-emerald-500/20 text-emerald-400' :
                c.status === 'deduplicated' ? 'bg-violet-500/20 text-violet-400' :
                c.status === 'evaluated'    ? 'bg-amber-500/20 text-amber-400' :
                c.status === 'skipped'      ? 'bg-zinc-500/20 text-zinc-400' :
                                              'bg-blue-500/20 text-blue-400'
              }`}
            >
              {c.status}
            </span>
          </div>

          {/* Expanded detail */}
          {expanded.has(c.id) && (
            <div
              style={{ backgroundColor: 'var(--bg)', borderTop: '1px solid var(--bg-border)' }}
              className="px-4 py-3 space-y-2"
            >
              {c.summary && (
                <div>
                  <p style={{ color: 'var(--text-secondary)' }} className="mb-0.5 text-xs font-medium uppercase tracking-wide">Summary</p>
                  <p style={{ color: 'var(--text-primary)' }} className="text-sm">{c.summary}</p>
                </div>
              )}
              {c.evaluation_reasoning && (
                <div>
                  <p style={{ color: 'var(--text-secondary)' }} className="mb-0.5 text-xs font-medium uppercase tracking-wide">Full Evaluation</p>
                  <p style={{ color: 'var(--text-primary)' }} className="text-sm">{c.evaluation_reasoning}</p>
                </div>
              )}
              {c.raw_content && (
                <div>
                  <p style={{ color: 'var(--text-secondary)' }} className="mb-0.5 text-xs font-medium uppercase tracking-wide">Raw Content</p>
                  <pre style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-surface)', borderColor: 'var(--bg-border)' }}
                    className="overflow-auto rounded border p-2 text-xs whitespace-pre-wrap">
                    {c.raw_content}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── DraftedTab ───────────────────────────────────────────────────────────────

function DraftedTab({ assets, runId }: { assets: AgentDraftAsset[]; runId: string }) {
  if (assets.length === 0) {
    return (
      <p style={{ color: 'var(--text-secondary)' }} className="py-8 text-center text-sm">
        No drafted assets yet.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Link
          href="/admin/agent/review"
          style={{ color: 'var(--accent)' }}
          className="text-sm hover:underline"
        >
          Open Review Queue →
        </Link>
      </div>
      <div className="overflow-hidden rounded-xl border" style={{ borderColor: 'var(--bg-border)' }}>
        {assets.map((asset, i) => (
          <div
            key={asset.id}
            className="flex items-center gap-4 px-4 py-3"
            style={{
              backgroundColor: 'var(--bg)',
              borderTop: i > 0 ? '1px solid var(--bg-border)' : undefined,
            }}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_STYLES[asset.type as keyof typeof TYPE_STYLES] ?? ''}`}>
                  {asset.type}
                </span>
                <p className="truncate text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{asset.title}</p>
              </div>
              {asset.description && (
                <p className="mt-0.5 line-clamp-1 text-xs" style={{ color: 'var(--text-secondary)' }}>{asset.description}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-3">
              {asset.agent_quality_score !== null && (
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: asset.agent_quality_score >= 0.7 ? 'rgb(16 185 129 / 0.15)' : asset.agent_quality_score >= 0.5 ? 'rgb(245 158 11 / 0.15)' : 'rgb(239 68 68 / 0.15)',
                    color: asset.agent_quality_score >= 0.7 ? '#10b981' : asset.agent_quality_score >= 0.5 ? '#f59e0b' : '#ef4444',
                  }}
                >
                  {Math.round(asset.agent_quality_score * 100)}%
                </span>
              )}
              <Link
                href={`/asset/${asset.id}`}
                style={{ color: 'var(--accent)' }}
                className="text-xs hover:underline"
              >
                View →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── RunInspector ─────────────────────────────────────────────────────────────

interface Props {
  candidates: AgentCandidateRow[]
  draftAssets: AgentDraftAsset[]
  runId: string
}

export function RunInspector({ candidates, draftAssets, runId }: Props) {
  const [tab, setTab] = useState<'candidates' | 'drafted'>('candidates')

  return (
    <div>
      {/* Tabs */}
      <div style={{ borderColor: 'var(--bg-border)' }} className="mb-5 flex gap-1 border-b">
        {(['candidates', 'drafted'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={
              tab === t
                ? { color: 'var(--accent)', borderColor: 'var(--accent)' }
                : { color: 'var(--text-secondary)', borderColor: 'transparent' }
            }
            className="border-b-2 px-4 pb-2.5 pt-1 text-sm font-medium capitalize transition-colors hover:[color:var(--text-primary)]"
          >
            {t === 'candidates' ? `Candidates (${candidates.length})` : `Drafted Assets (${draftAssets.length})`}
          </button>
        ))}
      </div>

      {tab === 'candidates' ? (
        <CandidatesTab candidates={candidates} />
      ) : (
        <DraftedTab assets={draftAssets} runId={runId} />
      )}
    </div>
  )
}
