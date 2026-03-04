'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { AssetCard } from './AssetCard'
import type { AssetPreview } from '@/lib/data/assets'

// ─── types ────────────────────────────────────────────────────────────────────

type AssetType = 'all' | 'prompt' | 'tool' | 'app' | 'workflow'
type SortOrder = 'newest' | 'popular'

const TYPE_CHIPS: { label: string; value: AssetType }[] = [
  { label: 'All',      value: 'all' },
  { label: 'Prompt',   value: 'prompt' },
  { label: 'Tool',     value: 'tool' },
  { label: 'App',      value: 'app' },
  { label: 'Workflow', value: 'workflow' },
]

// ─── helpers ──────────────────────────────────────────────────────────────────

function buildQs(params: {
  search: string
  type: AssetType
  sort: SortOrder
}): string {
  const p = new URLSearchParams()
  if (params.search)           p.set('search', params.search)
  if (params.type !== 'all')   p.set('type',   params.type)
  if (params.sort !== 'newest') p.set('sort',  params.sort)
  return p.toString()
}

// ─── icons ────────────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: 'var(--text-secondary)' }}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

// ─── component ────────────────────────────────────────────────────────────────

interface GalleryClientProps {
  assets: AssetPreview[]
}

export function GalleryClient({ assets }: GalleryClientProps) {
  const router     = useRouter()
  const pathname   = usePathname()
  const searchParams = useSearchParams()

  // URL is source of truth for type + sort.
  // Local state owns the search input for immediate responsiveness.
  const typeFilter = (searchParams.get('type') ?? 'all') as AssetType
  const sortOrder  = (searchParams.get('sort') ?? 'newest') as SortOrder
  const [inputValue, setInputValue] = useState(
    () => searchParams.get('search') ?? ''
  )

  // Debounce: push search value to URL 300 ms after the user stops typing.
  useEffect(() => {
    const timer = setTimeout(() => {
      // Read the current URL params at fire-time to avoid stale closure issues.
      const current = new URLSearchParams(window.location.search)
      if (inputValue) current.set('search', inputValue)
      else current.delete('search')
      const qs = current.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    }, 300)
    return () => clearTimeout(timer)
  // router and pathname are stable refs from Next.js — including them
  // satisfies exhaustive-deps without risk of re-triggering the debounce.
  }, [inputValue, router, pathname])

  // ── URL-update helpers ──────────────────────────────────────────────────────

  function setType(type: AssetType) {
    const qs = buildQs({ search: inputValue, type, sort: sortOrder })
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  function setSort(sort: SortOrder) {
    const qs = buildQs({ search: inputValue, type: typeFilter, sort })
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  function handleReset() {
    setInputValue('')
    router.replace(pathname, { scroll: false })
  }

  // ── derived state ───────────────────────────────────────────────────────────

  const isNonDefault =
    inputValue !== '' || typeFilter !== 'all' || sortOrder !== 'newest'

  // Compute filtered/sorted list. The React Compiler handles memoization.
  let filteredAssets = [...assets]

  if (inputValue.trim()) {
    const query = inputValue.toLowerCase()
    filteredAssets = filteredAssets.filter(
      (a) =>
        a.title.toLowerCase().includes(query) ||
        a.tags.some((tag) => tag.toLowerCase().includes(query))
    )
  }

  if (typeFilter !== 'all') {
    filteredAssets = filteredAssets.filter((a) => a.type === typeFilter)
  }

  if (sortOrder === 'popular') {
    filteredAssets = filteredAssets.sort((a, b) => b.star_count - a.star_count)
  } else {
    filteredAssets = filteredAssets.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* ── Search bar ── */}
      <div className="relative">
        <SearchIcon />
        <input
          type="search"
          placeholder="Search by title or tag…"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor:     'var(--bg-border)',
            color:           'var(--text-primary)',
          }}
          className="w-full rounded-lg border py-2.5 pl-9 pr-9 text-sm outline-none transition-colors focus:[border-color:var(--accent)] focus:ring-1 focus:[--tw-ring-color:var(--accent)] placeholder:[color:var(--text-secondary)]"
        />
        {inputValue && (
          <button
            onClick={() => setInputValue('')}
            aria-label="Clear search"
            style={{ color: 'var(--text-secondary)' }}
            className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-70"
          >
            <XIcon />
          </button>
        )}
      </div>

      {/* ── Filter + sort row ── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Type chips */}
        <div className="flex flex-wrap gap-1.5">
          {TYPE_CHIPS.map((chip) => {
            const isActive = typeFilter === chip.value
            return (
              <button
                key={chip.value}
                onClick={() => setType(chip.value)}
                style={
                  isActive
                    ? { backgroundColor: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' }
                    : { backgroundColor: 'var(--bg-surface)', color: 'var(--text-secondary)', borderColor: 'var(--bg-border)' }
                }
                className="rounded-full border px-3 py-1 text-sm font-medium transition-colors hover:opacity-90"
              >
                {chip.label}
              </button>
            )
          })}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Sort dropdown */}
        <select
          value={sortOrder}
          onChange={(e) => setSort(e.target.value as SortOrder)}
          aria-label="Sort order"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor:     'var(--bg-border)',
            color:           'var(--text-primary)',
          }}
          className="rounded-md border px-3 py-1.5 text-sm outline-none transition-colors focus:[border-color:var(--accent)]"
        >
          <option value="newest">Newest First</option>
          <option value="popular">Most Popular</option>
        </select>

        {/* Reset button — only visible when any filter/sort is non-default */}
        {isNonDefault && (
          <button
            onClick={handleReset}
            style={{
              color:       'var(--text-secondary)',
              borderColor: 'var(--bg-border)',
            }}
            className="rounded-md border px-3 py-1.5 text-sm transition-colors hover:opacity-70"
          >
            Reset
          </button>
        )}
      </div>

      {/* ── Results count ── */}
      <p style={{ color: 'var(--text-secondary)' }} className="text-xs">
        Showing{' '}
        <span style={{ color: 'var(--text-primary)' }} className="font-medium">
          {filteredAssets.length}
        </span>{' '}
        {filteredAssets.length === 1 ? 'asset' : 'assets'}
      </p>

      {/* ── Grid or empty state ── */}
      {filteredAssets.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredAssets.map((asset) => (
            <AssetCard key={asset.id} asset={asset} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 py-24">
          <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
            No assets found matching your filters.
          </p>
          <button
            onClick={handleReset}
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor:     'var(--bg-border)',
              color:           'var(--text-primary)',
            }}
            className="rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:opacity-80"
          >
            Reset filters
          </button>
        </div>
      )}
    </div>
  )
}
