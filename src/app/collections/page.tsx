import { Suspense } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { getPublicCollections } from '@/lib/data/collections'
import { CollectionsBrowseClient } from '@/components/collections/CollectionsBrowseClient'

export default async function CollectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>
}) {
  const { sort } = await searchParams
  const sortBy = sort === 'newest' ? 'newest' : 'popular'

  const collections = await getPublicCollections(sortBy)

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">

        {/* Heading */}
        <div className="mb-8">
          <h1
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
            className="text-3xl font-bold tracking-tight"
          >
            Collections
          </h1>
          <p style={{ color: 'var(--text-secondary)' }} className="mt-2 text-sm">
            Curated lists of AI assets by the community.
          </p>
        </div>

        <Suspense>
          <CollectionsBrowseClient collections={collections} currentSort={sortBy} />
        </Suspense>

        {collections.length === 0 && (
          <div
            className="rounded-xl border py-16 text-center"
            style={{ borderColor: 'var(--bg-border)' }}
          >
            <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
              No collections yet. Be the first to create one!
            </p>
            <Link
              href="/explore"
              style={{ color: 'var(--accent)' }}
              className="mt-2 inline-block text-sm hover:underline"
            >
              Browse the gallery →
            </Link>
          </div>
        )}
      </main>
    </>
  )
}
