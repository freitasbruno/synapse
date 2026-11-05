'use client'

import { useState } from 'react'
import { Toast } from '@/components/ui/Toast'

const EMBED_BASE_URL = 'https://synapse.bitlab.pt'

export function EmbedCodeButton({ assetId }: { assetId: string }) {
  const [message, setMessage] = useState<string | null>(null)

  async function handleCopy() {
    const snippet = `<iframe src="${EMBED_BASE_URL}/embed/asset/${assetId}" width="100%" height="400" frameborder="0"></iframe>`
    try {
      await navigator.clipboard.writeText(snippet)
      setMessage('Embed code copied')
    } catch {
      setMessage('Could not copy embed code')
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleCopy}
        style={{ borderColor: 'var(--bg-border)', color: 'var(--text-secondary)' }}
        className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:[border-color:var(--accent)] hover:[color:var(--accent)]"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
        Copy Embed Code
      </button>
      {message && <Toast message={message} onDismiss={() => setMessage(null)} />}
    </>
  )
}
