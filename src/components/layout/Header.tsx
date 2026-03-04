import { ThemeToggle } from './ThemeToggle'

export function Header() {
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
        <span
          style={{ color: 'var(--text-primary)' }}
          className="text-lg font-semibold tracking-tight"
        >
          Synapse
        </span>

        {/* Center — search placeholder */}
        <div className="flex-1" />

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            style={{
              backgroundColor: 'var(--accent)',
              color: '#ffffff',
            }}
            className="rounded-md px-4 py-1.5 text-sm font-medium transition-opacity hover:opacity-90"
          >
            Sign In
          </button>
        </div>
      </div>
    </header>
  )
}
