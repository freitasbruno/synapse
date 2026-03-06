import Link from 'next/link'
import { Header } from '@/components/layout/Header'

// ─── types ────────────────────────────────────────────────────────────────────

interface RoadmapItem {
  title: string
  description: string
}

interface RoadmapSection {
  label: string
  color: string
  colorMuted: string
  items: RoadmapItem[]
  placeholder?: string
}

// ─── data ─────────────────────────────────────────────────────────────────────

const SECTIONS: RoadmapSection[] = [
  {
    label: '🚀 Coming Soon',
    color: '#6366f1',
    colorMuted: 'rgba(99,102,241,0.12)',
    items: [
      {
        title: 'Edit Shortcut on Asset Pages',
        description: "Quick access to edit mode directly from an asset's detail page.",
      },
      {
        title: 'Prompt Editor Upgrade',
        description:
          'Markdown support, AI refinement, and a guided Prompt Assistant to help you write better prompts.',
      },
      {
        title: 'Copy Block Content',
        description:
          'Copy any individual text block from an asset detail page with one click.',
      },
    ],
  },
  {
    label: '🛠️ In Development',
    color: '#f59e0b',
    colorMuted: 'rgba(245,158,11,0.12)',
    items: [
      {
        title: 'Tag Filter Redesign',
        description:
          'Searchable dropdown with multi-select for easier tag discovery in the gallery.',
      },
    ],
  },
  {
    label: '🔭 Future',
    color: '#10b981',
    colorMuted: 'rgba(16,185,129,0.12)',
    items: [
      {
        title: 'Collections',
        description: 'Curate and share named lists of assets.',
      },
      {
        title: 'Follow Creators',
        description: 'Subscribe to creators you love.',
      },
      {
        title: 'Notifications',
        description: 'Get notified when someone stars or comments on your assets.',
      },
      {
        title: 'Embed Widget',
        description: 'Embed any asset as an iframe on external sites.',
      },
      {
        title: 'Version History',
        description: 'Track how your assets evolve over time.',
      },
      {
        title: 'Public API',
        description: 'Query the Synapse library programmatically.',
      },
    ],
  },
]

// ─── components ───────────────────────────────────────────────────────────────

function FeatureCard({ title, description, borderColor }: RoadmapItem & { borderColor: string }) {
  return (
    <div
      className="rounded-lg border p-4"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--bg-border)',
        borderLeftColor: borderColor,
        borderLeftWidth: '3px',
      }}
    >
      <p style={{ color: 'var(--text-primary)' }} className="text-sm font-semibold">
        {title}
      </p>
      <p style={{ color: 'var(--text-secondary)' }} className="mt-1 text-xs leading-relaxed">
        {description}
      </p>
    </div>
  )
}

function Section({ section }: { section: RoadmapSection }) {
  return (
    <div className="flex flex-col gap-4">
      {/* Section header */}
      <div
        className="rounded-lg px-4 py-3"
        style={{ backgroundColor: section.colorMuted }}
      >
        <h2 className="text-sm font-bold" style={{ color: section.color }}>
          {section.label}
        </h2>
      </div>

      {/* Items */}
      {section.items.length > 0 ? (
        section.items.map((item) => (
          <FeatureCard key={item.title} {...item} borderColor={section.color} />
        ))
      ) : (
        <p
          className="px-1 text-sm"
          style={{ color: 'var(--text-secondary)' }}
        >
          {section.placeholder}
        </p>
      )}
    </div>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function RoadmapPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        {/* Back link */}
        <Link
          href="/"
          style={{ color: 'var(--text-secondary)' }}
          className="inline-flex items-center gap-1.5 text-sm transition-colors hover:[color:var(--text-primary)]"
        >
          ← Back
        </Link>

        {/* Heading */}
        <div className="mt-6 mb-10">
          <h1
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
            className="text-3xl font-bold tracking-tight"
          >
            Roadmap
          </h1>
          <p style={{ color: 'var(--text-secondary)' }} className="mt-2 text-sm">
            What we&apos;re building and what&apos;s coming next.
          </p>
        </div>

        {/* Three-column grid */}
        <div className="grid gap-8 sm:grid-cols-3">
          {SECTIONS.map((section) => (
            <Section key={section.label} section={section} />
          ))}
        </div>

        {/* Footer note */}
        <p
          className="mt-12 text-center text-xs"
          style={{ color: 'var(--text-secondary)' }}
        >
          Have a suggestion? Share it in the comments on any asset.
        </p>
      </main>
    </>
  )
}
