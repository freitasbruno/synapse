'use client'

import { useState } from 'react'
import { formatCount } from '@/lib/utils/format'

// ─── icons ────────────────────────────────────────────────────────────────────

function StarFilledIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

function StarOutlineIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

// ─── component ────────────────────────────────────────────────────────────────

export interface StarButtonProps {
  assetId: string
  initialStarCount: number
  initialStarred: boolean
  isAuthenticated: boolean
  size?: number
}

export function StarButton({
  assetId,
  initialStarCount,
  initialStarred,
  isAuthenticated,
  size = 14,
}: StarButtonProps) {
  const [starred, setStarred] = useState(initialStarred)
  const [count, setCount] = useState(initialStarCount)
  const [loading, setLoading] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)

  async function handleClick(e: React.MouseEvent) {
    e.stopPropagation()

    if (!isAuthenticated) {
      setShowTooltip(true)
      setTimeout(() => setShowTooltip(false), 2000)
      return
    }

    if (loading) return

    // Optimistic update
    const prevStarred = starred
    const prevCount = count
    setStarred(!starred)
    setCount(starred ? count - 1 : count + 1)
    setLoading(true)

    try {
      const res = await fetch(`/api/assets/${assetId}/star`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed')
      const data = (await res.json()) as { starred: boolean; star_count: number }
      setStarred(data.starred)
      setCount(data.star_count)
    } catch {
      // Revert on error
      setStarred(prevStarred)
      setCount(prevCount)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={(e) => void handleClick(e)}
        disabled={loading}
        style={{ color: starred ? '#fbbf24' : 'var(--text-secondary)' }}
        className="flex items-center gap-1.5 transition-opacity hover:opacity-80 disabled:opacity-50"
        aria-label={starred ? 'Unstar this asset' : 'Star this asset'}
        aria-pressed={starred}
      >
        {starred ? <StarFilledIcon size={size} /> : <StarOutlineIcon size={size} />}
        <span className="text-xs">{formatCount(count)}</span>
      </button>

      {showTooltip && (
        <div
          className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-xs text-white shadow"
          style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
          role="tooltip"
        >
          Sign in to star this asset
        </div>
      )}
    </div>
  )
}
