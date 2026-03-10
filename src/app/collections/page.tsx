import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { getCurrentUser } from '@/lib/auth/session'
import { getCollectionsByUser, createCollection, deleteCollection } from '@/lib/data/collections'
import { NewCollectionForm } from '@/components/collections/NewCollectionForm'
import { DeleteCollectionButton } from '@/components/collections/DeleteCollectionButton'

export default async function CollectionsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/signin')

  const collections = await getCollectionsByUser(user.id)

  async function createMyCollection(formData: FormData) {
    'use server'
    const current = await getCurrentUser()
    if (!current) redirect('/auth/signin')
    const title = (formData.get('title') as string)?.trim()
    if (!title) return
    const description = (formData.get('description') as string)?.trim() || null
    await createCollection({ userId: current.id, title, description })
    redirect('/collections')
  }

  async function deleteMyCollection(formData: FormData) {
    'use server'
    const current = await getCurrentUser()
    if (!current) redirect('/auth/signin')
    const id = formData.get('collectionId') as string
    await deleteCollection(id)
    redirect('/collections')
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">

        {/* Header row */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 style={{ color: 'var(--text-primary)' }} className="text-xl font-bold">
              My Collections
            </h1>
            <p style={{ color: 'var(--text-secondary)' }} className="mt-0.5 text-sm">
              {collections.length} {collections.length === 1 ? 'collection' : 'collections'}
            </p>
          </div>
          <NewCollectionForm action={createMyCollection} />
        </div>

        {/* Collection list */}
        {collections.length > 0 ? (
          <div
            className="overflow-hidden rounded-xl border"
            style={{ borderColor: 'var(--bg-border)' }}
          >
            {collections.map((col, i) => (
              <div
                key={col.id}
                className="flex items-center gap-4 px-5 py-4"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderTop: i > 0 ? '1px solid var(--bg-border)' : undefined,
                }}
              >
                {/* Info */}
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/collections/${col.id}`}
                    className="text-sm font-semibold hover:underline"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {col.title}
                  </Link>
                  {col.description && (
                    <p
                      className="mt-0.5 line-clamp-1 text-xs"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {col.description}
                    </p>
                  )}
                  <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {col.asset_count} {col.asset_count === 1 ? 'asset' : 'assets'}
                    {' · '}
                    <span className="inline-flex items-center gap-0.5">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      {col.star_count}
                    </span>
                  </p>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-4">
                  <Link
                    href={`/collections/${col.id}`}
                    className="text-xs transition-opacity hover:opacity-70"
                    style={{ color: 'var(--accent)' }}
                  >
                    Open →
                  </Link>
                  <DeleteCollectionButton
                    collectionId={col.id}
                    collectionTitle={col.title}
                    action={deleteMyCollection}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{ borderColor: 'var(--bg-border)' }}
            className="rounded-xl border py-16 text-center"
          >
            <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
              No collections yet. Create one to start organising assets.
            </p>
          </div>
        )}

      </main>
    </>
  )
}
