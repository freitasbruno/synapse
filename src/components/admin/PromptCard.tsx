'use client'

import { useState, useRef } from 'react'
import type { AISystemPrompt } from '@/lib/types/database'
import { PromptTestPanel } from './PromptTestPanel'
import { PromptVersionHistory } from './PromptVersionHistory'

interface Props {
  prompt: AISystemPrompt
}

export function PromptCard({ prompt }: Props) {
  const [value, setValue] = useState(prompt.prompt)
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showTest, setShowTest] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const isDirty = value !== prompt.prompt
  const savedPromptRef = useRef(prompt.prompt)

  async function handleSave() {
    if (!isDirty) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/prompts/${prompt.key}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: value }),
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? 'Save failed')
      }
      savedPromptRef.current = value
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function handleReset() {
    if (!confirm('Reset this prompt to its default? This will overwrite any customisations.')) return
    setResetting(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/prompts/${prompt.key}/reset`, { method: 'POST' })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? 'Reset failed')
      }
      const updated = (await res.json()) as AISystemPrompt
      setValue(updated.prompt)
      savedPromptRef.current = updated.prompt
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed')
    } finally {
      setResetting(false)
    }
  }

  const variables = Array.isArray(prompt.variables) ? (prompt.variables as string[]) : []

  return (
    <div
      className="rounded-xl border p-5 space-y-4"
      style={{ borderColor: 'var(--bg-border)', backgroundColor: 'var(--bg-surface)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {prompt.name}
          </p>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
            {prompt.description}
          </p>
          {variables.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {variables.map((v) => (
                <code
                  key={v}
                  className="rounded px-1.5 py-0.5 text-[10px] font-mono"
                  style={{ backgroundColor: 'var(--bg)', color: 'var(--accent)', border: '1px solid var(--bg-border)' }}
                >
                  {`{{${v}}}`}
                </code>
              ))}
            </div>
          )}
        </div>
        <span
          className="shrink-0 rounded px-2 py-0.5 text-[10px] font-mono"
          style={{ backgroundColor: 'var(--bg)', color: 'var(--text-secondary)', border: '1px solid var(--bg-border)' }}
        >
          {prompt.key}
        </span>
      </div>

      {/* Textarea */}
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={10}
        className="w-full resize-y rounded-lg border px-3 py-2.5 font-mono text-xs outline-none transition-colors focus:[border-color:var(--accent)]"
        style={{
          backgroundColor: 'var(--bg)',
          borderColor: isDirty ? 'var(--accent)' : 'var(--bg-border)',
          color: 'var(--text-primary)',
          lineHeight: '1.6',
        }}
      />

      {/* Error */}
      {error && <p className="text-xs text-red-400">{error}</p>}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving || !isDirty}
          className="rounded-lg px-3 py-1.5 text-xs font-medium transition-opacity disabled:opacity-50"
          style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
        >
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save changes'}
        </button>

        <button
          type="button"
          onClick={() => void handleReset()}
          disabled={resetting}
          className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-70 disabled:opacity-50"
          style={{ borderColor: 'var(--bg-border)', color: 'var(--text-secondary)' }}
        >
          {resetting ? 'Resetting…' : 'Reset to default'}
        </button>

        <button
          type="button"
          onClick={() => setShowTest(!showTest)}
          className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-70"
          style={{ borderColor: 'var(--bg-border)', color: 'var(--text-secondary)' }}
        >
          {showTest ? 'Hide test' : 'Test prompt'}
        </button>

        <button
          type="button"
          onClick={() => setShowHistory(!showHistory)}
          className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-70"
          style={{ borderColor: 'var(--bg-border)', color: 'var(--text-secondary)' }}
        >
          Version history
        </button>

        {isDirty && (
          <button
            type="button"
            onClick={() => setValue(savedPromptRef.current)}
            className="text-xs transition-opacity hover:opacity-70"
            style={{ color: 'var(--text-secondary)' }}
          >
            Discard changes
          </button>
        )}
      </div>

      {showTest && (
        <PromptTestPanel promptKey={prompt.key} currentPrompt={value} savedPrompt={savedPromptRef.current} />
      )}

      {showHistory && (
        <PromptVersionHistory
          promptKey={prompt.key}
          onRestore={(restoredPrompt) => {
            setValue(restoredPrompt)
            setShowHistory(false)
          }}
        />
      )}
    </div>
  )
}
