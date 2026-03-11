'use client'

import { useState, useEffect } from 'react'

export function EmbedExistingButton() {
  const [count, setCount] = useState<number | null>(null)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/agent/embed-existing')
      .then((r) => r.json())
      .then((d: { withoutEmbedding?: number }) => setCount(d.withoutEmbedding ?? 0))
      .catch(() => setCount(0))
  }, [])

  async function run() {
    setRunning(true)
    setResult(null)
    try {
      const res = await fetch('/api/agent/embed-existing', { method: 'POST' })
      const data = (await res.json()) as { processed?: number; total?: number; message?: string }
      setResult(data.message ?? `Embedded ${data.processed ?? 0} of ${data.total ?? 0} assets.`)
      setCount(0)
    } catch {
      setResult('Failed to generate embeddings.')
    } finally {
      setRunning(false)
    }
  }

  if (count === null || count === 0) return null

  return (
    <div
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--bg-border)' }}
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3"
    >
      <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
        <span style={{ color: 'var(--text-primary)' }} className="font-medium">{count}</span> published assets lack embeddings — deduplication requires them.
      </p>
      <div className="flex items-center gap-3">
        {result && <span style={{ color: 'var(--text-secondary)' }} className="text-xs">{result}</span>}
        <button
          onClick={() => { void run() }}
          disabled={running}
          style={{ borderColor: 'var(--bg-border)', color: 'var(--text-secondary)' }}
          className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:[color:var(--text-primary)] disabled:opacity-50"
        >
          {running ? 'Generating...' : 'Generate embeddings'}
        </button>
      </div>
    </div>
  )
}
