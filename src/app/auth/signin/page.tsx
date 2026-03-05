'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// ─── icons ────────────────────────────────────────────────────────────────────

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('Invalid email or password.')
      setLoading(false)
      return
    }

    // Ensure a users-table row exists (it may be missing if the confirmation email
    // redirect was never set up correctly for this account).
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (authUser) {
      const { data: profile } = await supabase
        .from('users')
        .select('id, profile_complete')
        .eq('auth_id', authUser.id)
        .single()

      if (!profile) {
        // First login via email/password with no profile row — create one and onboard.
        await supabase.from('users').insert({
          auth_id: authUser.id,
          display_name:
            (authUser.user_metadata?.full_name as string | undefined) ??
            authUser.email ??
            'User',
          email: authUser.email ?? '',
          photo_url: (authUser.user_metadata?.avatar_url as string | undefined) ?? null,
        })
        router.push('/onboarding')
        return
      }

      if (!profile.profile_complete) {
        router.push('/onboarding')
        return
      }
    }

    router.push('/')
    router.refresh()
  }

  async function handleGoogleSignIn() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback` },
    })
  }

  const inputStyle = {
    backgroundColor: 'var(--bg)',
    borderColor: 'var(--bg-border)',
    color: 'var(--text-primary)',
  }
  const inputClass =
    'w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:[border-color:var(--accent)] placeholder:[color:var(--text-secondary)]'

  return (
    <div
      style={{ backgroundColor: 'var(--bg)', color: 'var(--text-primary)' }}
      className="flex min-h-screen items-center justify-center px-4"
    >
      <div
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--bg-border)' }}
        className="w-full max-w-md rounded-2xl border p-8"
      >
        {/* Logo */}
        <div className="mb-6 flex flex-col items-center gap-2">
          <Image src="/icon.svg" alt="Synapse" width={75} height={106} priority />
          <span style={{ color: 'var(--text-primary)' }} className="text-2xl font-bold tracking-tight">Synapse</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Sign In</h1>
        <p style={{ color: 'var(--text-secondary)' }} className="mt-1 text-sm">
          Sign in to your Synapse account
        </p>

        {/* ── Email + password form ── */}
        <form onSubmit={(e) => void handleEmailSignIn(e)} className="mt-6 space-y-4">
          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
          )}

          <div>
            <label
              htmlFor="email"
              style={{ color: 'var(--text-secondary)' }}
              className="mb-1.5 block text-sm font-medium"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              className={inputClass}
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label
                htmlFor="password"
                style={{ color: 'var(--text-secondary)' }}
                className="text-sm font-medium"
              >
                Password
              </label>
              <Link
                href="/auth/reset-password"
                style={{ color: 'var(--accent)' }}
                className="text-xs hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
                className={`${inputClass} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{ color: 'var(--text-secondary)' }}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ backgroundColor: 'var(--accent)', color: '#ffffff' }}
            className="mt-2 w-full rounded-lg py-2.5 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        {/* ── Divider ── */}
        <div className="my-6 flex items-center gap-3">
          <hr style={{ borderColor: 'var(--bg-border)' }} className="flex-1" />
          <span style={{ color: 'var(--text-secondary)' }} className="text-xs">or</span>
          <hr style={{ borderColor: 'var(--bg-border)' }} className="flex-1" />
        </div>

        {/* ── Google OAuth ── */}
        <button
          onClick={() => void handleGoogleSignIn()}
          style={{
            borderColor: 'var(--bg-border)',
            color: 'var(--text-primary)',
            backgroundColor: 'var(--bg)',
          }}
          className="flex w-full items-center justify-center gap-3 rounded-lg border py-2.5 text-sm font-medium transition-opacity hover:opacity-80"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        {/* ── Footer ── */}
        <p style={{ color: 'var(--text-secondary)' }} className="mt-6 text-center text-sm">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" style={{ color: 'var(--accent)' }} className="hover:underline">
            Sign up →
          </Link>
        </p>
      </div>
    </div>
  )
}
