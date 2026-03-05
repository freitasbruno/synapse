import Image from 'next/image'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/session'
import { updateUser } from '@/lib/data/users'

export default async function OnboardingPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/')

  async function submitProfile(formData: FormData) {
    'use server'
    const current = await getCurrentUser()
    if (!current) redirect('/')

    const displayName = (formData.get('display_name') as string).trim()
    const bio = (formData.get('bio') as string).trim() || null
    const technicalFocus = (formData.get('technical_focus') as string).trim() || null

    await updateUser(current.id, {
      display_name: displayName || current.display_name,
      bio,
      technical_focus: technicalFocus,
      profile_complete: true,
    })

    redirect('/')
  }

  async function skipProfile() {
    'use server'
    const current = await getCurrentUser()
    if (!current) redirect('/')
    await updateUser(current.id, { profile_complete: true })
    redirect('/')
  }

  return (
    <div
      style={{ backgroundColor: 'var(--bg)', color: 'var(--text-primary)' }}
      className="flex min-h-screen items-center justify-center px-4"
    >
      <div
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--bg-border)' }}
        className="w-full max-w-lg rounded-2xl border p-8"
      >
        {/* Logo */}
        <div className="mb-6 flex flex-col items-center gap-2">
          <Image src="/icon.svg" alt="Synapse" width={75} height={106} priority />
          <span style={{ color: 'var(--text-primary)' }} className="text-2xl font-bold tracking-tight">Synapse</span>
        </div>
        {/* Header */}
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome to Synapse
        </h1>
        <p style={{ color: 'var(--text-secondary)' }} className="mt-2 text-sm">
          Tell us a bit about yourself to complete your profile.
        </p>

        {/* Form */}
        <form action={submitProfile} className="mt-8 space-y-5">

          {/* Display name */}
          <div>
            <label
              htmlFor="display_name"
              style={{ color: 'var(--text-secondary)' }}
              className="mb-1.5 block text-sm font-medium"
            >
              Display name
            </label>
            <input
              id="display_name"
              name="display_name"
              type="text"
              defaultValue={user.display_name}
              required
              maxLength={80}
              style={{
                backgroundColor: 'var(--bg)',
                borderColor: 'var(--bg-border)',
                color: 'var(--text-primary)',
              }}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:[border-color:var(--accent)]"
            />
          </div>

          {/* Bio */}
          <div>
            <label
              htmlFor="bio"
              style={{ color: 'var(--text-secondary)' }}
              className="mb-1.5 block text-sm font-medium"
            >
              Short bio{' '}
              <span style={{ color: 'var(--text-secondary)' }} className="font-normal">
                (optional, max 200 chars)
              </span>
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

          {/* Technical focus */}
          <div>
            <label
              htmlFor="technical_focus"
              style={{ color: 'var(--text-secondary)' }}
              className="mb-1.5 block text-sm font-medium"
            >
              Technical focus{' '}
              <span style={{ color: 'var(--text-secondary)' }} className="font-normal">
                (optional)
              </span>
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

          {/* Submit */}
          <button
            type="submit"
            style={{ backgroundColor: 'var(--accent)', color: '#ffffff' }}
            className="mt-2 w-full rounded-lg py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
          >
            Complete Profile
          </button>
        </form>

        {/* Skip */}
        <form action={skipProfile} className="mt-4 text-center">
          <button
            type="submit"
            style={{ color: 'var(--text-secondary)' }}
            className="text-sm transition-colors hover:[color:var(--text-primary)]"
          >
            Skip for now →
          </button>
        </form>
      </div>
    </div>
  )
}
