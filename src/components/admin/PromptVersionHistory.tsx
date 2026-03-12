'use client'

import { useState, useEffect } from 'react'
import type { AISystemPromptVersion } from '@/lib/types/database'

interface Props {
  promptKey: string
  onRestore: (prompt: string) => void
}

export function PromptVersionHistory({ promptKey, onRestore }: Props) {
  const [versions, setVersions] = useState<AISystemPromptVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`/api/admin/prompts/${promptKey}/versions`)
        if (res.ok) {
          const data = (await res.json()) as AISystemPromptVersion[]
          setVersions(data)
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [promptKey])

  if (loading) {
    return (
      <div
        className="rounded-lg border p-4"
        style={{ borderColor: 'var(--bg-border)', backgroundColor: 'var(--bg)' }}
      >
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Loading history…</p>
      </div>
    )
  }

  if (versions.length === 0) {
    return (
      <div
        className="rounded-lg border p-4"
        style={{ borderColor: 'var(--bg-border)', backgroundColor: 'var(--bg)' }}
      >
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>No version history yet.</p>
      </div>
    )
  }

  return (
    <div
      className="rounded-lg border p-4 space-y-3"
      style={{ borderColor: 'var(--bg-border)', backgroundColor: 'var(--bg)' }}
    >
      <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
        Version history ({versions.length})
      </p>

      <div className="space-y-2">
        {versions.map((v, i) => {
          const isExpanded = expanded === v.id
          const label = i === 0 ? 'Latest' : `${i + 1} versions ago`
          const date = new Date(v.created_at).toLocaleString()

          return (
            <div
              key={v.id}
              className="rounded-md border overflow-hidden"
              style={{ borderColor: 'var(--bg-border)' }}
            >
              <div
                className="flex items-center justify-between px-3 py-2 cursor-pointer"
                style={{ backgroundColor: 'var(--bg-surface)' }}
                onClick={() => setExpanded(isExpanded ? null : v.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setExpanded(isExpanded ? null : v.id) }}
              >
                <div>
                  <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                    {label}
                  </span>
                  <span className="ml-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {date}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm('Restore this version? Your current draft will be replaced.')) {
                        onRestore(v.prompt)
                      }
                    }}
                    className="text-xs transition-opacity hover:opacity-70"
                    style={{ color: 'var(--accent)' }}
                  >
                    Restore
                  </button>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {isExpanded ? '▲' : '▼'}
                  </span>
                </div>
              </div>

              {isExpanded && (
                <pre
                  className="max-h-48 overflow-auto whitespace-pre-wrap border-t px-3 py-2 text-[11px] leading-relaxed"
                  style={{
                    borderColor: 'var(--bg-border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {v.prompt}
                </pre>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
