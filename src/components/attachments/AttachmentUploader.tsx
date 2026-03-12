'use client'

import { useState, useRef } from 'react'
import {
  ATTACHMENT_CONFIG,
  getFileTypeIcon,
  formatFileSize,
} from '@/lib/attachments/config'
import type { AssetAttachment } from '@/lib/types/database'

interface Props {
  assetId: string
  attachments: AssetAttachment[]
  onAttachmentsChange: (attachments: AssetAttachment[]) => void
}

interface UploadingFile {
  id: string
  name: string
  error: string | null
}

export function AttachmentUploader({ assetId, attachments, onAttachmentsChange }: Props) {
  const [uploading, setUploading] = useState<UploadingFile[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)

  const atLimit = attachments.length >= ATTACHMENT_CONFIG.MAX_PER_ASSET

  // ── Validation ─────────────────────────────────────────────────────────────

  function validateFile(file: File): string | null {
    if (!ATTACHMENT_CONFIG.ALLOWED_MIME_TYPES.includes(file.type)) {
      return 'File type not supported'
    }
    if (file.size > ATTACHMENT_CONFIG.MAX_SIZE_BYTES) {
      return `File too large — maximum size is ${ATTACHMENT_CONFIG.MAX_SIZE_LABEL}`
    }
    if (attachments.length >= ATTACHMENT_CONFIG.MAX_PER_ASSET) {
      return `Maximum of ${ATTACHMENT_CONFIG.MAX_PER_ASSET} attachments per asset`
    }
    return null
  }

  // ── Upload ─────────────────────────────────────────────────────────────────

  async function handleUpload(file: File) {
    const validationError = validateFile(file)
    const uploadId = crypto.randomUUID()

    if (validationError) {
      setUploading((prev) => [
        ...prev,
        { id: uploadId, name: file.name, error: validationError },
      ])
      setTimeout(() => {
        setUploading((prev) => prev.filter((u) => u.id !== uploadId))
      }, 4000)
      return
    }

    setUploading((prev) => [...prev, { id: uploadId, name: file.name, error: null }])

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`/api/assets/${assetId}/attachments`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? 'Upload failed')
      }

      const newAttachment = (await res.json()) as AssetAttachment
      onAttachmentsChange([...attachments, newAttachment])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      setUploading((prev) =>
        prev.map((u) => (u.id === uploadId ? { ...u, error: message } : u)),
      )
      setTimeout(() => {
        setUploading((prev) => prev.filter((u) => u.id !== uploadId))
      }, 4000)
      return
    }

    setUploading((prev) => prev.filter((u) => u.id !== uploadId))
  }

  function handleFiles(files: FileList | null) {
    if (!files) return
    Array.from(files).forEach((file) => void handleUpload(file))
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  async function handleDelete(attachmentId: string, assetIdParam: string) {
    setDeletingIds((prev) => new Set(prev).add(attachmentId))
    try {
      const res = await fetch(
        `/api/assets/${assetIdParam}/attachments/${attachmentId}`,
        { method: 'DELETE' },
      )
      if (!res.ok) throw new Error('Delete failed')
      onAttachmentsChange(attachments.filter((a) => a.id !== attachmentId))
    } catch (err) {
      console.error('[AttachmentUploader] delete error:', err)
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev)
        next.delete(attachmentId)
        return next
      })
      setConfirmDeleteId(null)
    }
  }

  // ── Drag & Drop ────────────────────────────────────────────────────────────

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    if (!atLimit) handleFiles(e.dataTransfer.files)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span style={{ color: 'var(--text-primary)' }} className="text-sm font-semibold">
          📎 Attachments
        </span>
        <span
          className="rounded-full px-2 py-0.5 text-xs font-medium"
          style={{ backgroundColor: 'var(--bg)', color: 'var(--text-secondary)', border: '1px solid var(--bg-border)' }}
        >
          {attachments.length} / {ATTACHMENT_CONFIG.MAX_PER_ASSET}
        </span>
      </div>

      {/* Upload zone or limit message */}
      {atLimit ? (
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          Maximum attachments reached.
        </p>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click() }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors"
          style={{
            borderColor: dragOver ? 'var(--accent)' : 'var(--bg-border)',
            backgroundColor: dragOver ? 'color-mix(in srgb, var(--accent) 5%, transparent)' : 'transparent',
          }}
        >
          <span className="text-2xl">📁</span>
          <p className="mt-2 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Drop files here or click to browse
          </p>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
            {ATTACHMENT_CONFIG.ALLOWED_EXTENSIONS.join(', ')} · max {ATTACHMENT_CONFIG.MAX_SIZE_LABEL}
          </p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={ATTACHMENT_CONFIG.ALLOWED_EXTENSIONS.join(',')}
        multiple
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* In-progress uploads */}
      {uploading.map((u) => (
        <div
          key={u.id}
          className="flex items-center gap-3 rounded-lg border px-4 py-3"
          style={{ borderColor: u.error ? '#ef4444' : 'var(--bg-border)', backgroundColor: 'var(--bg-surface)' }}
        >
          <span className="text-lg">📎</span>
          <div className="min-w-0 flex-1">
            <p
              className="truncate text-sm font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              {u.name}
            </p>
            {u.error ? (
              <p className="text-xs text-red-400">{u.error}</p>
            ) : (
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Uploading…
              </p>
            )}
          </div>
          {!u.error && (
            <div
              className="h-1.5 w-16 overflow-hidden rounded-full"
              style={{ backgroundColor: 'var(--bg-border)' }}
            >
              <div
                className="h-full animate-pulse rounded-full"
                style={{ backgroundColor: 'var(--accent)', width: '60%' }}
              />
            </div>
          )}
        </div>
      ))}

      {/* Existing attachments list */}
      {attachments.map((att) => {
        const isDeleting = deletingIds.has(att.id)
        const isConfirming = confirmDeleteId === att.id

        return (
          <div
            key={att.id}
            className="flex items-start gap-3 rounded-lg border px-4 py-3"
            style={{ borderColor: 'var(--bg-border)', backgroundColor: 'var(--bg-surface)' }}
          >
            <span className="mt-0.5 text-xl">{getFileTypeIcon(att.mime_type)}</span>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p
                  className="truncate text-sm font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {att.filename}
                </p>
                <span className="shrink-0 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {formatFileSize(att.size_bytes)}
                </span>
              </div>

              {/* Label */}
              <input
                type="text"
                defaultValue={att.label ?? ''}
                placeholder="Add a label…"
                maxLength={120}
                className="w-full rounded-md border px-2.5 py-1 text-xs outline-none transition-colors focus:[border-color:var(--accent)] placeholder:[color:var(--text-secondary)]"
                style={{
                  backgroundColor: 'var(--bg)',
                  borderColor: 'var(--bg-border)',
                  color: 'var(--text-primary)',
                }}
                onBlur={async (e) => {
                  const newLabel = e.target.value.trim() || null
                  if (newLabel === (att.label ?? null)) return
                  await fetch(`/api/assets/${assetId}/attachments/${att.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ label: newLabel }),
                  })
                }}
              />

              {/* Description */}
              <textarea
                defaultValue={att.description ?? ''}
                placeholder="Describe what this file is for…"
                maxLength={500}
                rows={2}
                className="w-full resize-none rounded-md border px-2.5 py-1 text-xs outline-none transition-colors focus:[border-color:var(--accent)] placeholder:[color:var(--text-secondary)]"
                style={{
                  backgroundColor: 'var(--bg)',
                  borderColor: 'var(--bg-border)',
                  color: 'var(--text-primary)',
                }}
                onBlur={async (e) => {
                  const newDesc = e.target.value.trim() || null
                  if (newDesc === (att.description ?? null)) return
                  await fetch(`/api/assets/${assetId}/attachments/${att.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ description: newDesc }),
                  })
                }}
              />

              {/* Delete */}
              <div className="flex items-center gap-2">
                {isConfirming ? (
                  <>
                    <span className="text-xs text-red-400">Remove this file?</span>
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => void handleDelete(att.id, assetId)}
                      className="text-xs text-red-400 underline disabled:opacity-50"
                    >
                      {isDeleting ? 'Removing…' : 'Yes, remove'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="text-xs"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(att.id)}
                    className="text-xs transition-opacity hover:opacity-70"
                    style={{ color: '#ef4444' }}
                  >
                    🗑 Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
