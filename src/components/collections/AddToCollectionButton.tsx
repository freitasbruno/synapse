'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { UserCollectionOption } from '@/lib/data/collections'

// ─── props ────────────────────────────────────────────────────────────────────

interface Props {
  assetId: string
  assetTitle?: string
  isAuthenticated: boolean
}

// ─── icons ────────────────────────────────────────────────────────────────────

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

// ─── skeleton rows ────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <div className="space-y-2 py-1">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2.5">
          <div className="h-3 flex-1 animate-pulse rounded" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
          <div className="h-3 w-10 animate-pulse rounded" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
          <div className="h-4 w-4 animate-pulse rounded" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
        </div>
      ))}
    </div>
  )
}

// ─── AddToCollectionButton ────────────────────────────────────────────────────

export function AddToCollectionButton({ assetId, assetTitle, isAuthenticated }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [collections, setCollections] = useState<UserCollectionOption[]>([])
  const [loading, setLoading] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const [rowConfirm, setRowConfirm] = useState<Record<string, string>>({})

  const hasSome = collections.some((c) => c.contains)

  // Lock body scroll when modal open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  const fetchCollections = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/collections/mine?assetId=${encodeURIComponent(assetId)}`)
      if (res.ok) setCollections((await res.json()) as UserCollectionOption[])
    } finally {
      setLoading(false)
    }
  }, [assetId])

  function handleOpen(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) {
      router.push('/auth/signin')
      return
    }
    setOpen(true)
    void fetchCollections()
  }

  function showRowConfirm(id: string, msg: string) {
    setRowConfirm((prev) => ({ ...prev, [id]: msg }))
    setTimeout(() => {
      setRowConfirm((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    }, 2000)
  }

  async function toggleCollection(c: UserCollectionOption) {
    // Optimistic update
    setCollections((prev) =>
      prev.map((x) => (x.id === c.id ? { ...x, contains: !x.contains } : x)),
    )

    const method = c.contains ? 'DELETE' : 'POST'
    const res = await fetch(`/api/collections/${c.id}/assets`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assetId }),
    })

    if (!res.ok) {
      // Revert on failure
      setCollections((prev) =>
        prev.map((x) => (x.id === c.id ? { ...x, contains: c.contains } : x)),
      )
      return
    }

    showRowConfirm(c.id, c.contains ? 'Removed' : '✓ Added')
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim() || creating) return
    setCreating(true)

    try {
      const createRes = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim() }),
      })
      if (!createRes.ok) return

      const created = (await createRes.json()) as { id: string; title: string }

      await fetch(`/api/collections/${created.id}/assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId }),
      })

      setCollections((prev) => [
        { id: created.id, title: created.title, asset_count: 1, contains: true },
        ...prev,
      ])
      setNewTitle('')
      showRowConfirm(created.id, '✓ Added')
    } finally {
      setCreating(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Add to collection"
        title="Add to collection"
        style={{ color: hasSome ? 'var(--accent)' : 'var(--text-secondary)' }}
        className="flex items-center justify-center rounded p-1.5 transition-colors hover:[color:var(--accent)]"
      >
        <BookmarkIcon filled={hasSome} />
      </button>

      {open && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div
            className="animate-modal-in w-full max-w-md rounded-xl border shadow-2xl"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--bg-border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="flex items-start justify-between gap-3 border-b px-6 py-4"
              style={{ borderColor: 'var(--bg-border)' }}
            >
              <div className="min-w-0">
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Add to Collection
                </h2>
                {assetTitle && (
                  <p className="mt-0.5 truncate text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {assetTitle}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="shrink-0 rounded p-1 transition-colors hover:[background-color:var(--bg-border)]"
                style={{ color: 'var(--text-secondary)' }}
              >
                <XIcon />
              </button>
            </div>

            {/* Collections list */}
            <div className="px-6 pt-4">
              {loading ? (
                <SkeletonRows />
              ) : collections.length === 0 ? (
                <p className="py-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  You don&apos;t have any collections yet.
                </p>
              ) : (
                <div className="max-h-60 overflow-y-auto">
                  <div className="space-y-0.5">
                    {collections.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => void toggleCollection(c)}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:[background-color:var(--bg-border)]"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm" style={{ color: 'var(--text-primary)' }}>
                            {c.title}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            {c.asset_count} {c.asset_count === 1 ? 'asset' : 'assets'}
                          </p>
                        </div>
                        {rowConfirm[c.id] ? (
                          <span
                            className="shrink-0 text-xs font-medium"
                            style={{ color: c.contains ? 'var(--accent)' : 'var(--text-secondary)' }}
                          >
                            {rowConfirm[c.id]}
                          </span>
                        ) : (
                          <div
                            className="flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors"
                            style={{
                              borderColor: c.contains ? 'var(--accent)' : '#404040',
                              backgroundColor: c.contains ? 'var(--accent)' : 'transparent',
                              color: '#fff',
                            }}
                          >
                            {c.contains && <CheckIcon />}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="mx-6 my-4 border-t" style={{ borderColor: 'var(--bg-border)' }} />

            {/* Create new section */}
            <div className="px-6">
              <p className="mb-2 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Create new collection
              </p>
              <form onSubmit={(e) => void handleCreate(e)} className="flex gap-2">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Collection name"
                  maxLength={80}
                  className="min-w-0 flex-1 rounded-lg border px-3 py-1.5 text-sm outline-none transition-colors focus:[border-color:var(--accent)] placeholder:[color:var(--text-secondary)]"
                  style={{
                    backgroundColor: 'var(--bg)',
                    borderColor: 'var(--bg-border)',
                    color: 'var(--text-primary)',
                  }}
                />
                <button
                  type="submit"
                  disabled={!newTitle.trim() || creating}
                  className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
                >
                  {creating ? 'Adding…' : 'Create & Add'}
                </button>
              </form>
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-between border-t px-6 py-4"
              style={{ borderColor: 'var(--bg-border)' }}
            >
              <Link
                href="/profile#collections"
                onClick={() => setOpen(false)}
                className="text-xs transition-colors hover:[color:var(--text-primary)]"
                style={{ color: 'var(--text-secondary)' }}
              >
                Manage collections →
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-4 py-1.5 text-sm font-medium transition-opacity hover:opacity-90"
                style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
              >
                Done
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
