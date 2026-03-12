'use client'

import { useState } from 'react'
import Link from 'next/link'
import { getFileTypeIcon, formatFileSize } from '@/lib/attachments/config'
import type { AssetAttachment } from '@/lib/types/database'

interface Props {
  assetId: string
  attachments: AssetAttachment[]
  isAuthenticated: boolean
}

export function AttachmentList({ assetId, attachments, isAuthenticated }: Props) {
  if (attachments.length === 0) return null

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          📎 Attachments
        </h2>
        <span
          className="rounded-full px-2 py-0.5 text-xs font-medium"
          style={{
            backgroundColor: 'var(--bg)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--bg-border)',
          }}
        >
          {attachments.length}
        </span>
      </div>

      {/* Attachment cards */}
      {attachments.map((att) => (
        <AttachmentCard
          key={att.id}
          attachment={att}
          assetId={assetId}
          isAuthenticated={isAuthenticated}
        />
      ))}
    </div>
  )
}

function AttachmentCard({
  attachment,
  assetId,
  isAuthenticated,
}: {
  attachment: AssetAttachment
  assetId: string
  isAuthenticated: boolean
}) {
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/assets/${assetId}/attachments/${attachment.id}/download`,
      )
      if (!res.ok) throw new Error('Failed to get download URL')
      const data = (await res.json()) as { url: string; filename: string }
      const a = document.createElement('a')
      a.href = data.url
      a.download = data.filename
      a.click()
    } catch (err) {
      console.error('[AttachmentList] download error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="flex items-start gap-4 rounded-xl border p-4"
      style={{ borderColor: 'var(--bg-border)', backgroundColor: 'var(--bg-surface)' }}
    >
      {/* Icon */}
      <span className="mt-0.5 shrink-0 text-2xl">
        {getFileTypeIcon(attachment.mime_type)}
      </span>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {attachment.filename}
        </p>
        {attachment.label && (
          <p className="mt-0.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
            {attachment.label}
          </p>
        )}
        {attachment.description && (
          <p
            className="mt-1 line-clamp-2 text-xs leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            {attachment.description}
          </p>
        )}
        <p className="mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
          {formatFileSize(attachment.size_bytes)}
          {attachment.download_count > 0 && (
            <>
              {' · '}
              {attachment.download_count}{' '}
              {attachment.download_count === 1 ? 'download' : 'downloads'}
            </>
          )}
        </p>
      </div>

      {/* Download button */}
      <div className="shrink-0">
        {isAuthenticated ? (
          <button
            type="button"
            onClick={() => void handleDownload()}
            disabled={loading}
            style={{ borderColor: 'var(--bg-border)', color: 'var(--text-secondary)' }}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all hover:[border-color:var(--accent)] hover:[color:var(--accent)] disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="inline-block h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                Loading…
              </>
            ) : (
              '⬇ Download'
            )}
          </button>
        ) : (
          <Link
            href="/auth/signin"
            className="inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:opacity-80"
            style={{ borderColor: 'var(--bg-border)', color: 'var(--text-secondary)' }}
          >
            Sign in to download
          </Link>
        )}
      </div>
    </div>
  )
}
