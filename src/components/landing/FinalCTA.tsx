import Link from 'next/link'

export function FinalCTA() {
  return (
    <section className="px-4 py-24 text-center" style={{ backgroundColor: '#0a0a0a' }}>
      <div className="mx-auto max-w-2xl">
        <h2
          className="mb-3 text-3xl font-bold sm:text-4xl"
          style={{ fontFamily: 'var(--font-display)', color: '#ffffff' }}
        >
          Start exploring. Or start contributing.
        </h2>
        <p className="mb-8 text-base" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Free to browse. Free to join.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/explore"
            className="rounded-lg px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#6366f1' }}
          >
            Explore Assets →
          </Link>
          <Link
            href="/auth/signup"
            className="rounded-lg border px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-80"
            style={{ borderColor: 'rgba(255,255,255,0.3)' }}
          >
            Create an Account
          </Link>
        </div>

        <p className="mt-6 text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Already have an account?{' '}
          <Link
            href="/auth/signin"
            className="transition-opacity hover:opacity-70"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            Sign in →
          </Link>
        </p>
      </div>
    </section>
  )
}
