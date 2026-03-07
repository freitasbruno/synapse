import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { getCurrentUser } from '@/lib/auth/session'
import { getFollowingIds } from '@/lib/data/follows'
import { getFeedAssets } from '@/lib/data/assets'
import { AssetCard } from '@/components/gallery/AssetCard'

export default async function FeedPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/signin')

  const followingIds = await getFollowingIds(user.id)
  const assets = followingIds.length ? await getFeedAssets(followingIds) : []

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 style={{ color: 'var(--text-primary)' }} className="text-2xl font-bold">
            Following
          </h1>
          <p style={{ color: 'var(--text-secondary)' }} className="mt-1 text-sm">
            Latest from creators you follow
          </p>
        </div>

        {assets.length === 0 ? (
          <div className="py-16 text-center">
            {followingIds.length === 0 ? (
              <>
                <p style={{ color: 'var(--text-secondary)' }} className="mb-3 text-sm">
                  You&apos;re not following anyone yet.
                </p>
                <Link
                  href="/gallery"
                  className="text-sm font-medium hover:underline"
                  style={{ color: 'var(--accent)' }}
                >
                  Browse the gallery to find creators
                </Link>
              </>
            ) : (
              <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
                The creators you follow haven&apos;t published anything yet.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {assets.map((asset) => (
              <AssetCard key={asset.id} asset={asset} isAuthenticated />
            ))}
          </div>
        )}
      </main>
    </>
  )
}
