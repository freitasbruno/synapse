'use client'

import { useState } from 'react'
import { Toast } from './Toast'

// ─── icons ────────────────────────────────────────────────────────────────────

function ClipboardIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="2" width="6" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function ExternalLinkIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}

// ─── component ────────────────────────────────────────────────────────────────

interface ActionButtonsProps {
  content?: string | null
  externalUrl?: string | null
  compact?: boolean
}

export function ActionButtons({ content, externalUrl, compact = false }: ActionButtonsProps) {
  const [copied, setCopied] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const hasContent = Boolean(content)
  const hasUrl = Boolean(externalUrl)

  if (!hasContent && !hasUrl) return null

  async function handleCopy() {
    if (!content) return

    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      setErrorMessage('Clipboard is not available in this context.')
      return
    }

    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setErrorMessage('Failed to copy to clipboard.')
    }
  }

  // ── styles ──────────────────────────────────────────────────────────────────

  const filledStyle = { backgroundColor: 'var(--accent)', color: '#ffffff' }
  const outlinedStyle = { borderColor: 'var(--accent)', color: 'var(--accent)' }

  const btnStyle = compact ? outlinedStyle : filledStyle
  const btnClass = compact
    ? 'inline-flex items-center gap-1.5 rounded-md border px-3 py-1 text-xs font-medium transition-opacity hover:opacity-80'
    : 'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90'

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <div className={`flex gap-2 ${compact ? '' : 'flex-col sm:flex-row'}`}>

        {hasContent && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              void handleCopy()
            }}
            style={btnStyle}
            className={btnClass}
          >
            {copied ? <CheckIcon /> : <ClipboardIcon />}
            {copied ? 'Copied!' : 'Copy Prompt'}
          </button>
        )}

        {hasUrl && externalUrl && (
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={btnStyle}
            className={btnClass}
          >
            Visit Resource
            <ExternalLinkIcon size={compact ? 12 : 14} />
          </a>
        )}

      </div>

      {errorMessage && (
        <Toast message={errorMessage} onDismiss={() => setErrorMessage(null)} />
      )}
    </>
  )
}
