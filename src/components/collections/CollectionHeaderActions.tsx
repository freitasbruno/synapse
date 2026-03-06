'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  collectionId: string
  initialTitle: string
  initialDescription: string | null
  initialVisibility: 'public' | 'private'
}

export function CollectionHeaderActions({
  collectionId,
  initialTitle,
  initialDescription,
  initialVisibility,
}: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription ?? '')
  const [visibility, setVisibility] = useState<'public' | 'private'>(initialVisibility)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || saving) return
    setSaving(true)
    try {
      await fetch(`/api/collections/${collectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), description, visibility }),
      })
      setEditing(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    await fetch(`/api/collections/${collectionId}`, { method: 'DELETE' })
    router.push('/collections')
  }

  if (editing) {
    return (
      <form onSubmit={(e) => void handleSave(e)} className="mt-4 space-y-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
          required
          className="w-full rounded-lg border px-3 py-2 text-sm font-semibold outline-none transition-colors focus:[border-color:var(--accent)]"
          style={{
            backgroundColor: 'var(--bg)',
            borderColor: 'var(--bg-border)',
            color: 'var(--text-primary)',
          }}
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          maxLength={400}
          rows={2}
          className="w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:[border-color:var(--accent)] placeholder:[color:var(--text-secondary)]"
          style={{
            backgroundColor: 'var(--bg)',
            borderColor: 'var(--bg-border)',
            color: 'var(--text-primary)',
          }}
        />
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border p-0.5" style={{ borderColor: 'var(--bg-border)' }}>
            {(['public', 'private'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVisibility(v)}
                className="rounded px-2.5 py-1 text-xs font-medium transition-colors"
                style={
                  visibility === v
                    ? { backgroundColor: 'var(--accent)', color: '#fff' }
                    : { color: 'var(--text-secondary)' }
                }
              >
                {v === 'public' ? '🌐 Public' : '🔒 Private'}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-lg px-3 py-1.5 text-xs transition-opacity hover:opacity-70"
            style={{ color: 'var(--text-secondary)' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!title.trim() || saving}
            className="rounded-lg px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="mt-4 flex items-center gap-3">
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:[border-color:var(--accent)] hover:[color:var(--accent)]"
        style={{ borderColor: 'var(--bg-border)', color: 'var(--text-secondary)' }}
      >
        Edit
      </button>

      {confirmDelete ? (
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Delete this collection?</span>
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={deleting}
            className="rounded-lg px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#ef4444', color: '#fff' }}
          >
            {deleting ? 'Deleting…' : 'Yes, delete'}
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(false)}
            className="text-xs transition-opacity hover:opacity-70"
            style={{ color: 'var(--text-secondary)' }}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          className="text-xs transition-opacity hover:opacity-70"
          style={{ color: '#ef4444' }}
        >
          Delete collection
        </button>
      )}
    </div>
  )
}
