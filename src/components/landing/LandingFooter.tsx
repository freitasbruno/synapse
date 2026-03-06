import Link from 'next/link'
import Image from 'next/image'

export function LandingFooter() {
  return (
    <footer
      className="border-t px-4 py-8"
      style={{ borderColor: 'rgba(255,255,255,0.08)', backgroundColor: '#0a0a0a' }}
    >
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
        {/* Left: logo + copyright */}
        <div className="flex items-center gap-2">
          <Image src="/icon.svg" alt="Synapse" width={16} height={23} />
          <span className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
            © Bitlab 2025
          </span>
        </div>

        {/* Right: nav links */}
        <div className="flex items-center gap-5">
          <Link
            href="/explore"
            className="text-sm transition-opacity hover:opacity-70"
            style={{ color: 'rgba(255,255,255,0.45)' }}
          >
            Explore
          </Link>
          <Link
            href="/roadmap"
            className="text-sm transition-opacity hover:opacity-70"
            style={{ color: 'rgba(255,255,255,0.45)' }}
          >
            Roadmap
          </Link>
          <Link
            href="/auth/signin"
            className="text-sm transition-opacity hover:opacity-70"
            style={{ color: 'rgba(255,255,255,0.45)' }}
          >
            Sign In
          </Link>
          <Link
            href="/auth/signup"
            className="text-sm transition-opacity hover:opacity-70"
            style={{ color: 'rgba(255,255,255,0.45)' }}
          >
            Sign Up
          </Link>
        </div>
      </div>
    </footer>
  )
}
