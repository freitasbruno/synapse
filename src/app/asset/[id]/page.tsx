import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { SequenceRenderer } from '@/components/asset/SequenceRenderer'
import { ViewTracker } from '@/components/asset/ViewTracker'
import { TagBadge } from '@/components/ui/TagBadge'
import { ActionButtons } from '@/components/ui/ActionButtons'
import { StarButton } from '@/components/ui/StarButton'
import { GoldBadge } from '@/components/ui/GoldBadge'
import { ValidationToggle } from '@/components/ui/ValidationToggle'
import { CommentSection } from '@/components/asset/CommentSection'
import { formatCount } from '@/lib/utils/format'
import { getAssetById, getStarStatus } from '@/lib/data/assets'
import { getCommentsByAsset } from '@/lib/data/comments'
import { getCurrentUser } from '@/lib/auth/session'
import type { AssetRow } from '@/lib/data/assets'

// ─── badge configs ────────────────────────────────────────────────────────────

const TYPE_STYLES: Record<AssetRow['type'], string> = {
  prompt:   'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
  agent:    'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  app:      'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  workflow: 'bg-violet-500/20 text-violet-400 border border-violet-500/30',
}
const TYPE_LABELS: Record<AssetRow['type'], string> = {
  prompt: 'Prompt', agent: 'Agent', app: 'App', workflow: 'Workflow',
}

// ─── icons ────────────────────────────────────────────────────────────────────

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

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function AssetPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [asset, user] = await Promise.all([getAssetById(id), getCurrentUser()])

  if (!asset) notFound()

  // Defence-in-depth: private assets are only visible to the creator
  if (asset.visibility === 'private' && user?.id !== asset.creator_id) notFound()

  const isAuthenticated = Boolean(user)
  const isManager = user?.role === 'manager'
  const canEdit = isManager || user?.id === asset.creator_id

  const [comments, initialStarred] = await Promise.all([
    getCommentsByAsset(asset.id),
    user ? getStarStatus(asset.id, user.id) : Promise.resolve(false),
  ])

  return (
    <>
      <Header />
      <ViewTracker id={asset.id} />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">

        {/* ── Back navigation ── */}
        <Link
          href="/explore"
          style={{ color: 'var(--text-secondary)' }}
          className="inline-flex items-center gap-1.5 text-sm transition-colors hover:[color:var(--text-primary)]"
        >
          ← Back to Gallery
        </Link>

        {/* ── Asset header ── */}
        <div className="mt-6">

          {/* Badges row + edit button */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_STYLES[asset.type]}`}>
                {TYPE_LABELS[asset.type]}
              </span>
              {asset.is_manager_validated && <GoldBadge />}
            </div>
            {canEdit && (
              <Link
                href={`/asset/${asset.id}/edit`}
                style={{ borderColor: 'var(--bg-border)', color: 'var(--text-secondary)' }}
                className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:[border-color:var(--accent)] hover:[color:var(--accent)]"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit Asset
              </Link>
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

          {/* Tags */}
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
            <StarButton
              assetId={asset.id}
              initialStarCount={asset.star_count}
              initialStarred={initialStarred}
              isAuthenticated={isAuthenticated}
              size={14}
            />
            <span className="flex items-center gap-1.5">
              <CommentIcon />
              {formatCount(asset.comment_count)}
            </span>
            <span className="flex items-center gap-1.5">
              <ViewIcon />
              {formatCount(asset.view_count)}
            </span>
          </div>

          {/* Manager controls — server-side gated, never shown to non-managers */}
          {isManager && (
            <ValidationToggle
              assetId={asset.id}
              initialValidated={asset.is_manager_validated}
            />
          )}

          {/* Action buttons */}
          <div className="mt-5">
            <ActionButtons content={asset.content} externalUrl={asset.external_url} />
          </div>

          {/* Divider */}
          <hr style={{ borderColor: 'var(--bg-border)' }} className="mt-8" />
        </div>

        {/* ── Content sequence ── */}
        <div className="mt-8">
          <SequenceRenderer blocks={asset.description_sequence} />
        </div>

        {/* ── Comments ── */}
        <div className="mt-16">
          <hr style={{ borderColor: 'var(--bg-border)' }} className="mb-8" />
          <CommentSection
            assetId={asset.id}
            initialComments={comments}
            currentUser={
              user
                ? { id: user.id, display_name: user.display_name, role: user.role }
                : null
            }
          />
        </div>

      </main>
    </>
  )
}
