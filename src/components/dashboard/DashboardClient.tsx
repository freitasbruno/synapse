'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatCount } from '@/lib/utils/format'
import type { AssetRow } from '@/lib/data/assets'

// ─── badge helpers ────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<AssetRow['type'], string> = {
  prompt: 'Prompt',
  tool: 'Tool',
  app: 'App',
  workflow: 'Workflow',
}

const TYPE_STYLES: Record<AssetRow['type'], string> = {
  prompt: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
  tool: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  app: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  workflow: 'bg-violet-500/20 text-violet-400 border border-violet-500/30',
}

function StatusBadge({ status }: { status: AssetRow['status'] }) {
  if (status === 'published') {
    return (
      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
        Published
      </span>
    )
  }
  return (
    <span
      className="rounded-full border px-2 py-0.5 text-xs font-medium"
      style={{ borderColor: 'var(--bg-border)', color: 'var(--text-secondary)' }}
    >
      Draft
    </span>
  )
}

// ─── DeleteModal ──────────────────────────────────────────────────────────────

function DeleteModal({
  assetTitle,
  onConfirm,
  onCancel,
  deleting,
}: {
  assetTitle: string
  onConfirm: () => void
  onCancel: () => void
  deleting: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div
        className="w-full max-w-sm rounded-2xl border p-6 shadow-xl"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--bg-border)' }}
      >
        <h2 style={{ color: 'var(--text-primary)' }} className="text-lg font-bold">
          Delete Asset?
        </h2>
        <p style={{ color: 'var(--text-secondary)' }} className="mt-2 text-sm leading-relaxed">
          &ldquo;{assetTitle}&rdquo; will be permanently deleted. This action cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            style={{ borderColor: 'var(--bg-border)', color: 'var(--text-primary)' }}
            className="rounded-lg border px-4 py-2 text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── DashboardClient ──────────────────────────────────────────────────────────

interface DashboardClientProps {
  assets: AssetRow[]
}

export function DashboardClient({ assets: initialAssets }: DashboardClientProps) {
  const [assets, setAssets] = useState(initialAssets)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const confirmAsset = assets.find((a) => a.id === confirmId)

  async function handleDelete() {
    if (!confirmId) return
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from('assets').delete().eq('id', confirmId)
    if (error) {
      console.error('[dashboard] delete error:', error.message)
      setDeleting(false)
      return
    }
    setAssets((prev) => prev.filter((a) => a.id !== confirmId))
    setConfirmId(null)
    setDeleting(false)
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (assets.length === 0) {
    return (
      <div className="py-20 text-center">
        <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
          You haven&apos;t created any assets yet.{' '}
          <Link href="/submit" style={{ color: 'var(--accent)' }} className="hover:underline">
            Create your first one →
          </Link>
        </p>
      </div>
    )
  }

  // ── Asset list ────────────────────────────────────────────────────────────
  return (
    <>
      <div className="overflow-hidden rounded-xl border" style={{ borderColor: 'var(--bg-border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr
              style={{ borderBottomColor: 'var(--bg-border)', backgroundColor: 'var(--bg-surface)' }}
              className="border-b"
            >
              {['Title', 'Type', 'Status', 'Stars', 'Created', 'Actions'].map((h) => (
                <th
                  key={h}
                  style={{ color: 'var(--text-secondary)' }}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {assets.map((asset, idx) => (
              <tr
                key={asset.id}
                style={{
                  borderTopColor: idx > 0 ? 'var(--bg-border)' : undefined,
                }}
                className={idx > 0 ? 'border-t' : ''}
              >
                {/* Title */}
                <td className="px-4 py-3">
                  <span
                    style={{ color: 'var(--text-primary)' }}
                    className="line-clamp-1 font-medium"
                  >
                    {asset.title}
                  </span>
                </td>

                {/* Type */}
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_STYLES[asset.type]}`}
                  >
                    {TYPE_LABELS[asset.type]}
                  </span>
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <StatusBadge status={asset.status} />
                </td>

                {/* Stars */}
                <td className="px-4 py-3">
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {formatCount(asset.star_count)}
                  </span>
                </td>

                {/* Created */}
                <td className="px-4 py-3">
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {new Date(asset.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/asset/${asset.id}/edit`}
                      style={{ color: 'var(--accent)' }}
                      className="text-xs font-medium hover:underline"
                    >
                      Edit
                    </Link>
                    {asset.status === 'published' && (
                      <Link
                        href={`/asset/${asset.id}`}
                        style={{ color: 'var(--text-secondary)' }}
                        className="text-xs font-medium hover:underline"
                      >
                        View
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => setConfirmId(asset.id)}
                      className="text-xs font-medium text-red-400 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation modal */}
      {confirmId && confirmAsset && (
        <DeleteModal
          assetTitle={confirmAsset.title}
          onConfirm={() => void handleDelete()}
          onCancel={() => setConfirmId(null)}
          deleting={deleting}
        />
      )}
    </>
  )
}
