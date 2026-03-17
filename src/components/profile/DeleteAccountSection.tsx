'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function DeleteAccountSection() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/account/delete', { method: 'POST' })
      if (!res.ok) {
        const body = (await res.json()) as { error?: string }
        throw new Error(body.error ?? 'Deletion failed')
      }
      router.push('/?deleted=1')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      setLoading(false)
    }
  }

  const confirmed = confirmText === 'DELETE'

  return (
    <>
      {/* Danger zone card */}
      <div
        className="mt-6 rounded-2xl border p-6"
        style={{ borderColor: 'rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.04)' }}
      >
        <h2 className="mb-1 text-base font-semibold text-red-400">Danger Zone</h2>
        <p style={{ color: 'var(--text-secondary)' }} className="mb-4 text-sm leading-relaxed">
          Permanently delete your account and all associated data. Your submitted assets will be
          anonymised and remain on the platform. This action cannot be undone.
        </p>
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20"
        >
          Delete my account
        </button>
      </div>

      {/* Confirmation modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => { setOpen(false); setConfirmText(''); setError(null) }}
          />

          {/* Dialog */}
          <div
            className="relative z-10 w-full max-w-md rounded-2xl border p-6 shadow-2xl"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--bg-border)' }}
          >
            <h3 style={{ color: 'var(--text-primary)' }} className="text-lg font-bold">
              Delete your account?
            </h3>
            <p style={{ color: 'var(--text-secondary)' }} className="mt-3 text-sm leading-relaxed">
              This will permanently delete your account, profile, collections, and personal data.
              Your public assets will remain but will no longer be attributed to you.{' '}
              <strong style={{ color: 'var(--text-primary)' }}>This cannot be undone.</strong>
            </p>

            <div className="mt-5">
              <label
                htmlFor="confirm-delete"
                style={{ color: 'var(--text-secondary)' }}
                className="mb-1.5 block text-sm font-medium"
              >
                Type <strong style={{ color: 'var(--text-primary)' }}>DELETE</strong> to confirm
              </label>
              <input
                id="confirm-delete"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                style={{
                  backgroundColor: 'var(--bg)',
                  borderColor: 'var(--bg-border)',
                  color: 'var(--text-primary)',
                }}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:[border-color:var(--accent)] placeholder:[color:var(--text-secondary)]"
              />
            </div>

            {error && (
              <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
            )}

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => { setOpen(false); setConfirmText(''); setError(null) }}
                disabled={loading}
                style={{ color: 'var(--text-secondary)', borderColor: 'var(--bg-border)' }}
                className="rounded-lg border px-4 py-2 text-sm transition-opacity hover:opacity-70 disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleDelete()}
                disabled={!confirmed || loading}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {loading ? 'Deleting…' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
