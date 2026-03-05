'use client'

import { useEffect, useRef, useState } from 'react'

function useCountUp(target: number, duration = 1400) {
  const [count, setCount] = useState(0)
  const started = useRef(false)

  function start() {
    if (started.current) return
    started.current = true
    const startTime = performance.now()
    function step(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }

  return { count, start }
}

function Stat({
  label,
  value,
  animate,
  target,
}: {
  label: string
  value?: string
  animate?: boolean
  target?: number
}) {
  const { count, start } = useCountUp(target ?? 0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!animate) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) start() },
      { threshold: 0.5 },
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [animate, start])

  return (
    <div ref={ref} className="flex flex-col items-center gap-1 px-8 py-6">
      <span
        className="text-4xl font-bold tabular-nums"
        style={{ fontFamily: 'var(--font-display)', color: '#ffffff' }}
      >
        {animate ? count.toLocaleString() : value}
      </span>
      <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
        {label}
      </span>
    </div>
  )
}

export function StatsBar({ assetCount }: { assetCount: number }) {
  return (
    <section style={{ backgroundColor: '#111111' }}>
      <div className="mx-auto flex max-w-4xl flex-wrap items-stretch justify-center divide-x divide-white/10">
        <Stat label="Published Assets" animate target={assetCount} />
        <Stat label="Open Access" value="Free" />
        <Stat label="AI-Powered Refinement" value="Built-in" />
      </div>
    </section>
  )
}
