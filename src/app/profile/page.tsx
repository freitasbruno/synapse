import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Header } from '@/components/layout/Header'
import { getCurrentUser } from '@/lib/auth/session'
import { updateUser } from '@/lib/data/users'
import { getAssetsByCreator } from '@/lib/data/assets'
import { getCollectionsByUser, deleteCollection } from '@/lib/data/collections'
import { getFollowCounts } from '@/lib/data/follows'
import { AssetCard } from '@/components/gallery/AssetCard'
import type { AssetPreview } from '@/lib/data/assets'

// ─── helpers ─────────────────────────────────────────────────────────────────

function InitialsAvatar({ name, size = 64 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundColor: 'var(--accent)',
        color: '#ffffff',
        fontSize: size * 0.35,
      }}
      className="flex shrink-0 items-center justify-center rounded-full font-semibold"
    >
      {initials}
    </div>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function ProfilePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/')

  const [assets, collections, followCounts] = await Promise.all([
    getAssetsByCreator(user.id),
    getCollectionsByUser(user.id),
    getFollowCounts(user.id),
  ])

  async function deleteMyCollection(formData: FormData) {
    'use server'
    const current = await getCurrentUser()
    if (!current) redirect('/')
    const id = formData.get('collectionId') as string
    await deleteCollection(id)
    redirect('/profile#collections')
  }

  async function saveProfile(formData: FormData) {
    'use server'
    const current = await getCurrentUser()
    if (!current) redirect('/')

    const bio = (formData.get('bio') as string).trim() || null
    const technicalFocus = (formData.get('technical_focus') as string).trim() || null

    await updateUser(current.id, { bio, technical_focus: technicalFocus })
    redirect('/profile')
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">

        {/* ── Profile header ── */}
        <div
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--bg-border)' }}
          className="flex items-start gap-5 rounded-2xl border p-6"
        >
          {/* Avatar */}
          {user.photo_url ? (
            <Image
              src={user.photo_url}
              alt={user.display_name}
              width={64}
              height={64}
              unoptimized
              referrerPolicy="no-referrer"
              className="shrink-0 rounded-full"
            />
          ) : (
            <InitialsAvatar name={user.display_name} />
          )}

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1
                style={{ color: 'var(--text-primary)' }}
                className="text-xl font-bold"
              >
                {user.display_name}
              </h1>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  user.role === 'manager'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-indigo-500/20 text-indigo-400'
                }`}
              >
                {user.role === 'manager' ? 'Manager' : 'Member'}
              </span>
            </div>

            <p style={{ color: 'var(--text-secondary)' }} className="mt-0.5 text-sm">
              {user.email}
            </p>

            <p style={{ color: 'var(--text-secondary)' }} className="mt-1 text-sm">
              {followCounts.followers}{' '}
              {followCounts.followers === 1 ? 'follower' : 'followers'} · {followCounts.following}{' '}
              following
            </p>

            {user.bio && (
              <p style={{ color: 'var(--text-secondary)' }} className="mt-2 text-sm leading-relaxed">
                {user.bio}
              </p>
            )}

            {user.technical_focus && (
              <p style={{ color: 'var(--text-secondary)' }} className="mt-1 text-sm">
                <span style={{ color: 'var(--text-primary)' }} className="font-medium">Focus:</span>{' '}
                {user.technical_focus}
              </p>
            )}

            <p style={{ color: 'var(--text-secondary)' }} className="mt-2 text-sm">
              {user.contributions_count}{' '}
              {user.contributions_count === 1 ? 'contribution' : 'contributions'}
            </p>
          </div>
        </div>

        {/* ── Edit profile form ── */}
        <div
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--bg-border)' }}
          className="mt-6 rounded-2xl border p-6"
        >
          <h2 style={{ color: 'var(--text-primary)' }} className="mb-4 text-base font-semibold">
            Edit Profile
          </h2>
          <form action={saveProfile} className="space-y-4">

            <div>
              <label
                htmlFor="bio"
                style={{ color: 'var(--text-secondary)' }}
                className="mb-1.5 block text-sm font-medium"
              >
                Bio{' '}
                <span className="font-normal">(max 200 chars)</span>
              </label>
              <textarea
                id="bio"
                name="bio"
                defaultValue={user.bio ?? ''}
                maxLength={200}
                rows={3}
                style={{
                  backgroundColor: 'var(--bg)',
                  borderColor: 'var(--bg-border)',
                  color: 'var(--text-primary)',
                }}
                className="w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:[border-color:var(--accent)]"
              />
            </div>

            <div>
              <label
                htmlFor="technical_focus"
                style={{ color: 'var(--text-secondary)' }}
                className="mb-1.5 block text-sm font-medium"
              >
                Technical focus
              </label>
              <input
                id="technical_focus"
                name="technical_focus"
                type="text"
                defaultValue={user.technical_focus ?? ''}
                placeholder="e.g. Prompt Engineering, Data Analysis"
                maxLength={120}
                style={{
                  backgroundColor: 'var(--bg)',
                  borderColor: 'var(--bg-border)',
                  color: 'var(--text-primary)',
                }}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:[border-color:var(--accent)] placeholder:[color:var(--text-secondary)]"
              />
            </div>

            <button
              type="submit"
              style={{ backgroundColor: 'var(--accent)', color: '#ffffff' }}
              className="rounded-lg px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
            >
              Save Changes
            </button>
          </form>
        </div>

        {/* ── My collections ── */}
        <div className="mt-10" id="collections">
          <div className="mb-4 flex items-center justify-between">
            <h2 style={{ color: 'var(--text-primary)' }} className="text-lg font-semibold">
              My Collections{' '}
              <span style={{ color: 'var(--text-secondary)' }} className="text-base font-normal">
                ({collections.length})
              </span>
            </h2>
            <Link
              href="/collections/new"
              style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
              className="rounded-lg px-3 py-1.5 text-sm font-medium transition-opacity hover:opacity-90"
            >
              + New Collection
            </Link>
          </div>

          {collections.length > 0 ? (
            <div
              className="overflow-hidden rounded-xl border"
              style={{ borderColor: 'var(--bg-border)' }}
            >
              {collections.map((col, i) => (
                <div
                  key={col.id}
                  className="flex items-center justify-between gap-4 px-4 py-3"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderTop: i > 0 ? '1px solid var(--bg-border)' : undefined,
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/collections/${col.id}`}
                        className="truncate text-sm font-medium hover:underline"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {col.title}
                      </Link>
                      <span
                        className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                        style={
                          col.visibility === 'public'
                            ? { backgroundColor: 'rgba(34,197,94,0.12)', color: '#22c55e' }
                            : { backgroundColor: 'rgba(99,102,241,0.12)', color: '#818cf8' }
                        }
                      >
                        {col.visibility === 'public' ? '🌐' : '🔒'}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {col.asset_count} {col.asset_count === 1 ? 'asset' : 'assets'} · ★ {col.star_count}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Link
                      href={`/collections/${col.id}`}
                      className="text-xs transition-opacity hover:opacity-70"
                      style={{ color: 'var(--accent)' }}
                    >
                      View →
                    </Link>
                    <form action={deleteMyCollection}>
                      <input type="hidden" name="collectionId" value={col.id} />
                      <button
                        type="submit"
                        className="text-xs transition-opacity hover:opacity-70"
                        style={{ color: '#ef4444' }}
                        onClick={(e) => {
                          if (!confirm(`Delete "${col.title}"?`)) e.preventDefault()
                        }}
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{ borderColor: 'var(--bg-border)' }}
              className="rounded-xl border py-10 text-center"
            >
              <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
                You haven&apos;t created any collections yet.
              </p>
            </div>
          )}
        </div>

        {/* ── My assets ── */}
        <div className="mt-10" id="assets">
          <h2 style={{ color: 'var(--text-primary)' }} className="mb-4 text-lg font-semibold">
            My Assets{' '}
            <span style={{ color: 'var(--text-secondary)' }} className="text-base font-normal">
              ({assets.length})
            </span>
          </h2>

          {assets.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {assets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={{ ...asset, creator_display_name: user.display_name } as unknown as AssetPreview}
                  isAuthenticated
                />
              ))}
            </div>
          ) : (
            <div
              style={{ borderColor: 'var(--bg-border)' }}
              className="rounded-xl border py-12 text-center"
            >
              <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
                You haven&apos;t created any assets yet.
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
        </div>

      </main>
    </>
  )
}
