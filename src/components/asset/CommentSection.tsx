'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CommentItem } from './CommentItem'
import type { CommentRow } from '@/lib/types/database'

// ─── types ────────────────────────────────────────────────────────────────────

type OptimisticComment = CommentRow & { sending?: boolean }

interface CurrentUser {
  id: string
  display_name: string
  role: string
}

interface CommentSectionProps {
  assetId: string
  initialComments: CommentRow[]
  currentUser: CurrentUser | null
}

const MAX_LENGTH = 1000

// ─── component ────────────────────────────────────────────────────────────────

export function CommentSection({ assetId, initialComments, currentUser }: CommentSectionProps) {
  const [comments, setComments] = useState<OptimisticComment[]>(initialComments)
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // ── Post comment ────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || !currentUser || submitting) return

    setSubmitError(null)
    setSubmitting(true)

    const tempId = crypto.randomUUID()
    const optimistic: OptimisticComment = {
      id: tempId,
      asset_id: assetId,
      user_id: currentUser.id,
      user_name: currentUser.display_name,
      text: trimmed,
      created_at: new Date().toISOString(),
      sending: true,
    }

    setComments((prev) => [...prev, optimistic])
    setText('')

    try {
      const res = await fetch(`/api/assets/${assetId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed }),
      })

      if (!res.ok) throw new Error('Failed to post comment')

      const saved = (await res.json()) as CommentRow
      setComments((prev) =>
        prev.map((c) => (c.id === tempId ? { ...saved, sending: false } : c)),
      )
    } catch {
      // Revert
      setComments((prev) => prev.filter((c) => c.id !== tempId))
      setText(trimmed)
      setSubmitError('Failed to post comment. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Delete comment ──────────────────────────────────────────────────────────

  async function handleDelete(commentId: string) {
    setDeletingIds((prev) => new Set([...prev, commentId]))

    try {
      const res = await fetch(`/api/comments/${commentId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')

      // Let the fade-out animation play, then remove
      setTimeout(() => {
        setComments((prev) => prev.filter((c) => c.id !== commentId))
        setDeletingIds((prev) => {
          const next = new Set(prev)
          next.delete(commentId)
          return next
        })
      }, 300)
    } catch {
      // Revert fade
      setDeletingIds((prev) => {
        const next = new Set(prev)
        next.delete(commentId)
        return next
      })
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Heading */}
      <h2
        style={{ color: 'var(--text-primary)' }}
        className="text-xl font-semibold"
      >
        Discussion{' '}
        <span
          className="text-base font-normal"
          style={{ color: 'var(--text-secondary)' }}
        >
          ({comments.length})
        </span>
      </h2>

      {/* Comment list */}
      {comments.length > 0 && (
        <div className="mt-6 space-y-5">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUser={currentUser}
              onDelete={() => void handleDelete(comment.id)}
              isDeleting={deletingIds.has(comment.id)}
            />
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="mt-6">
        {currentUser ? (
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-2">
            <div
              className="overflow-hidden rounded-lg border transition-colors focus-within:[border-color:var(--accent)]"
              style={{ borderColor: 'var(--bg-border)', backgroundColor: 'var(--bg)' }}
            >
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                maxLength={MAX_LENGTH}
                placeholder="Write a comment…"
                disabled={submitting}
                className="w-full resize-none px-3 py-2.5 text-sm outline-none disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text-primary)',
                }}
              />
              <div
                className="flex items-center justify-between border-t px-3 py-2"
                style={{ borderColor: 'var(--bg-border)' }}
              >
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {text.length} / {MAX_LENGTH}
                </span>
                <button
                  type="submit"
                  disabled={submitting || !text.trim()}
                  style={{ backgroundColor: 'var(--accent)', color: '#ffffff' }}
                  className="rounded-md px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? 'Posting…' : 'Post Comment'}
                </button>
              </div>
            </div>

            {submitError && (
              <p className="text-xs text-red-400">{submitError}</p>
            )}
          </form>
        ) : (
          <Link
            href="/auth/signin"
            style={{ borderColor: 'var(--bg-border)', color: 'var(--text-secondary)' }}
            className="flex items-center justify-center rounded-lg border px-4 py-4 text-sm transition-colors hover:[border-color:var(--accent)] hover:[color:var(--text-primary)]"
          >
            Sign in to join the discussion →
          </Link>
        )}
      </div>
    </div>
  )
}
