import { redirect } from 'next/navigation'
import Image from 'next/image'
import { Header } from '@/components/layout/Header'
import { getCurrentUser } from '@/lib/auth/session'
import { updateUser } from '@/lib/data/users'
import { getFollowCounts } from '@/lib/data/follows'
import { DeleteAccountSection } from '@/components/profile/DeleteAccountSection'

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

  const followCounts = await getFollowCounts(user.id)

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

        <DeleteAccountSection />

      </main>
    </>
  )
}
