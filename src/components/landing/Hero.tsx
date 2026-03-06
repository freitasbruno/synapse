'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    // Stagger-reveal each [data-reveal] child
    const items = el.querySelectorAll<HTMLElement>('[data-reveal]')
    items.forEach((item, i) => {
      item.style.animationDelay = `${i * 120}ms`
      item.classList.add('hero-reveal')
    })
  }, [])

  return (
    <section
      ref={containerRef}
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 text-center"
      style={{
        background:
          'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(99,102,241,0.18) 0%, #0a0a0a 70%)',
      }}
    >
      {/* Dot grid texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6 max-w-3xl">
        {/* Logo */}
        <div data-reveal>
          <Image src="/icon.svg" alt="Synapse" width={150} height={150} priority />
        </div>

        {/* Pre-headline */}
        <p
          data-reveal
          className="text-xs font-semibold uppercase tracking-[0.25em]"
          style={{ color: '#6366f1' }}
        >
          AI Knowledge Platform
        </p>

        {/* Main headline */}
        <h1
          data-reveal
          className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl"
          style={{ fontFamily: 'var(--font-display)', color: '#ffffff' }}
        >
          Build Better AI, Together.
        </h1>

        {/* Subheadline */}
        <p
          data-reveal
          className="text-lg leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.6)', maxWidth: '540px' }}
        >
          Synapse is the open repository for high-performance prompts and workflows. Frictionless browsing. Confident contributing. Provider agnostic.
        </p>

        {/* CTAs */}
        <div data-reveal className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/explore"
            className="rounded-lg px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#6366f1' }}
          >
            Explore Assets →
          </Link>
          <Link
            href="/auth/signin"
            className="rounded-lg border px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-80"
            style={{ borderColor: 'rgba(255,255,255,0.3)' }}
          >
            Sign In
          </Link>
        </div>

        {/* Scroll indicator */}
        <div data-reveal className="mt-8 flex flex-col items-center gap-2">
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            scroll to learn more
          </p>
          <div className="scroll-bounce" style={{ color: 'rgba(255,255,255,0.35)' }}>
            ↓
          </div>
        </div>
      </div>

      <style>{`
        @keyframes heroReveal {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-reveal {
          opacity: 0;
          animation: heroReveal 0.6s ease forwards;
        }
        @keyframes scrollBounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(6px); }
        }
        .scroll-bounce {
          animation: scrollBounce 1.8s ease-in-out infinite;
        }
      `}</style>
    </section>
  )
}
