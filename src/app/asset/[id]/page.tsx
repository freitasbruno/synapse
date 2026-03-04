import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { SequenceRenderer } from '@/components/asset/SequenceRenderer'
import { ViewTracker } from '@/components/asset/ViewTracker'
import { TagBadge } from '@/components/ui/TagBadge'
import { formatCount } from '@/lib/utils/format'
import { getAssetById } from '@/lib/data/assets'
import type { AssetRow } from '@/lib/data/assets'

// ─── badge configs (mirrors AssetCard, defined locally per constraint) ────────

const TYPE_STYLES: Record<AssetRow['type'], string> = {
  prompt:   'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
  tool:     'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  app:      'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  workflow: 'bg-violet-500/20 text-violet-400 border border-violet-500/30',
}
const TYPE_LABELS: Record<AssetRow['type'], string> = {
  prompt: 'Prompt', tool: 'Tool', app: 'App', workflow: 'Workflow',
}

// ─── icons (inline SVG) ───────────────────────────────────────────────────────

function StarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}
function CommentIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}
function ViewIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
function ShieldCheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  )
}
function ExternalLinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function AssetPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const asset = await getAssetById(id)

  if (!asset) notFound()

  return (
    <>
      <Header />
      <ViewTracker id={asset.id} />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">

        {/* ── Back navigation ── */}
        <Link
          href="/"
          style={{ color: 'var(--text-secondary)' }}
          className="inline-flex items-center gap-1.5 text-sm transition-colors hover:[color:var(--text-primary)]"
        >
          ← Back to Gallery
        </Link>

        {/* ── Asset header ── */}
        <div className="mt-6">

          {/* Badges row */}
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_STYLES[asset.type]}`}>
              {TYPE_LABELS[asset.type]}
            </span>
            {asset.is_manager_validated && (
              <span
                title="Verified by Synapse managers"
                className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium text-amber-400"
                style={{ borderColor: 'rgb(251 191 36 / 0.3)', backgroundColor: 'rgb(251 191 36 / 0.1)' }}
              >
                <ShieldCheckIcon />
                Verified
              </span>
            )}
          </div>

          {/* Title */}
          <h1
            style={{ color: 'var(--text-primary)' }}
            className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl"
          >
            {asset.title}
          </h1>

          {/* Description */}
          {asset.description && (
            <p
              style={{ color: 'var(--text-secondary)' }}
              className="mt-3 text-lg leading-relaxed"
            >
              {asset.description}
            </p>
          )}

          {/* Tags — all tags, each clickable */}
          {asset.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {asset.tags.map((tag) => (
                <TagBadge key={tag} label={tag} clickable />
              ))}
            </div>
          )}

          {/* Metadata row */}
          <div
            style={{ color: 'var(--text-secondary)' }}
            className="mt-5 flex items-center gap-5 text-sm"
          >
            <button
              title="Sign in to star this asset"
              style={{ color: 'var(--text-secondary)' }}
              className="flex items-center gap-1.5 hover:opacity-70"
            >
              <StarIcon />
              {formatCount(asset.star_count)}
            </button>
            <span className="flex items-center gap-1.5">
              <CommentIcon />
              {formatCount(asset.comment_count)}
            </span>
            <span className="flex items-center gap-1.5">
              <ViewIcon />
              {formatCount(asset.view_count)}
            </span>
          </div>

          {/* External link */}
          {asset.external_url && (
            <a
              href={asset.external_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ backgroundColor: 'var(--accent)', color: '#ffffff' }}
              className="mt-5 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
            >
              Visit Resource
              <ExternalLinkIcon />
            </a>
          )}

          {/* Divider */}
          <hr
            style={{ borderColor: 'var(--bg-border)' }}
            className="mt-8"
          />
        </div>

        {/* ── Content sequence ── */}
        <div className="mt-8">
          <SequenceRenderer blocks={asset.description_sequence} />
        </div>

        {/* ── Comments placeholder ── */}
        <div className="mt-16">
          <hr style={{ borderColor: 'var(--bg-border)' }} className="mb-8" />
          <h2
            style={{ color: 'var(--text-primary)' }}
            className="text-xl font-semibold"
          >
            Discussion
          </h2>
          <p style={{ color: 'var(--text-secondary)' }} className="mt-2 text-sm">
            Comments coming soon.
          </p>
        </div>

      </main>
    </>
  )
}
