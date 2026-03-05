import { Suspense } from 'react'
import { Header } from '@/components/layout/Header'
import { GalleryClient } from '@/components/gallery/GalleryClient'
import { getPublishedAssets, getAllTags } from '@/lib/data/assets'
import { getSession } from '@/lib/auth/session'

// GalleryClient uses useSearchParams() — Suspense boundary required.
function GalleryFallback() {
  return (
    <div
      style={{ color: 'var(--text-secondary)' }}
      className="flex min-h-[40vh] items-center justify-center text-sm"
    >
      Loading gallery…
    </div>
  )
}

export default async function ExplorePage() {
  const [assets, allTags, session] = await Promise.all([
    getPublishedAssets(),
    getAllTags(),
    getSession(),
  ])
  const isAuthenticated = Boolean(session)

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <h1
            style={{ color: 'var(--text-primary)' }}
            className="text-2xl font-bold tracking-tight"
          >
            Discovery Gallery
          </h1>
          <p style={{ color: 'var(--text-secondary)' }} className="mt-1 text-sm">
            Explore community-built prompts, tools, apps, and workflows.
          </p>
        </div>

        <Suspense fallback={<GalleryFallback />}>
          <GalleryClient assets={assets} allTags={allTags} isAuthenticated={isAuthenticated} />
        </Suspense>
      </main>
    </>
  )
}
