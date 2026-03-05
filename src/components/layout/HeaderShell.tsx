'use client'

import { useState, useEffect } from 'react'

export function HeaderShell({
  transparent,
  children,
}: {
  transparent: boolean
  children: React.ReactNode
}) {
  const [scrolled, setScrolled] = useState(!transparent)

  useEffect(() => {
    if (!transparent) return
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [transparent])

  return (
    <header
      style={
        scrolled
          ? { backgroundColor: 'var(--bg)', borderBottomColor: 'var(--bg-border)' }
          : { backgroundColor: 'transparent', borderBottomColor: 'transparent' }
      }
      className="sticky top-0 z-50 w-full border-b transition-all duration-200"
    >
      {children}
    </header>
  )
}
