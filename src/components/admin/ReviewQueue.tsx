'use client'

import { useState, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { SequenceRenderer } from '@/components/asset/SequenceRenderer'
import type { AgentDraftAsset } from '@/lib/data/agent'
import type { AgentRunRow } from '@/lib/types/database'

// ─── helpers ──────────────────────────────────────────────────────────────────

const TYPE_STYLES = {
  prompt:   'bg-indigo-500/20 text-indigo-400',
  agent:    'bg-emerald-500/20 text-emerald-400',
  app:      'bg-amber-500/20 text-amber-400',
  workflow: 'bg-violet-500/20 text-violet-400',
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span style={{ color: 'var(--text-secondary)' }} className="text-xs">—</span>
  const pct = Math.round(score * 100)
  const style = score >= 0.7
    ? { backgroundColor: 'rgb(16 185 129 / 0.15)', color: '#10b981' }
    : score >= 0.5
    ? { backgroundColor: 'rgb(245 158 11 / 0.15)', color: '#f59e0b' }
    : { backgroundColor: 'rgb(239 68 68 / 0.15)', color: '#ef4444' }
  return (
    <span className="rounded-full px-2 py-0.5 text-xs font-medium tabular-nums" style={style}>
      {pct}%
    </span>
  )
}

function findDomain(asset: AgentDraftAsset, runs: AgentRunRow[]): string {
  return runs.find((r) => r.id === asset.agent_run_id)?.domain ?? '—'
}

function findRunDate(asset: AgentDraftAsset, runs: AgentRunRow[]): string {
  const run = runs.find((r) => r.id === asset.agent_run_id)
  if (!run) return '—'
  return new Date(run.started_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ─── PreviewModal ─────────────────────────────────────────────────────────────

function PreviewModal({ asset, runs, onClose }: { asset: AgentDraftAsset; runs: AgentRunRow[]; onClose: () => void }) {
  const domain = findDomain(asset, runs)

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 py-10"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="animate-modal-in relative w-full max-w-2xl rounded-2xl border"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--bg-border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div
          style={{ borderColor: 'var(--bg-border)' }}
          className="flex items-start justify-between gap-4 border-b px-6 py-4"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_STYLES[asset.type as keyof typeof TYPE_STYLES] ?? ''}`}>
                {asset.type}
              </span>
              <ScoreBadge score={asset.agent_quality_score} />
              <span style={{ color: 'var(--text-secondary)' }} className="text-xs">{domain}</span>
              {asset.manually_drafted && (
                <span
                  className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                  style={{ backgroundColor: 'rgb(99 102 241 / 0.15)', color: '#a5b4fc' }}
                >
                  Manually drafted
                </span>
              )}
            </div>
            <h2 style={{ color: 'var(--text-primary)' }} className="mt-1.5 text-base font-bold leading-snug">
              {asset.title}
            </h2>
            {asset.source_url && (
              <a
                href={asset.source_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--accent)' }}
                className="mt-0.5 inline-block text-xs hover:underline"
              >
                {asset.source_url.slice(0, 80)}{asset.source_url.length > 80 ? '…' : ''}
              </a>
            )}
          </div>
          <button
            onClick={onClose}
            style={{ color: 'var(--text-secondary)' }}
            className="shrink-0 rounded-lg p-1.5 transition-colors hover:[color:var(--text-primary)]"
            aria-label="Close preview"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal body */}
        <div className="px-6 py-5">
          <SequenceRenderer blocks={asset.description_sequence} />
        </div>
      </div>
    </div>,
    document.body,
  )
}

// ─── ReviewQueue ──────────────────────────────────────────────────────────────

interface Props {
  initialAssets: AgentDraftAsset[]
  runs: AgentRunRow[]
  domainOptions: string[]
}

export function ReviewQueue({ initialAssets, runs, domainOptions }: Props) {
  const [assets, setAssets] = useState<AgentDraftAsset[]>(initialAssets)
  const [domainFilter, setDomainFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'score' | 'newest'>('score')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [rejectConfirm, setRejectConfirm] = useState<string | null>(null)
  const [previewAsset, setPreviewAsset] = useState<AgentDraftAsset | null>(null)
  const [processing, setProcessing] = useState<Set<string>>(new Set())
  const [actionError, setActionError] = useState<string | null>(null)
  const [bulkAction, setBulkAction] = useState<'idle' | 'confirm-reject'>('idle')
  const [scoreThreshold, setScoreThreshold] = useState<number>(70)

  // ── filtering & sorting ────────────────────────────────────────────────────

  const displayed = useMemo(() => {
    let list = [...assets]
    if (domainFilter !== 'all') {
      list = list.filter((a) => findDomain(a, runs) === domainFilter)
    }
    if (sortBy === 'score') {
      list.sort((a, b) => (b.agent_quality_score ?? 0) - (a.agent_quality_score ?? 0))
    } else {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }
    return list
  }, [assets, domainFilter, sortBy, runs])

  // ── selection ──────────────────────────────────────────────────────────────

  const allSelected = displayed.length > 0 && displayed.every((a) => selected.has(a.id))

  function toggleAll() {
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev)
        displayed.forEach((a) => next.delete(a.id))
        return next
      })
    } else {
      setSelected((prev) => {
        const next = new Set(prev)
        displayed.forEach((a) => next.add(a.id))
        return next
      })
    }
  }

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // ── single approve/reject ──────────────────────────────────────────────────

  const doAction = useCallback(async (id: string, action: 'approve' | 'reject') => {
    setActionError(null)
    setProcessing((p) => new Set(p).add(id))
    try {
      const res = await fetch(`/api/agent/review/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string; detail?: string }
        throw new Error(body.detail ?? body.error ?? `Request failed (${res.status})`)
      }
      setAssets((prev) => prev.filter((a) => a.id !== id))
      setSelected((prev) => { const next = new Set(prev); next.delete(id); return next })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Action failed'
      console.error(`[ReviewQueue] ${action} error:`, msg)
      setActionError(msg)
    } finally {
      setProcessing((p) => { const next = new Set(p); next.delete(id); return next })
      setRejectConfirm(null)
    }
  }, [])

  // ── bulk actions ──────────────────────────────────────────────────────────

  async function doBulk(action: 'approve' | 'reject', ids: string[]) {
    if (ids.length === 0) return
    ids.forEach((id) => setProcessing((p) => new Set(p).add(id)))
    try {
      const res = await fetch('/api/agent/review/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action }),
      })
      if (!res.ok) throw new Error('Bulk action failed')
      setAssets((prev) => prev.filter((a) => !ids.includes(a.id)))
      setSelected(new Set())
    } catch {
      // TODO: surface error
    } finally {
      ids.forEach((id) => setProcessing((p) => { const next = new Set(p); next.delete(id); return next }))
      setBulkAction('idle')
    }
  }

  function approveAboveThreshold() {
    const threshold = scoreThreshold / 100
    const ids = displayed
      .filter((a) => (a.agent_quality_score ?? 0) >= threshold)
      .map((a) => a.id)
    void doBulk('approve', ids)
  }

  // ── empty state ────────────────────────────────────────────────────────────

  if (assets.length === 0) {
    return (
      <div
        style={{ borderColor: 'var(--bg-border)' }}
        className="rounded-xl border py-16 text-center"
      >
        <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
          No assets pending review.{' '}
          <Link href="/admin/agent" style={{ color: 'var(--accent)' }} className="hover:underline">
            Start a research run →
          </Link>
        </p>
      </div>
    )
  }

  const selectedIds = Array.from(selected)

  return (
    <>
      {/* Preview modal */}
      {previewAsset && (
        <PreviewModal asset={previewAsset} runs={runs} onClose={() => setPreviewAsset(null)} />
      )}

      {/* Action error */}
      {actionError && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
          <p className="text-sm text-red-400">{actionError}</p>
          <button onClick={() => setActionError(null)} className="text-red-400 hover:opacity-70" aria-label="Dismiss">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Filters */}
      <div
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--bg-border)' }}
        className="flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3"
      >
        <select
          value={domainFilter}
          onChange={(e) => setDomainFilter(e.target.value)}
          style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--bg-border)', color: 'var(--text-primary)' }}
          className="rounded-lg border px-3 py-1.5 text-sm outline-none"
        >
          <option value="all">All domains</option>
          {domainOptions.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'score' | 'newest')}
          style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--bg-border)', color: 'var(--text-primary)' }}
          className="rounded-lg border px-3 py-1.5 text-sm outline-none"
        >
          <option value="score">Quality Score ↓</option>
          <option value="newest">Newest first</option>
        </select>

        {/* Approve above threshold */}
        <div className="ml-auto flex items-center gap-2">
          <span style={{ color: 'var(--text-secondary)' }} className="text-xs">Approve above</span>
          <input
            type="number"
            min={0}
            max={100}
            value={scoreThreshold}
            onChange={(e) => setScoreThreshold(Number(e.target.value))}
            style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--bg-border)', color: 'var(--text-primary)' }}
            className="w-16 rounded-lg border px-2 py-1.5 text-center text-sm outline-none"
          />
          <span style={{ color: 'var(--text-secondary)' }} className="text-xs">%</span>
          <button
            onClick={approveAboveThreshold}
            style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
            className="rounded-lg px-3 py-1.5 text-xs font-medium hover:opacity-90"
          >
            Approve
          </button>
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.length > 0 && (
        <div
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--bg-border)' }}
          className="flex items-center gap-3 rounded-xl border px-4 py-3"
        >
          <span style={{ color: 'var(--text-secondary)' }} className="text-sm">
            {selectedIds.length} selected
          </span>
          <button
            onClick={() => { void doBulk('approve', selectedIds) }}
            style={{ backgroundColor: 'rgb(16 185 129 / 0.15)', color: '#10b981' }}
            className="rounded-lg px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-80"
          >
            ✓ Approve Selected
          </button>
          {bulkAction === 'confirm-reject' ? (
            <div className="flex items-center gap-2">
              <span style={{ color: '#ef4444' }} className="text-xs">Reject {selectedIds.length} assets?</span>
              <button
                onClick={() => { void doBulk('reject', selectedIds) }}
                className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400 hover:opacity-80"
              >
                Yes, reject
              </button>
              <button
                onClick={() => setBulkAction('idle')}
                style={{ color: 'var(--text-secondary)' }}
                className="text-xs hover:[color:var(--text-primary)]"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setBulkAction('confirm-reject')}
              className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition-opacity hover:opacity-80"
            >
              ✕ Reject Selected
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border" style={{ borderColor: 'var(--bg-border)' }}>
        {/* Table header */}
        <div
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--bg-border)' }}
          className="grid grid-cols-[32px_1fr_72px_100px_64px_80px_100px_152px] items-center gap-3 border-b px-4 py-2.5"
        >
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            className="rounded"
            aria-label="Select all"
          />
          {['Title', 'Type', 'Domain', 'Score', 'Source', 'Run Date', 'Actions'].map((h) => (
            <span key={h} style={{ color: 'var(--text-secondary)' }} className="text-xs font-medium uppercase tracking-wide">
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        {displayed.map((asset, i) => (
          <div
            key={asset.id}
            style={{
              backgroundColor: processing.has(asset.id) ? 'var(--bg-surface)' : 'var(--bg)',
              borderTop: i > 0 ? '1px solid var(--bg-border)' : undefined,
              opacity: processing.has(asset.id) ? 0.5 : 1,
            }}
            className="grid grid-cols-[32px_1fr_72px_100px_64px_80px_100px_152px] items-center gap-3 px-4 py-3 transition-colors hover:[background-color:var(--bg-surface)]"
          >
            <input
              type="checkbox"
              checked={selected.has(asset.id)}
              onChange={() => toggleRow(asset.id)}
              className="rounded"
            />

            {/* Title */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {asset.title}
                </p>
                {asset.manually_drafted && (
                  <span
                    className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                    style={{ backgroundColor: 'rgb(99 102 241 / 0.15)', color: '#a5b4fc' }}
                  >
                    Manual
                  </span>
                )}
              </div>
              {asset.description && (
                <p className="line-clamp-1 text-xs" style={{ color: 'var(--text-secondary)' }}>{asset.description}</p>
              )}
            </div>

            {/* Type */}
            <span className={`w-fit rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_STYLES[asset.type as keyof typeof TYPE_STYLES] ?? ''}`}>
              {asset.type}
            </span>

            {/* Domain */}
            <span className="truncate text-xs" style={{ color: 'var(--text-secondary)' }}>
              {findDomain(asset, runs)}
            </span>

            {/* Score */}
            <ScoreBadge score={asset.agent_quality_score} />

            {/* Source */}
            {asset.source_url ? (
              <a
                href={asset.source_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--accent)' }}
                className="inline-flex items-center gap-1 text-xs hover:underline"
                title={asset.source_url}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                Source
              </a>
            ) : (
              <span style={{ color: 'var(--text-secondary)' }} className="text-xs">—</span>
            )}

            {/* Run date */}
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {findRunDate(asset, runs)}
            </span>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {/* Preview */}
              <button
                onClick={() => setPreviewAsset(asset)}
                style={{ color: 'var(--text-secondary)' }}
                className="rounded px-1.5 py-1 text-xs transition-colors hover:[color:var(--text-primary)]"
                title="Preview"
              >
                👁
              </button>

              {/* Approve */}
              <button
                onClick={() => { void doAction(asset.id, 'approve') }}
                disabled={processing.has(asset.id)}
                className="rounded px-1.5 py-1 text-xs text-emerald-400 transition-opacity hover:opacity-70 disabled:opacity-40"
                title="Approve"
              >
                ✓
              </button>

              {/* Edit */}
              <Link
                href={`/asset/${asset.id}/edit`}
                style={{ color: 'var(--text-secondary)' }}
                className="rounded px-1.5 py-1 text-xs transition-colors hover:[color:var(--text-primary)]"
                title="Edit"
              >
                ✏️
              </Link>

              {/* Reject */}
              {rejectConfirm === asset.id ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { void doAction(asset.id, 'reject') }}
                    className="rounded bg-red-500/20 px-1.5 py-1 text-[10px] font-medium text-red-400"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setRejectConfirm(null)}
                    style={{ color: 'var(--text-secondary)' }}
                    className="text-[10px] hover:[color:var(--text-primary)]"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setRejectConfirm(asset.id)}
                  disabled={processing.has(asset.id)}
                  className="rounded px-1.5 py-1 text-xs text-red-400 transition-opacity hover:opacity-70 disabled:opacity-40"
                  title="Reject"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
