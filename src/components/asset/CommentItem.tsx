'use client'

import { useState } from 'react'
import type { CommentRow } from '@/lib/types/database'

// ─── helpers ──────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#14b8a6',
  '#f59e0b', '#10b981', '#3b82f6', '#ef4444',
]

function nameToColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

// ─── props ────────────────────────────────────────────────────────────────────

interface CommentItemProps {
  comment: CommentRow & { sending?: boolean }
  currentUser: { id: string; role: string } | null
  onDelete: () => void
  isDeleting: boolean
}

// ─── component ────────────────────────────────────────────────────────────────

export function CommentItem({ comment, currentUser, onDelete, isDeleting }: CommentItemProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const canDelete =
    currentUser !== null &&
    (currentUser.id === comment.user_id || currentUser.role === 'manager')

  const initial = comment.user_name.charAt(0).toUpperCase()
  const avatarColor = nameToColor(comment.user_name)

  return (
    <div
      className={`flex gap-3 transition-opacity duration-300 ${
        isDeleting ? 'opacity-0' : comment.sending ? 'opacity-50' : 'opacity-100'
      }`}
    >
      {/* Avatar */}
      <div
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
        style={{ backgroundColor: avatarColor }}
        aria-hidden="true"
      >
        {initial}
      </div>

      {/* Body */}
      <div className="min-w-0 flex-1">
        {/* Name + timestamp */}
        <div className="flex items-baseline gap-2">
          <span
            className="text-sm font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            {comment.user_name}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {comment.sending ? 'sending…' : formatRelativeTime(comment.created_at)}
          </span>
        </div>

        {/* Text */}
        <p
          className="mt-1 whitespace-pre-wrap text-sm leading-relaxed"
          style={{ color: 'var(--text-primary)' }}
        >
          {comment.text}
        </p>

        {/* Delete controls */}
        {canDelete && !comment.sending && (
          <div className="mt-1.5">
            {confirmingDelete ? (
              <span className="inline-flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                Delete this comment?
                <button
                  type="button"
                  onClick={() => { onDelete(); setConfirmingDelete(false) }}
                  className="font-medium text-red-400 hover:opacity-80"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="hover:opacity-80"
                >
                  Cancel
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="text-xs transition-opacity hover:opacity-80"
                style={{ color: 'var(--text-secondary)' }}
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
