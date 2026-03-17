'use client'

import { useSyncExternalStore, useState } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'synapse_cookie_consent'

// useSyncExternalStore requires a stable subscribe function.
// The storage event only fires in other tabs; same-tab changes are
// handled via local `dismissed` state instead.
function subscribe(callback: () => void) {
  window.addEventListener('storage', callback)
  return () => window.removeEventListener('storage', callback)
}

function getStoredConsent() {
  return localStorage.getItem(STORAGE_KEY)
}

// On the server (and before hydration) we return a non-null placeholder
// so the banner is hidden in the initial HTML — prevents flash for
// users who have already consented.
function getServerSnapshot() {
  return 'ssr' as string | null
}

export default function CookieConsent() {
  const storedConsent = useSyncExternalStore(subscribe, getStoredConsent, getServerSnapshot)

  // Local state drives the dismiss animation in the current tab.
  // (The storage event only fires for other tabs, so we track it separately.)
  const [dismissed, setDismissed] = useState(false)
  const [leaving, setLeaving] = useState(false)

  // Hide if already consented or locally dismissed
  if (storedConsent !== null || dismissed) return null

  function dismiss(value: 'accepted' | 'rejected') {
    localStorage.setItem(STORAGE_KEY, value)
    setLeaving(true)
    setTimeout(() => setDismissed(true), 220)
  }

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className={`fixed bottom-0 left-0 right-0 z-50 border-t transition-all duration-200 ease-in ${
        leaving ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'
      }`}
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--accent)',
      }}
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p style={{ color: 'var(--text-secondary)' }} className="text-sm leading-relaxed">
          We use essential cookies to keep you signed in. By continuing to use Synapse, you accept
          our use of cookies as described in our{' '}
          <Link href="/privacy" style={{ color: 'var(--accent)' }} className="hover:underline">
            Privacy Policy
          </Link>
          .
        </p>

        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => dismiss('rejected')}
            style={{ borderColor: 'var(--bg-border)', color: 'var(--text-secondary)' }}
            className="rounded-lg border px-4 py-1.5 text-sm transition-opacity hover:opacity-70"
          >
            Reject
          </button>
          <button
            onClick={() => dismiss('accepted')}
            style={{ backgroundColor: 'var(--accent)', color: '#ffffff' }}
            className="rounded-lg px-4 py-1.5 text-sm font-medium transition-opacity hover:opacity-90"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
