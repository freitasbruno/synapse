import Link from 'next/link'

const TYPES = [
  {
    icon: '💬',
    name: 'Prompts',
    color: '#6366f1',
    colorBg: 'rgba(99,102,241,0.12)',
    colorBorder: 'rgba(99,102,241,0.35)',
    description: 'Carefully crafted instructions for any AI model. Copy and use in seconds.',
    slug: 'prompt',
  },
  {
    icon: '🔧',
    name: 'Tools',
    color: '#10b981',
    colorBg: 'rgba(16,185,129,0.12)',
    colorBorder: 'rgba(16,185,129,0.35)',
    description: 'Scripts, utilities, and integrations that extend what AI can do.',
    slug: 'tool',
  },
  {
    icon: '📱',
    name: 'Apps',
    color: '#f59e0b',
    colorBg: 'rgba(245,158,11,0.12)',
    colorBorder: 'rgba(245,158,11,0.35)',
    description: 'Full applications powered by AI. Link to live demos or source code.',
    slug: 'app',
  },
  {
    icon: '🔄',
    name: 'Workflows',
    color: '#8b5cf6',
    colorBg: 'rgba(139,92,246,0.12)',
    colorBorder: 'rgba(139,92,246,0.35)',
    description: 'Step-by-step processes combining multiple AI tools and prompts.',
    slug: 'workflow',
  },
]

export function AssetTypes() {
  return (
    <section className="px-4 py-24" style={{ backgroundColor: '#111111' }}>
      <div className="mx-auto max-w-5xl">
        <h2
          className="mb-12 text-center text-3xl font-bold sm:text-4xl"
          style={{ fontFamily: 'var(--font-display)', color: '#ffffff' }}
        >
          Four types of AI assets.
        </h2>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TYPES.map((t) => (
            <div
              key={t.slug}
              className="flex flex-col rounded-xl border p-5"
              style={{
                backgroundColor: t.colorBg,
                borderColor: t.colorBorder,
              }}
            >
              {/* Colored top accent */}
              <div
                className="mb-4 h-0.5 w-full rounded-full"
                style={{ backgroundColor: t.color }}
              />

              <div className="mb-2 text-2xl">{t.icon}</div>

              <span
                className="mb-2 inline-block rounded-full px-2 py-0.5 text-xs font-semibold capitalize"
                style={{ backgroundColor: t.colorBg, color: t.color, border: `1px solid ${t.colorBorder}` }}
              >
                {t.name}
              </span>

              <p className="mb-4 flex-1 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {t.description}
              </p>

              <Link
                href={`/explore?type=${t.slug}`}
                className="text-xs font-medium transition-opacity hover:opacity-80"
                style={{ color: t.color }}
              >
                Browse →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
