import Link from 'next/link'
import Image from 'next/image'
import { ThemeToggle } from './ThemeToggle'
import { HeaderClient } from './HeaderClient'
import { HeaderShell } from './HeaderShell'
import { NotificationBell } from '@/components/ui/NotificationBell'
import { getCurrentUser } from '@/lib/auth/session'

interface HeaderProps {
  transparent?: boolean
}

export async function Header({ transparent = false }: HeaderProps) {
  const user = await getCurrentUser()
  const logoHref = user ? '/explore' : '/'

  return (
    <HeaderShell transparent={transparent}>
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Wordmark */}
        <Link href={logoHref} className="flex items-center gap-2">
          <Image
            src="/icon.svg"
            alt="Synapse"
            width={20}
            height={28}
            priority
          />
          <span
            style={{ color: 'var(--text-primary)' }}
            className="text-lg font-semibold tracking-tight"
          >
            Synapse
          </span>
        </Link>

        {/* Center — search placeholder */}
        <div className="flex-1" />

        {/* Nav links */}
        <Link
          href="/collections"
          style={{ color: 'var(--text-secondary)' }}
          className="mr-3 hidden text-sm transition-colors hover:[color:var(--text-primary)] sm:block"
        >
          Collections
        </Link>
        <Link
          href="/roadmap"
          style={{ color: 'var(--text-secondary)' }}
          className="mr-3 hidden text-sm transition-colors hover:[color:var(--text-primary)] sm:block"
        >
          Roadmap
        </Link>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {user && <NotificationBell />}
          <HeaderClient user={user} />
        </div>
      </div>
    </HeaderShell>
  )
}
