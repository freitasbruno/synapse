'use client'

import { useState, useEffect, useRef } from 'react'

// ─── icons ────────────────────────────────────────────────────────────────────

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true"
      style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function XSmallIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <polyline points="1.5,5 4,7.5 8.5,2" stroke="white" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── component ────────────────────────────────────────────────────────────────

interface TagFilterDropdownProps {
  allTags: string[]
  selectedTags: string[]
  onChange: (tags: string[]) => void
}

export function TagFilterDropdown({ allTags, selectedTags, onChange }: TagFilterDropdownProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Close on click/pointer outside
  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSearch('')
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  // Auto-focus search on open; listen for Escape to close
  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => searchRef.current?.focus(), 10)
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setSearch('')
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      clearTimeout(t)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function toggle(tag: string) {
    const next = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag]
    onChange(next)
  }

  function removeTag(tag: string) {
    onChange(selectedTags.filter((t) => t !== tag))
  }

  // Filter by search, then sort: selected first, then alphabetical
  const filtered = allTags.filter(
    (tag) => !search || tag.toLowerCase().includes(search.toLowerCase()),
  )
  const sortedTags = [
    ...filtered.filter((t) => selectedTags.includes(t)),
    ...filtered.filter((t) => !selectedTags.includes(t)),
  ]

  const selectedCount = selectedTags.length
  const hasSelectedInView = sortedTags.some((t) => selectedTags.includes(t))
  const hasUnselectedInView = sortedTags.some((t) => !selectedTags.includes(t))
  const showDivider = hasSelectedInView && hasUnselectedInView

  return (
    <div ref={containerRef} className="relative">
      {/* ── Trigger ── */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => { if (open) setSearch(''); setOpen((v) => !v) }}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={
          selectedCount > 0
            ? { backgroundColor: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' }
            : { backgroundColor: 'var(--bg-surface)', color: 'var(--text-secondary)', borderColor: 'var(--bg-border)' }
        }
        className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-colors hover:opacity-90"
      >
        Tags
        {selectedCount > 0 && (
          <span
            className="rounded-full px-1.5 text-xs font-semibold leading-tight"
            style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
          >
            {selectedCount}
          </span>
        )}
        <ChevronIcon open={open} />
      </button>

      {/* ── Panel ── */}
      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-1.5 flex flex-col overflow-hidden rounded-xl border shadow-xl"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--bg-border)',
            minWidth: '240px',
            maxWidth: '320px',
            width: 'max-content',
          }}
        >
          {/* Search */}
          <div className="border-b p-2" style={{ borderColor: 'var(--bg-border)' }}>
            <div className="relative">
              <input
                ref={searchRef}
                type="text"
                placeholder="Search tags..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  backgroundColor: 'var(--bg)',
                  borderColor: 'var(--bg-border)',
                  color: 'var(--text-primary)',
                }}
                className="w-full rounded-lg border px-3 py-1.5 pr-7 text-sm outline-none focus:[border-color:var(--accent)] placeholder:[color:var(--text-secondary)]"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                  style={{ color: 'var(--text-secondary)' }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 hover:opacity-70"
                >
                  <XSmallIcon />
                </button>
              )}
            </div>
          </div>

          {/* Tag list */}
          <ul
            role="listbox"
            aria-multiselectable="true"
            aria-label="Tags"
            className="overflow-y-auto"
            style={{ maxHeight: '280px' }}
          >
            {sortedTags.length === 0 ? (
              <li>
                <p
                  style={{ color: 'var(--text-secondary)' }}
                  className="px-3 py-5 text-center text-sm"
                >
                  No tags found
                </p>
              </li>
            ) : (
              sortedTags.map((tag, i) => {
                const isChecked = selectedTags.includes(tag)
                // Divider between selected and unselected groups
                const isFirstUnselected = showDivider && !isChecked && i > 0 && selectedTags.includes(sortedTags[i - 1])
                return (
                  <li key={tag}>
                    {isFirstUnselected && (
                      <div
                        className="mx-2 my-1 h-px"
                        style={{ backgroundColor: 'var(--bg-border)' }}
                      />
                    )}
                    <button
                      type="button"
                      role="option"
                      aria-selected={isChecked}
                      onClick={() => toggle(tag)}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:[background-color:var(--bg)]"
                    >
                      {/* Custom checkbox */}
                      <span
                        className="flex h-4 w-4 shrink-0 items-center justify-center rounded border"
                        style={
                          isChecked
                            ? { backgroundColor: 'var(--accent)', borderColor: 'var(--accent)' }
                            : { borderColor: 'var(--bg-border)' }
                        }
                      >
                        {isChecked && <CheckIcon />}
                      </span>
                      <span style={{ color: 'var(--text-primary)' }}>#{tag}</span>
                    </button>
                  </li>
                )
              })
            )}
          </ul>

          {/* Footer */}
          <div
            className="flex items-center justify-between border-t px-3 py-2"
            style={{ borderColor: 'var(--bg-border)' }}
          >
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {selectedCount} selected
            </span>
            {selectedCount > 0 && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs font-medium hover:opacity-70"
                style={{ color: 'var(--accent)' }}
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Selected pills ── */}
      {selectedCount > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selectedTags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium"
              style={{ backgroundColor: 'var(--accent)', borderColor: 'var(--accent)', color: '#fff' }}
            >
              #{tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                aria-label={`Remove ${tag} filter`}
                className="flex items-center hover:opacity-70"
              >
                <XSmallIcon />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
