'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  {
    href: '/admin/overview',
    label: 'Overview',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    href: '/admin/ai-usage',
    label: 'AI Usage',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
      </svg>
    ),
  },
  {
    href: '/admin/assets',
    label: 'Assets',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />
      </svg>
    ),
  },
]

export function AdminSidebarNav() {
  const pathname = usePathname()

  const navLink = (item: (typeof NAV_ITEMS)[number], compact = false) => {
    const active = pathname.startsWith(item.href)
    return (
      <Link
        key={item.href}
        href={item.href}
        style={
          active
            ? { color: 'var(--accent)', backgroundColor: 'color-mix(in srgb, var(--accent) 12%, transparent)' }
            : { color: 'var(--text-secondary)' }
        }
        className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:[color:var(--text-primary)] ${compact ? 'flex-col gap-1 px-4 py-2 text-[10px]' : ''}`}
      >
        {item.icon}
        <span>{item.label}</span>
      </Link>
    )
  }

  return (
    <>
      {/* ── Desktop fixed sidebar ── */}
      <aside
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--bg-border)' }}
        className="hidden md:fixed md:inset-y-0 md:left-0 md:flex md:w-56 md:flex-col md:border-r"
      >
        {/* Brand */}
        <div
          style={{ borderColor: 'var(--bg-border)' }}
          className="flex items-center gap-2 border-b px-4 py-4"
        >
          <span style={{ color: 'var(--text-primary)' }} className="text-sm font-semibold">
            Synapse Admin
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col gap-0.5 p-3 flex-1">
          {NAV_ITEMS.map((item) => navLink(item))}
        </nav>

        {/* Footer */}
        <div style={{ borderColor: 'var(--bg-border)' }} className="border-t p-3">
          <Link
            href="/"
            style={{ color: 'var(--text-secondary)' }}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:[color:var(--text-primary)]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Synapse
          </Link>
        </div>
      </aside>

      {/* ── Mobile top tab bar ── */}
      <nav
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--bg-border)' }}
        className="sticky top-0 z-40 flex items-center justify-between border-b px-2 md:hidden"
      >
        <span style={{ color: 'var(--text-secondary)' }} className="px-2 text-xs font-semibold uppercase tracking-wide">
          Admin
        </span>
        <div className="flex">
          {NAV_ITEMS.map((item) => navLink(item, true))}
        </div>
        <Link
          href="/"
          style={{ color: 'var(--text-secondary)' }}
          className="px-2 py-3 text-xs hover:[color:var(--text-primary)]"
        >
          ← Back
        </Link>
      </nav>
    </>
  )
}
