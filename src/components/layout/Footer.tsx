'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CookiePreferencesLink } from '@/components/legal/CookiePreferencesLink'

export function Footer() {
  const pathname = usePathname()
  if (pathname?.startsWith('/embed')) return null

  return (
    <footer
      className="border-t px-4 py-6 text-center text-xs"
      style={{ borderColor: 'var(--bg-border)', color: 'var(--text-secondary)' }}
    >
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link href="/privacy" className="transition-opacity hover:opacity-70">
          Privacy Policy
        </Link>
        <Link href="/terms" className="transition-opacity hover:opacity-70">
          Terms of Service
        </Link>
        <CookiePreferencesLink />
        <span>© 2025 Bitlab</span>
      </div>
    </footer>
  )
}
