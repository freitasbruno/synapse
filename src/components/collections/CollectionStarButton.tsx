'use client'

import { useState } from 'react'

interface Props {
  collectionId: string
  initialStarCount: number
  initialStarred: boolean
  isAuthenticated: boolean
}

function StarIcon({ filled }: { filled: boolean }) {
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
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

export function CollectionStarButton({ collectionId, initialStarCount, initialStarred, isAuthenticated }: Props) {
  const [starred, setStarred] = useState(initialStarred)
  const [count, setCount] = useState(initialStarCount)
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (!isAuthenticated || loading) return
    setLoading(true)
    try {
      const res = await fetch(`/api/collections/${collectionId}/star`, { method: 'POST' })
      if (res.ok) {
        const data = (await res.json()) as { starred: boolean; star_count: number }
        setStarred(data.starred)
        setCount(data.star_count)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={!isAuthenticated || loading}
      aria-label={starred ? 'Unstar collection' : 'Star collection'}
      className="flex items-center gap-1.5 transition-opacity hover:opacity-80 disabled:cursor-default disabled:opacity-100"
      style={{ color: starred ? 'var(--accent)' : 'var(--text-secondary)' }}
    >
      <StarIcon filled={starred} />
      <span>{count}</span>
    </button>
  )
}
