'use client'

import Link from 'next/link'
import type { AssetPreview } from '@/lib/data/assets'

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

// ─── type badge colours ───────────────────────────────────────────────────────

const TYPE_STYLES: Record<AssetPreview['type'], string> = {
  prompt:   'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
  tool:     'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  app:      'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  workflow: 'bg-violet-500/20 text-violet-400 border border-violet-500/30',
}

const TYPE_LABELS: Record<AssetPreview['type'], string> = {
  prompt:   'Prompt',
  tool:     'Tool',
  app:      'App',
  workflow: 'Workflow',
}

// ─── icons ────────────────────────────────────────────────────────────────────

function StarIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

function CommentIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function ViewIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function ShieldCheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  )
}

// ─── component ────────────────────────────────────────────────────────────────

export function AssetCard({ asset }: { asset: AssetPreview }) {
  const visibleTags = asset.tags.slice(0, 3)
  const extraTagCount = asset.tags.length - 3

  return (
    <Link href={`/asset/${asset.id}`} className="group block h-full">
      <article
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--bg-border)',
        }}
        className="flex h-full flex-col rounded-xl border p-4 transition-all duration-200 group-hover:scale-[1.02] group-hover:shadow-lg group-hover:[border-color:var(--accent)]"
      >
        {/* ── header row ── */}
        <div className="mb-3 flex items-start justify-between gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_STYLES[asset.type]}`}>
            {TYPE_LABELS[asset.type]}
          </span>

          {asset.is_manager_validated && (
            <span
              title="Verified by Synapse managers"
              className="shrink-0 text-amber-400"
            >
              <ShieldCheckIcon />
            </span>
          )}
        </div>

        {/* ── title ── */}
        <h3
          style={{ color: 'var(--text-primary)' }}
          className="mb-2 line-clamp-2 text-sm font-semibold leading-snug"
        >
          {asset.title}
        </h3>

        {/* ── description ── */}
        {asset.description && (
          <p
            style={{ color: 'var(--text-secondary)' }}
            className="mb-3 line-clamp-3 text-xs leading-relaxed"
          >
            {asset.description}
          </p>
        )}

        {/* ── tags ── */}
        {asset.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-1">
            {visibleTags.map((tag) => (
              <span
                key={tag}
                style={{
                  backgroundColor: 'var(--bg)',
                  borderColor: 'var(--bg-border)',
                  color: 'var(--text-secondary)',
                }}
                className="rounded border px-1.5 py-0.5 text-xs"
              >
                #{tag}
              </span>
            ))}
            {extraTagCount > 0 && (
              <span
                style={{ color: 'var(--text-secondary)' }}
                className="text-xs"
              >
                +{extraTagCount} more
              </span>
            )}
          </div>
        )}

        {/* ── spacer ── */}
        <div className="flex-1" />

        {/* ── footer ── */}
        <div
          style={{
            borderTopColor: 'var(--bg-border)',
            color: 'var(--text-secondary)',
          }}
          className="flex items-center gap-4 border-t pt-3 text-xs"
        >
          <span className="flex items-center gap-1">
            <StarIcon />
            {formatCount(asset.star_count)}
          </span>
          <span className="flex items-center gap-1">
            <CommentIcon />
            {formatCount(asset.comment_count)}
          </span>
          <span className="flex items-center gap-1">
            <ViewIcon />
            {formatCount(asset.view_count)}
          </span>
        </div>
      </article>
    </Link>
  )
}
