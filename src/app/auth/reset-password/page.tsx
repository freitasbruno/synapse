'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
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

// ─── card shell ───────────────────────────────────────────────────────────────

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--bg-border)' }}
      className="w-full max-w-md rounded-2xl border p-8"
    >
      {children}
    </div>
  )
}

// ─── content (needs useSearchParams) ─────────────────────────────────────────

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = searchParams.get('code')

  // ── State: request reset ─────────────────────────────────────────────────
  const [email, setEmail] = useState('')
  const [requestLoading, setRequestLoading] = useState(false)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [requestSent, setRequestSent] = useState(false)

  // ── State: set new password ──────────────────────────────────────────────
  const [sessionReady, setSessionReady] = useState(false)
  const [exchangeError, setExchangeError] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [updateLoading, setUpdateLoading] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)

  // Exchange code for session once on mount when code is present
  useEffect(() => {
    if (!code) return
    const supabase = createClient()
    supabase.auth
      .exchangeCodeForSession(code)
      .then(({ error }) => {
        if (error) {
          setExchangeError('This reset link is invalid or has expired.')
        } else {
          setSessionReady(true)
        }
      })
  }, [code])

  const inputStyle = {
    backgroundColor: 'var(--bg)',
    borderColor: 'var(--bg-border)',
    color: 'var(--text-primary)',
  }
  const inputClass =
    'w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:[border-color:var(--accent)] placeholder:[color:var(--text-secondary)]'

  // ── Set new password flow ────────────────────────────────────────────────

  if (code) {
    if (exchangeError) {
      return (
        <Card>
          <h1 className="text-2xl font-bold tracking-tight">Invalid Link</h1>
          <p style={{ color: 'var(--text-secondary)' }} className="mt-2 text-sm leading-relaxed">
            {exchangeError}
          </p>
          <Link
            href="/auth/reset-password"
            style={{ color: 'var(--accent)' }}
            className="mt-4 inline-block text-sm hover:underline"
          >
            Request a new reset link →
          </Link>
        </Card>
      )
    }

    if (!sessionReady) {
      return (
        <Card>
          <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
            Verifying reset link…
          </p>
        </Card>
      )
    }

    async function handleSetPassword(e: React.FormEvent) {
      e.preventDefault()
      if (newPassword !== confirmPassword) {
        setUpdateError('Passwords do not match.')
        return
      }
      setUpdateLoading(true)
      setUpdateError(null)
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) {
        setUpdateError(error.message)
        setUpdateLoading(false)
      } else {
        router.push('/')
        router.refresh()
      }
    }

    return (
      <Card>
        <h1 className="text-2xl font-bold tracking-tight">Set New Password</h1>
        <p style={{ color: 'var(--text-secondary)' }} className="mt-1 text-sm">
          Choose a strong password for your account.
        </p>

        <form onSubmit={(e) => void handleSetPassword(e)} className="mt-6 space-y-4">
          {updateError && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {updateError}
            </p>
          )}

          <div>
            <label
              htmlFor="new_password"
              style={{ color: 'var(--text-secondary)' }}
              className="mb-1.5 block text-sm font-medium"
            >
              New password
            </label>
            <div className="relative">
              <input
                id="new_password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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
            disabled={updateLoading}
            style={{ backgroundColor: 'var(--accent)', color: '#ffffff' }}
            className="mt-2 w-full rounded-lg py-2.5 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {updateLoading ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </Card>
    )
  }

  // ── Request reset flow ───────────────────────────────────────────────────

  if (requestSent) {
    return (
      <Card>
        <h1 className="text-2xl font-bold tracking-tight">Check your email</h1>
        <p style={{ color: 'var(--text-secondary)' }} className="mt-2 text-sm leading-relaxed">
          We sent a password reset link to{' '}
          <span style={{ color: 'var(--text-primary)' }} className="font-medium">
            {email}
          </span>
          . Check your inbox and click the link to set a new password.
        </p>
        <Link
          href="/auth/signin"
          style={{ color: 'var(--accent)' }}
          className="mt-4 inline-block text-sm hover:underline"
        >
          Back to Sign In →
        </Link>
      </Card>
    )
  }

  async function handleRequestReset(e: React.FormEvent) {
    e.preventDefault()
    setRequestLoading(true)
    setRequestError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    })
    if (error) {
      setRequestError(error.message)
      setRequestLoading(false)
    } else {
      setRequestSent(true)
    }
  }

  return (
    <Card>
      <h1 className="text-2xl font-bold tracking-tight">Reset Password</h1>
      <p style={{ color: 'var(--text-secondary)' }} className="mt-1 text-sm">
        Enter your email and we&apos;ll send you a reset link.
      </p>

      <form onSubmit={(e) => void handleRequestReset(e)} className="mt-6 space-y-4">
        {requestError && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {requestError}
          </p>
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

        <button
          type="submit"
          disabled={requestLoading}
          style={{ backgroundColor: 'var(--accent)', color: '#ffffff' }}
          className="mt-2 w-full rounded-lg py-2.5 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {requestLoading ? 'Sending…' : 'Send Reset Link'}
        </button>
      </form>

      <p style={{ color: 'var(--text-secondary)' }} className="mt-6 text-center text-sm">
        <Link href="/auth/signin" style={{ color: 'var(--accent)' }} className="hover:underline">
          ← Back to Sign In
        </Link>
      </p>
    </Card>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function ResetPasswordPage() {
  return (
    <div
      style={{ backgroundColor: 'var(--bg)', color: 'var(--text-primary)' }}
      className="flex min-h-screen items-center justify-center px-4"
    >
      <Suspense
        fallback={
          <div
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--bg-border)' }}
            className="w-full max-w-md rounded-2xl border p-8"
          >
            <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
              Loading…
            </p>
          </div>
        }
      >
        <ResetPasswordContent />
      </Suspense>
    </div>
  )
}
