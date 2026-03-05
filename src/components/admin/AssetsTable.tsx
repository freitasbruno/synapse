'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { AdminAsset } from '@/lib/data/admin'

// ─── constants ────────────────────────────────────────────────────────────────

const TYPE_STYLES: Record<AdminAsset['type'], string> = {
  prompt: 'bg-indigo-500/20 text-indigo-400',
  tool: 'bg-emerald-500/20 text-emerald-400',
  app: 'bg-amber-500/20 text-amber-400',
  workflow: 'bg-violet-500/20 text-violet-400',
}

type Filter = 'all' | 'unvalidated' | 'draft' | 'private'

// ─── component ────────────────────────────────────────────────────────────────

export function AssetsTable({ initialAssets }: { initialAssets: AdminAsset[] }) {
  const [rows, setRows] = useState<AdminAsset[]>(initialAssets)
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())
  const [batchAction, setBatchAction] = useState<'idle' | 'confirm-delete'>('idle')

  // ── filtering ──────────────────────────────────────────────────────────────

  const displayed = useMemo(() => {
    return rows.filter((row) => {
      if (filter === 'unvalidated' && (row.is_manager_validated || row.status !== 'published'))
        return false
      if (filter === 'draft' && row.status !== 'draft') return false
      if (filter === 'private' && row.visibility !== 'private') return false
      if (search && !row.title.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [rows, filter, search])

  // ── selection ──────────────────────────────────────────────────────────────

  const allSelected = displayed.length > 0 && displayed.every((r) => selected.has(r.id))

  function toggleAll() {
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev)
        displayed.forEach((r) => next.delete(r.id))
        return next
      })
    } else {
      setSelected((prev) => {
        const next = new Set(prev)
        displayed.forEach((r) => next.add(r.id))
        return next
      })
    }
  }

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  // ── validate ───────────────────────────────────────────────────────────────

  async function handleValidate(id: string, current: boolean) {
    setProcessingIds((prev) => new Set(prev).add(id))
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_manager_validated: !current } : r)),
    )
    try {
      const res = await fetch(`/api/assets/${id}/validate`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed')
      const data = (await res.json()) as { is_manager_validated: boolean }
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_manager_validated: data.is_manager_validated } : r)),
      )
    } catch {
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, is_manager_validated: current } : r)))
    } finally {
      setProcessingIds((prev) => { const next = new Set(prev); next.delete(id); return next })
    }
  }

  // ── delete ─────────────────────────────────────────────────────────────────

  async function handleDelete(id: string) {
    setProcessingIds((prev) => new Set(prev).add(id))
    try {
      const res = await fetch(`/api/assets/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      setRows((prev) => prev.filter((r) => r.id !== id))
      setSelected((prev) => { const next = new Set(prev); next.delete(id); return next })
    } finally {
      setProcessingIds((prev) => { const next = new Set(prev); next.delete(id); return next })
      setConfirmingDeleteId(null)
    }
  }

  // ── batch ops ──────────────────────────────────────────────────────────────

  async function handleBatchValidate() {
    const ids = [...selected]
    await Promise.all(
      ids.map((id) => {
        const asset = rows.find((r) => r.id === id)
        return asset ? handleValidate(id, asset.is_manager_validated) : Promise.resolve()
      }),
    )
    setSelected(new Set())
  }

  async function handleBatchDelete() {
    const ids = [...selected]
    await Promise.all(ids.map((id) => handleDelete(id)))
    setSelected(new Set())
    setBatchAction('idle')
  }

  // ── render ─────────────────────────────────────────────────────────────────

  const selectedCount = [...selected].filter((id) => displayed.some((r) => r.id === id)).length

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Tabs */}
        <div
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--bg-border)' }}
          className="flex rounded-lg border p-1 text-sm"
        >
          {(['all', 'unvalidated', 'draft', 'private'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={
                filter === f
                  ? { backgroundColor: 'var(--accent)', color: '#fff' }
                  : { color: 'var(--text-secondary)' }
              }
              className="rounded-md px-3 py-1 capitalize transition-colors hover:[color:var(--text-primary)]"
            >
              {f}
            </button>
          ))}
        </div>

        {/* Search + count */}
        <div className="flex items-center gap-3">
          <span style={{ color: 'var(--text-secondary)' }} className="text-sm">
            Showing {displayed.length} asset{displayed.length !== 1 ? 's' : ''}
          </span>
          <input
            type="search"
            placeholder="Search by title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              backgroundColor: 'var(--bg)',
              borderColor: 'var(--bg-border)',
              color: 'var(--text-primary)',
            }}
            className="rounded-lg border px-3 py-1.5 text-sm outline-none focus:[border-color:var(--accent)] placeholder:[color:var(--text-secondary)] w-48"
          />
        </div>
      </div>

      {/* Table */}
      <div
        style={{ borderColor: 'var(--bg-border)' }}
        className="overflow-hidden rounded-xl border"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--bg-border)' }} className="border-b">
              <tr>
                <th className="w-8 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="cursor-pointer"
                    aria-label="Select all"
                  />
                </th>
                {['Title', 'Type', 'Status', 'Visibility', 'Validated', 'Creator', 'Created', 'Stars', 'Actions'].map(
                  (h) => (
                    <th
                      key={h}
                      style={{ color: 'var(--text-secondary)' }}
                      className="px-3 py-3 text-left text-xs font-medium"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {displayed.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center">
                    <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
                      No assets match the current filter
                    </p>
                  </td>
                </tr>
              )}
              {displayed.map((asset) => {
                const isProcessing = processingIds.has(asset.id)
                const isConfirmingDelete = confirmingDeleteId === asset.id
                return (
                  <tr
                    key={asset.id}
                    style={{ borderColor: 'var(--bg-border)' }}
                    className={`border-b last:border-0 transition-opacity ${isProcessing ? 'opacity-50' : ''}`}
                  >
                    {/* Checkbox */}
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(asset.id)}
                        onChange={() => toggleRow(asset.id)}
                        className="cursor-pointer"
                        aria-label={`Select ${asset.title}`}
                      />
                    </td>

                    {/* Title */}
                    <td className="max-w-[200px] px-3 py-3">
                      <Link
                        href={`/asset/${asset.id}`}
                        target="_blank"
                        style={{ color: 'var(--text-primary)' }}
                        className="truncate block font-medium hover:underline"
                      >
                        {asset.title}
                      </Link>
                    </td>

                    {/* Type */}
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${TYPE_STYLES[asset.type]}`}
                      >
                        {asset.type}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          asset.status === 'published'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-amber-500/15 text-amber-400'
                        }`}
                      >
                        {asset.status}
                      </span>
                    </td>

                    {/* Visibility */}
                    <td className="px-3 py-3">
                      {asset.visibility === 'private' ? (
                        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">
                          🔒 Private
                        </span>
                      ) : (
                        <span
                          className="rounded-full border px-2 py-0.5 text-xs font-medium"
                          style={{ borderColor: 'var(--bg-border)', color: 'var(--text-secondary)' }}
                        >
                          🌐 Public
                        </span>
                      )}
                    </td>

                    {/* Validated */}
                    <td className="px-3 py-3">
                      {asset.is_manager_validated ? (
                        <span className="text-[#FFD700]" title="Verified">✓</span>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)' }}>—</span>
                      )}
                    </td>

                    {/* Creator */}
                    <td className="px-3 py-3">
                      <span style={{ color: 'var(--text-secondary)' }}>{asset.creator_name}</span>
                    </td>

                    {/* Created */}
                    <td className="px-3 py-3">
                      <span style={{ color: 'var(--text-secondary)' }} className="tabular-nums">
                        {asset.created_at.split('T')[0]}
                      </span>
                    </td>

                    {/* Stars */}
                    <td className="px-3 py-3">
                      <span style={{ color: 'var(--text-secondary)' }} className="tabular-nums">
                        {asset.star_count}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/asset/${asset.id}`}
                          target="_blank"
                          style={{ color: 'var(--accent)' }}
                          className="text-xs hover:underline whitespace-nowrap"
                        >
                          View →
                        </Link>
                        <button
                          onClick={() => void handleValidate(asset.id, asset.is_manager_validated)}
                          disabled={isProcessing}
                          className="text-xs transition-opacity hover:opacity-70 disabled:opacity-30 whitespace-nowrap"
                          style={{ color: asset.is_manager_validated ? '#94a3b8' : '#FFD700' }}
                        >
                          {asset.is_manager_validated ? 'Unverify' : 'Verify ✓'}
                        </button>

                        {isConfirmingDelete ? (
                          <span className="flex items-center gap-1">
                            <button
                              onClick={() => void handleDelete(asset.id)}
                              disabled={isProcessing}
                              className="text-xs text-red-400 hover:underline disabled:opacity-30"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setConfirmingDeleteId(null)}
                              style={{ color: 'var(--text-secondary)' }}
                              className="text-xs hover:underline"
                            >
                              Cancel
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() => setConfirmingDeleteId(asset.id)}
                            disabled={isProcessing}
                            className="text-xs text-red-400 hover:underline disabled:opacity-30"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating batch action bar */}
      {selectedCount > 0 && (
        <div
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--bg-border)' }}
          className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl border px-5 py-3 shadow-2xl"
        >
          <span style={{ color: 'var(--text-secondary)' }} className="text-sm">
            {selectedCount} asset{selectedCount !== 1 ? 's' : ''} selected
          </span>
          <button
            onClick={() => void handleBatchValidate()}
            style={{ color: '#FFD700', borderColor: 'rgba(255,215,0,0.4)' }}
            className="rounded-md border px-3 py-1 text-sm transition-opacity hover:opacity-80"
          >
            Verify All
          </button>
          {batchAction === 'idle' ? (
            <button
              onClick={() => setBatchAction('confirm-delete')}
              className="rounded-md border border-red-500/30 px-3 py-1 text-sm text-red-400 transition-opacity hover:opacity-80"
            >
              Delete All
            </button>
          ) : (
            <>
              <span className="text-sm text-red-400">Confirm delete {selectedCount}?</span>
              <button
                onClick={() => void handleBatchDelete()}
                className="rounded-md bg-red-500 px-3 py-1 text-sm text-white transition-opacity hover:opacity-80"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setBatchAction('idle')}
                style={{ color: 'var(--text-secondary)' }}
                className="text-sm hover:underline"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
