'use client'

import { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import type { UserRow } from '@/lib/types/database'

// ─── helpers ─────────────────────────────────────────────────────────────────

function InitialsAvatar({ name, size = 32 }: { name: string; size?: number }) {
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
        fontSize: size * 0.38,
      }}
      className="flex shrink-0 items-center justify-center rounded-full font-semibold"
    >
      {initials}
    </div>
  )
}

// ─── component ───────────────────────────────────────────────────────────────

interface HeaderClientProps {
  user: UserRow | null
}

export function HeaderClient({ user }: HeaderClientProps) {
  const router = useRouter()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClick)
    }
    return () => document.removeEventListener('mousedown', handleClick)
  }, [dropdownOpen])

  async function handleSignOut() {
    setDropdownOpen(false)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (!user) {
    return (
      <Link
        href="/auth/signin"
        style={{ backgroundColor: 'var(--accent)', color: '#ffffff' }}
        className="rounded-md px-4 py-1.5 text-sm font-medium transition-opacity hover:opacity-90"
      >
        Sign In
      </Link>
    )
  }

  return (
    <div ref={dropdownRef} className="relative">
      {/* Avatar trigger */}
      <button
        onClick={() => setDropdownOpen((v) => !v)}
        className="flex items-center rounded-full transition-opacity hover:opacity-80"
        aria-label="Account menu"
        aria-expanded={dropdownOpen}
      >
        {user.photo_url ? (
          <Image
            src={user.photo_url}
            alt={user.display_name}
            width={32}
            height={32}
            unoptimized
            className="rounded-full"
          />
        ) : (
          <InitialsAvatar name={user.display_name} />
        )}
      </button>

      {/* Dropdown */}
      {dropdownOpen && (
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--bg-border)',
          }}
          className="absolute right-0 top-10 z-50 w-52 rounded-xl border py-1 shadow-lg"
        >
          {/* User info header */}
          <div
            style={{ borderBottomColor: 'var(--bg-border)' }}
            className="border-b px-4 py-2.5"
          >
            <p
              style={{ color: 'var(--text-primary)' }}
              className="truncate text-sm font-semibold"
            >
              {user.display_name}
            </p>
            <p
              style={{ color: 'var(--text-secondary)' }}
              className="truncate text-xs"
            >
              {user.email}
            </p>
          </div>

          {/* Links */}
          <Link
            href="/profile"
            onClick={() => setDropdownOpen(false)}
            style={{ color: 'var(--text-primary)' }}
            className="block px-4 py-2 text-sm transition-colors hover:[background-color:var(--bg-border)]"
          >
            My Profile
          </Link>
          <Link
            href="/profile#assets"
            onClick={() => setDropdownOpen(false)}
            style={{ color: 'var(--text-primary)' }}
            className="block px-4 py-2 text-sm transition-colors hover:[background-color:var(--bg-border)]"
          >
            My Assets
          </Link>

          {/* Divider + Sign out */}
          <div style={{ borderTopColor: 'var(--bg-border)' }} className="mt-1 border-t pt-1">
            <button
              onClick={() => void handleSignOut()}
              style={{ color: 'var(--text-secondary)' }}
              className="w-full px-4 py-2 text-left text-sm transition-colors hover:[background-color:var(--bg-border)] hover:[color:var(--text-primary)]"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
