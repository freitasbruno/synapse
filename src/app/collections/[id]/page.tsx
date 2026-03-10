import { redirect } from 'next/navigation'
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

  const collection = await getCollectionById(id)

  // Silently redirect if not found or access denied (RLS blocks non-owners/non-managers)
  if (!collection) redirect('/')

  const isOwner = user?.id === collection.user_id
  const isManager = user?.role === 'manager'

  // Only owner and managers may view
  if (!isOwner && !isManager) redirect('/')

  const isAuthenticated = Boolean(user)

  const assets = await getCollectionAssets(id)

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
          href="/profile#collections"
          style={{ color: 'var(--text-secondary)' }}
          className="inline-flex items-center gap-1.5 text-sm transition-colors hover:[color:var(--text-primary)]"
        >
          ← My Collections
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
              isAuthenticated={isAuthenticated}
            />
          )}
        </div>

      </main>
    </>
  )
}
