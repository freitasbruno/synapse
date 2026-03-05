'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatCount } from '@/lib/utils/format'
import { TagBadge } from '@/components/ui/TagBadge'
import { ActionButtons } from '@/components/ui/ActionButtons'
import { StarButton } from '@/components/ui/StarButton'
import type { AssetPreview } from '@/lib/data/assets'

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

export function AssetCard({ asset, isAuthenticated = false }: { asset: AssetPreview; isAuthenticated?: boolean }) {
  const router = useRouter()
  const visibleTags = asset.tags.slice(0, 3)
  const extraTagCount = asset.tags.length - 3

  return (
    <article
      onClick={() => router.push(`/asset/${asset.id}`)}
      onKeyDown={(e) => { if (e.key === 'Enter') router.push(`/asset/${asset.id}`) }}
      role="link"
      tabIndex={0}
      aria-label={asset.title}
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--bg-border)',
      }}
      className="flex h-full cursor-pointer flex-col rounded-xl border p-4 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:[border-color:var(--accent)]"
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

      {/* ── title — real link for accessibility/keyboard ── */}
      <h3 className="mb-2 line-clamp-2 text-sm font-semibold leading-snug">
        <Link
          href={`/asset/${asset.id}`}
          onClick={(e) => e.stopPropagation()}
          style={{ color: 'var(--text-primary)' }}
          className="hover:underline"
        >
          {asset.title}
        </Link>
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
            <TagBadge key={tag} label={tag} clickable />
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
        <StarButton
          assetId={asset.id}
          initialStarCount={asset.star_count}
          initialStarred={false}
          isAuthenticated={isAuthenticated}
          size={13}
        />
        <span className="flex items-center gap-1">
          <CommentIcon />
          {formatCount(asset.comment_count)}
        </span>
        <span className="flex items-center gap-1">
          <ViewIcon />
          {formatCount(asset.view_count)}
        </span>
      </div>

      {/* ── compact action buttons ── */}
      {(asset.content ?? asset.external_url) && (
        <div className="mt-3">
          <ActionButtons
            content={asset.content}
            externalUrl={asset.external_url}
            compact
          />
        </div>
      )}
    </article>
  )
}
