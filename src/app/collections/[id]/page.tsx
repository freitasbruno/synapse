import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { getCurrentUser } from '@/lib/auth/session'
import { getCollectionById, getCollectionAssets } from '@/lib/data/collections'
import { SortableAssetGrid } from '@/components/collections/SortableAssetGrid'
import { CollectionHeaderActions } from '@/components/collections/CollectionHeaderActions'
import { CollectionStarButton } from '@/components/collections/CollectionStarButton'
import { createClient } from '@/lib/supabase/server'

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getCurrentUser()

  const [collection, assets] = await Promise.all([
    getCollectionById(id, user?.id),
    getCollectionAssets(id),
  ])

  if (!collection) notFound()

  const isOwner = user?.id === collection.user_id
  const isAuthenticated = Boolean(user)

  // Get initial star status for authenticated users
  let initialStarred = false
  if (user) {
    const supabase = await createClient()
    const starId = `${user.id}_${collection.id}`
    const { data } = await supabase
      .from('collection_stars')
      .select('id')
      .eq('id', starId)
      .single()
    initialStarred = Boolean(data)
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">

        {/* Back link */}
        <Link
          href="/collections"
          style={{ color: 'var(--text-secondary)' }}
          className="inline-flex items-center gap-1.5 text-sm transition-colors hover:[color:var(--text-primary)]"
        >
          ← Collections
        </Link>

        {/* Collection header */}
        <div className="mt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
                className="text-3xl font-bold tracking-tight"
              >
                {collection.title}
              </h1>

              {collection.description && (
                <p
                  style={{ color: 'var(--text-secondary)' }}
                  className="mt-2 text-base leading-relaxed"
                >
                  {collection.description}
                </p>
              )}

              {/* Meta row */}
              <div
                style={{ color: 'var(--text-secondary)' }}
                className="mt-4 flex flex-wrap items-center gap-4 text-sm"
              >
                <span>by {collection.creator_name}</span>

                <span
                  className="rounded-full px-2 py-0.5 text-xs font-medium"
                  style={
                    collection.visibility === 'public'
                      ? { backgroundColor: 'rgba(34,197,94,0.12)', color: '#22c55e' }
                      : { backgroundColor: 'rgba(99,102,241,0.12)', color: '#818cf8' }
                  }
                >
                  {collection.visibility === 'public' ? '🌐 Public' : '🔒 Private'}
                </span>

                <span>{collection.asset_count} {collection.asset_count === 1 ? 'asset' : 'assets'}</span>

                <CollectionStarButton
                  collectionId={collection.id}
                  initialStarCount={collection.star_count}
                  initialStarred={initialStarred}
                  isAuthenticated={isAuthenticated}
                />
              </div>
            </div>
          </div>

          {/* Owner actions */}
          {isOwner && (
            <CollectionHeaderActions
              collectionId={collection.id}
              initialTitle={collection.title}
              initialDescription={collection.description}
              initialVisibility={collection.visibility}
            />
          )}
        </div>

        {/* Asset grid */}
        <div className="mt-10">
          {assets.length === 0 ? (
            <div
              className="rounded-xl border py-16 text-center"
              style={{ borderColor: 'var(--bg-border)' }}
            >
              <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
                This collection has no assets yet.
              </p>
              {isOwner && (
                <Link
                  href="/explore"
                  style={{ color: 'var(--accent)' }}
                  className="mt-2 inline-block text-sm hover:underline"
                >
                  Browse the gallery to add assets →
                </Link>
              )}
            </div>
          ) : (
            <SortableAssetGrid
              initialAssets={assets}
              collectionId={collection.id}
              isOwner={isOwner}
            />
          )}
        </div>

      </main>
    </>
  )
}
