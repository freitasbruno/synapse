'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { UserCollectionOption } from '@/lib/data/collections'

// ─── props ────────────────────────────────────────────────────────────────────

interface Props {
  assetId: string
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
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

// ─── toast ────────────────────────────────────────────────────────────────────

function Toast({ message }: { message: string }) {
  return (
    <div
      className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg px-4 py-2 text-sm font-medium shadow-lg"
      style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
    >
      {message}
    </div>
  )
}

// ─── AddToCollectionButton ────────────────────────────────────────────────────

export function AddToCollectionButton({ assetId, isAuthenticated }: Props) {
  const [open, setOpen] = useState(false)
  const [collections, setCollections] = useState<UserCollectionOption[]>([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newVisibility, setNewVisibility] = useState<'public' | 'private'>('public')
  const [creating, setCreating] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const hasSome = collections.some((c) => c.contains)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
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

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }, [])

  async function fetchCollections() {
    setLoading(true)
    try {
      const res = await fetch(`/api/collections/mine?assetId=${encodeURIComponent(assetId)}`)
      if (res.ok) {
        setCollections((await res.json()) as UserCollectionOption[])
      }
    } finally {
      setLoading(false)
    }
  }

  function handleOpen() {
    if (!open) {
      void fetchCollections()
    }
    setOpen((v) => !v)
  }

  async function toggleCollection(collection: UserCollectionOption) {
    // Optimistic update
    setCollections((prev) =>
      prev.map((c) => (c.id === collection.id ? { ...c, contains: !c.contains } : c)),
    )

    const method = collection.contains ? 'DELETE' : 'POST'
    const res = await fetch(`/api/collections/${collection.id}/assets`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assetId }),
    })

    if (!res.ok) {
      // Revert on failure
      setCollections((prev) =>
        prev.map((c) => (c.id === collection.id ? { ...c, contains: collection.contains } : c)),
      )
      return
    }

    showToast(collection.contains ? `Removed from "${collection.title}"` : `Added to "${collection.title}"`)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim() || creating) return
    setCreating(true)

    try {
      // 1. Create collection
      const createRes = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim(), visibility: newVisibility }),
      })

      if (!createRes.ok) return

      const created = (await createRes.json()) as { id: string; title: string }

      // 2. Add asset to new collection
      await fetch(`/api/collections/${created.id}/assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId }),
      })

      // 3. Update local state
      setCollections((prev) => [{ id: created.id, title: created.title, contains: true }, ...prev])
      setNewTitle('')
      setNewVisibility('public')
      showToast(`Added to "${created.title}"`)
    } finally {
      setCreating(false)
    }
  }

  if (!isAuthenticated) return null

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleOpen}
        aria-label="Add to collection"
        title="Add to collection"
        style={{ color: hasSome ? 'var(--accent)' : 'var(--text-secondary)' }}
        className="flex items-center justify-center rounded p-1.5 transition-colors hover:[color:var(--accent)]"
      >
        <BookmarkIcon filled={hasSome} />
      </button>

      {open && (
        <div
          ref={popoverRef}
          className="absolute right-0 top-full z-40 mt-1 w-64 overflow-hidden rounded-xl border shadow-xl"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--bg-border)',
          }}
        >
          {/* Header */}
          <div
            className="border-b px-3 py-2.5"
            style={{ borderColor: 'var(--bg-border)' }}
          >
            <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
              Add to Collection
            </p>
          </div>

          {/* Collection list */}
          <div className="max-h-48 overflow-y-auto">
            {loading ? (
              <p className="px-3 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                Loading…
              </p>
            ) : collections.length === 0 ? (
              <p className="px-3 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                No collections yet.
              </p>
            ) : (
              collections.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => void toggleCollection(c)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors hover:[background-color:var(--bg)]"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <span className="truncate pr-2">{c.title}</span>
                  {c.contains && (
                    <span style={{ color: 'var(--accent)' }}>
                      <CheckIcon />
                    </span>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Divider */}
          <div
            className="border-t"
            style={{ borderColor: 'var(--bg-border)' }}
          />

          {/* Create new */}
          <form onSubmit={(e) => void handleCreate(e)} className="px-3 py-2.5 space-y-2">
            <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              New collection
            </p>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Collection name"
              maxLength={80}
              className="w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none transition-colors focus:[border-color:var(--accent)] placeholder:[color:var(--text-secondary)]"
              style={{
                backgroundColor: 'var(--bg)',
                borderColor: 'var(--bg-border)',
                color: 'var(--text-primary)',
              }}
            />
            <div className="flex items-center justify-between gap-2">
              {/* Visibility toggle */}
              <div className="flex items-center gap-1 rounded-lg border p-0.5" style={{ borderColor: 'var(--bg-border)' }}>
                {(['public', 'private'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setNewVisibility(v)}
                    className="rounded px-2 py-0.5 text-[10px] font-medium transition-colors"
                    style={
                      newVisibility === v
                        ? { backgroundColor: 'var(--accent)', color: '#fff' }
                        : { color: 'var(--text-secondary)' }
                    }
                  >
                    {v === 'public' ? '🌐 Public' : '🔒 Private'}
                  </button>
                ))}
              </div>
              <button
                type="submit"
                disabled={!newTitle.trim() || creating}
                className="rounded-lg px-3 py-1 text-xs font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {toast && <Toast message={toast} />}
    </div>
  )
}
