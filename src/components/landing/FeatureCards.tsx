'use client'

import { useEffect, useRef } from 'react'

const FEATURES = [
  {
    icon: '🔍',
    title: 'Browse Freely',
    body: 'No account required. Explore hundreds of AI assets instantly — filter by type, search by keyword, sort by community validation.',
  },
  {
    icon: '✍️',
    title: 'Contribute Assets',
    body: 'Share your prompts, agents, apps, and workflows with the community. Rich documentation editor with markdown, images, and video.',
  },
  {
    icon: '✨',
    title: 'AI-Powered Refinement',
    body: 'Use the built-in Claude assistant to polish your content before publishing. Get tag suggestions, clarity improvements, and tone adjustments in seconds.',
  },
  {
    icon: '⭐',
    title: 'Community Validation',
    body: 'Star assets you find useful. Managers verify standout contributions with a gold badge. Quality rises to the top.',
  },
]

function FeatureCard({
  icon,
  title,
  body,
  delay,
}: {
  icon: string
  title: string
  body: string
  delay: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => el.classList.add('feature-visible'), delay)
          observer.disconnect()
        }
      },
      { threshold: 0.1 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [delay])

  return (
    <div
      ref={ref}
      className="feature-card rounded-xl border p-6 transition-all duration-300 hover:border-indigo-500/50"
      style={{
        backgroundColor: '#1a1a1a',
        borderColor: 'rgba(255,255,255,0.08)',
        opacity: 0,
        transform: 'translateY(20px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease, border-color 0.3s ease',
      }}
    >
      <div className="mb-3 text-3xl">{icon}</div>
      <h3
        className="mb-2 text-base font-semibold"
        style={{ fontFamily: 'var(--font-display)', color: '#ffffff' }}
      >
        {title}
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
        {body}
      </p>
    </div>
  )
}

export function FeatureCards() {
  return (
    <section className="px-4 py-24" style={{ backgroundColor: '#0a0a0a' }}>
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h2
            className="text-3xl font-bold sm:text-4xl"
            style={{ fontFamily: 'var(--font-display)', color: '#ffffff' }}
          >
            Built for AI creators who share.
          </h2>
          <p className="mt-3 text-base" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Stop reinventing the wheel. Discover what already works — then make it yours.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} {...f} delay={i * 100} />
          ))}
        </div>
      </div>

      <style>{`
        .feature-card.feature-visible {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
      `}</style>
    </section>
  )
}
