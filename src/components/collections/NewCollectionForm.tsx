'use client'

import { useState, useRef, useEffect } from 'react'

interface Props {
  action: (formData: FormData) => void | Promise<void>
}

export function NewCollectionForm({ action }: Props) {
  const [open, setOpen] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) titleRef.current?.focus()
  }, [open])

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{ backgroundColor: 'var(--accent)', color: '#ffffff' }}
        className="rounded-lg px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
      >
        + New Collection
      </button>
    )
  }

  return (
    <form
      action={async (fd) => {
        await action(fd)
        setOpen(false)
      }}
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--bg-border)' }}
      className="flex items-end gap-3 rounded-xl border p-4"
    >
      <div className="flex-1 space-y-2">
        <input
          ref={titleRef}
          name="title"
          type="text"
          placeholder="Collection title"
          required
          maxLength={120}
          style={{
            backgroundColor: 'var(--bg)',
            borderColor: 'var(--bg-border)',
            color: 'var(--text-primary)',
          }}
          className="w-full rounded-lg border px-3 py-1.5 text-sm outline-none transition-colors focus:[border-color:var(--accent)] placeholder:[color:var(--text-secondary)]"
        />
        <input
          name="description"
          type="text"
          placeholder="Description (optional)"
          maxLength={300}
          style={{
            backgroundColor: 'var(--bg)',
            borderColor: 'var(--bg-border)',
            color: 'var(--text-primary)',
          }}
          className="w-full rounded-lg border px-3 py-1.5 text-sm outline-none transition-colors focus:[border-color:var(--accent)] placeholder:[color:var(--text-secondary)]"
        />
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          style={{ borderColor: 'var(--bg-border)', color: 'var(--text-secondary)' }}
          className="rounded-lg border px-3 py-1.5 text-sm transition-colors hover:[color:var(--text-primary)]"
        >
          Cancel
        </button>
        <button
          type="submit"
          style={{ backgroundColor: 'var(--accent)', color: '#ffffff' }}
          className="rounded-lg px-3 py-1.5 text-sm font-medium transition-opacity hover:opacity-90"
        >
          Create
        </button>
      </div>
    </form>
  )
}
