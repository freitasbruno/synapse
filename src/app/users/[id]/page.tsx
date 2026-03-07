import { notFound, redirect } from 'next/navigation'
import Image from 'next/image'
import { Header } from '@/components/layout/Header'
import { getCurrentUser } from '@/lib/auth/session'
import { getUserById } from '@/lib/data/users'
import { getPublishedAssetsByCreator } from '@/lib/data/assets'
import { getFollowCounts, isFollowing } from '@/lib/data/follows'
import { AssetCard } from '@/components/gallery/AssetCard'
import { FollowButton } from '@/components/ui/FollowButton'

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

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [profileUser, currentUser] = await Promise.all([getUserById(id), getCurrentUser()])

  if (!profileUser) notFound()
  if (currentUser?.id === profileUser.id) redirect('/profile')

  const [followCounts, assets, initialFollowing] = await Promise.all([
    getFollowCounts(profileUser.id),
    getPublishedAssetsByCreator(profileUser.id),
    currentUser ? isFollowing(currentUser.id, profileUser.id) : Promise.resolve(false),
  ])

  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* ── Profile header ── */}
        <div
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--bg-border)' }}
          className="mb-8 flex flex-wrap items-start gap-5 rounded-2xl border p-6"
        >
          {profileUser.photo_url ? (
            <Image
              src={profileUser.photo_url}
              alt={profileUser.display_name}
              width={64}
              height={64}
              unoptimized
              referrerPolicy="no-referrer"
              className="shrink-0 rounded-full"
            />
          ) : (
            <InitialsAvatar name={profileUser.display_name} />
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 style={{ color: 'var(--text-primary)' }} className="text-xl font-bold">
                {profileUser.display_name}
              </h1>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  profileUser.role === 'manager'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-indigo-500/20 text-indigo-400'
                }`}
              >
                {profileUser.role === 'manager' ? 'Manager' : 'Member'}
              </span>
            </div>

            {profileUser.bio && (
              <p
                style={{ color: 'var(--text-secondary)' }}
                className="mt-2 text-sm leading-relaxed"
              >
                {profileUser.bio}
              </p>
            )}

            {profileUser.technical_focus && (
              <p style={{ color: 'var(--text-secondary)' }} className="mt-1 text-sm">
                <span style={{ color: 'var(--text-primary)' }} className="font-medium">
                  Focus:
                </span>{' '}
                {profileUser.technical_focus}
              </p>
            )}

            <p style={{ color: 'var(--text-secondary)' }} className="mt-2 text-sm">
              {followCounts.followers} {followCounts.followers === 1 ? 'follower' : 'followers'}{' '}
              · {followCounts.following} following
            </p>

            <div className="mt-3">
              <FollowButton
                targetUserId={profileUser.id}
                initialFollowing={initialFollowing}
                initialFollowerCount={followCounts.followers}
                isAuthenticated={!!currentUser}
              />
            </div>
          </div>
        </div>

        {/* ── Assets grid ── */}
        {assets.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }} className="text-center text-sm">
            No published assets yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {assets.map((asset) => (
              <AssetCard key={asset.id} asset={asset} isAuthenticated={!!currentUser} />
            ))}
          </div>
        )}
      </main>
    </>
  )
}
