'use client'

import Link from 'next/link'

interface TagBadgeProps {
  label: string
  clickable?: boolean
  onClick?: (e: React.MouseEvent) => void
}

export function TagBadge({ label, clickable = false, onClick }: TagBadgeProps) {
  const baseStyle = {
    backgroundColor: 'var(--bg-surface)',
    borderColor: 'var(--bg-border)',
    color: 'var(--text-secondary)',
  }

  if (clickable) {
    return (
      <Link
        href={`/?tags=${encodeURIComponent(label)}`}
        onClick={(e) => {
          e.stopPropagation()
          onClick?.(e)
        }}
        style={baseStyle}
        className="rounded border px-1.5 py-0.5 text-xs transition-colors hover:[border-color:var(--accent)] hover:[color:var(--accent)]"
      >
        #{label}
      </Link>
    )
  }

  return (
    <span
      style={baseStyle}
      className="rounded border px-1.5 py-0.5 text-xs"
    >
      #{label}
    </span>
  )
}
