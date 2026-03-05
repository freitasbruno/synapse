'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// ─── password strength ────────────────────────────────────────────────────────

function getStrength(pw: string): { label: string; color: string; pct: number } | null {
  if (!pw) return null
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  if (score <= 1) return { label: 'Weak', color: '#ef4444', pct: 33 }
  if (score <= 3) return { label: 'Medium', color: '#f59e0b', pct: 66 }
  return { label: 'Strong', color: '#22c55e', pct: 100 }
}

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

function MailIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function SignUpPage() {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const strength = getStrength(password)

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
        data: { full_name: displayName },
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
    } else {
      setSuccess(true)
    }
  }

  const inputStyle = {
    backgroundColor: 'var(--bg)',
    borderColor: 'var(--bg-border)',
    color: 'var(--text-primary)',
  }
  const inputClass =
    'w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:[border-color:var(--accent)] placeholder:[color:var(--text-secondary)]'

  // ── Success state ──────────────────────────────────────────────────────────

  if (success) {
    return (
      <div
        style={{ backgroundColor: 'var(--bg)', color: 'var(--text-primary)' }}
        className="flex min-h-screen items-center justify-center px-4"
      >
        <div
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--bg-border)' }}
          className="w-full max-w-md rounded-2xl border p-8 text-center"
        >
          <div
            style={{ color: 'var(--accent)' }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/10"
          >
            <MailIcon />
          </div>
          {/* Logo */}
          <div className="mb-6 flex justify-center">
            <Image src="/SynapseIconDark/ios/iTunesArtwork@2x.png" alt="Synapse" width={48} height={48} className="block dark:hidden" priority />
            <Image src="/SynapseIcon/ios/iTunesArtwork@2x.png" alt="Synapse" width={48} height={48} className="hidden dark:block" priority />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Check your email</h1>
          <p style={{ color: 'var(--text-secondary)' }} className="mt-3 text-sm leading-relaxed">
            We sent a confirmation link to{' '}
            <span style={{ color: 'var(--text-primary)' }} className="font-medium">
              {email}
            </span>
            . Click it to activate your account.
          </p>
          <Link
            href="/auth/signin"
            style={{ color: 'var(--accent)' }}
            className="mt-6 inline-block text-sm hover:underline"
          >
            Back to Sign In →
          </Link>
        </div>
      </div>
    )
  }

  // ── Form ──────────────────────────────────────────────────────────────────

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
        <div className="mb-6 flex justify-center">
          <Image src="/SynapseIconDark/ios/iTunesArtwork@2x.png" alt="Synapse" width={48} height={48} className="block dark:hidden" priority />
          <Image src="/SynapseIcon/ios/iTunesArtwork@2x.png" alt="Synapse" width={48} height={48} className="hidden dark:block" priority />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Create Account</h1>
        <p style={{ color: 'var(--text-secondary)' }} className="mt-1 text-sm">
          Join Synapse to contribute to the community.
        </p>

        <form onSubmit={(e) => void handleSignUp(e)} className="mt-6 space-y-4">
          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
          )}

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
              type="text"
              required
              maxLength={80}
              autoComplete="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              style={inputStyle}
              className={inputClass}
            />
          </div>

          {/* Email */}
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

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              style={{ color: 'var(--text-secondary)' }}
              className="mb-1.5 block text-sm font-medium"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
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

            {/* Strength indicator */}
            {strength && (
              <div className="mt-2">
                <div
                  style={{ backgroundColor: 'var(--bg-border)' }}
                  className="h-1 w-full rounded-full"
                >
                  <div
                    style={{ width: `${strength.pct}%`, backgroundColor: strength.color }}
                    className="h-1 rounded-full transition-all duration-300"
                  />
                </div>
                <p style={{ color: strength.color }} className="mt-1 text-xs font-medium">
                  {strength.label}
                </p>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label
              htmlFor="confirm_password"
              style={{ color: 'var(--text-secondary)' }}
              className="mb-1.5 block text-sm font-medium"
            >
              Confirm password
            </label>
            <input
              id="confirm_password"
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={inputStyle}
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ backgroundColor: 'var(--accent)', color: '#ffffff' }}
            className="mt-2 w-full rounded-lg py-2.5 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p style={{ color: 'var(--text-secondary)' }} className="mt-6 text-center text-sm">
          Already have an account?{' '}
          <Link href="/auth/signin" style={{ color: 'var(--accent)' }} className="hover:underline">
            Sign in →
          </Link>
        </p>
      </div>
    </div>
  )
}
