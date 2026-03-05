import Link from 'next/link'
import Image from 'next/image'
import { ThemeToggle } from './ThemeToggle'
import { HeaderClient } from './HeaderClient'
import { getCurrentUser } from '@/lib/auth/session'

export async function Header() {
  const user = await getCurrentUser()

  return (
    <header
      style={{
        backgroundColor: 'var(--bg)',
        borderBottomColor: 'var(--bg-border)',
      }}
      className="sticky top-0 z-50 w-full border-b"
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Wordmark */}
        <Link href="/" className="flex items-center gap-2">
          {/* Light theme logo */}
          <Image
            src="/SynapseIcon/android/ic_launcher-web.png"
            alt="Synapse"
            width={28}
            height={28}
            className="block dark:hidden rounded-md"
            priority
          />
          {/* Dark theme logo */}
          <Image
            src="/SynapseIconDark/android/ic_launcher-web.png"
            alt="Synapse"
            width={28}
            height={28}
            className="hidden dark:block rounded-md"
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

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <HeaderClient user={user} />
        </div>
      </div>
    </header>
  )
}
