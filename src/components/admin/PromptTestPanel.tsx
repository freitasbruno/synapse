'use client'

import { useState } from 'react'

interface Props {
  promptKey: string
  currentPrompt: string
  savedPrompt: string
}

interface TestResult {
  output: string
  inputTokens: number
  outputTokens: number
}

export function PromptTestPanel({ promptKey, currentPrompt, savedPrompt }: Props) {
  const [userMessage, setUserMessage] = useState('')
  const [currentResult, setCurrentResult] = useState<TestResult | null>(null)
  const [savedResult, setSavedResult] = useState<TestResult | null>(null)
  const [loadingCurrent, setLoadingCurrent] = useState(false)
  const [loadingSaved, setLoadingSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isDraftDifferent = currentPrompt !== savedPrompt

  async function runTest(prompt: string, target: 'current' | 'saved') {
    if (!userMessage.trim()) return
    setError(null)
    if (target === 'current') setLoadingCurrent(true)
    else setLoadingSaved(true)

    try {
      const res = await fetch(`/api/admin/prompts/${promptKey}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, userMessage: userMessage.trim() }),
      })
      const data = (await res.json()) as TestResult & { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Test failed')
      if (target === 'current') setCurrentResult(data)
      else setSavedResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test failed')
    } finally {
      if (target === 'current') setLoadingCurrent(false)
      else setLoadingSaved(false)
    }
  }

  return (
    <div
      className="rounded-lg border p-4 space-y-4"
      style={{ borderColor: 'var(--bg-border)', backgroundColor: 'var(--bg)' }}
    >
      <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
        Test prompt
      </p>

      <div className="space-y-2">
        <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          User message
        </label>
        <textarea
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
          rows={3}
          placeholder="Enter a test message to send to the model…"
          className="w-full resize-none rounded-md border px-2.5 py-2 text-xs outline-none transition-colors focus:[border-color:var(--accent)] placeholder:[color:var(--text-secondary)]"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--bg-border)', color: 'var(--text-primary)' }}
        />
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {isDraftDifferent ? (
        <div className="grid grid-cols-2 gap-4">
          {/* Draft (current edited) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
                Draft (unsaved)
              </p>
              <button
                type="button"
                onClick={() => void runTest(currentPrompt, 'current')}
                disabled={loadingCurrent || !userMessage.trim()}
                className="rounded px-2 py-1 text-xs font-medium transition-opacity disabled:opacity-50"
                style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
              >
                {loadingCurrent ? 'Running…' : 'Run'}
              </button>
            </div>
            {currentResult && (
              <OutputBox result={currentResult} />
            )}
          </div>

          {/* Saved */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Saved
              </p>
              <button
                type="button"
                onClick={() => void runTest(savedPrompt, 'saved')}
                disabled={loadingSaved || !userMessage.trim()}
                className="rounded border px-2 py-1 text-xs font-medium transition-opacity disabled:opacity-50 hover:opacity-70"
                style={{ borderColor: 'var(--bg-border)', color: 'var(--text-secondary)' }}
              >
                {loadingSaved ? 'Running…' : 'Run'}
              </button>
            </div>
            {savedResult && (
              <OutputBox result={savedResult} />
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => void runTest(currentPrompt, 'current')}
            disabled={loadingCurrent || !userMessage.trim()}
            className="rounded px-3 py-1.5 text-xs font-medium transition-opacity disabled:opacity-50"
            style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
          >
            {loadingCurrent ? 'Running…' : 'Run test'}
          </button>
          {currentResult && <OutputBox result={currentResult} />}
        </div>
      )}
    </div>
  )
}

function OutputBox({ result }: { result: TestResult }) {
  return (
    <div className="space-y-1">
      <pre
        className="max-h-48 overflow-auto whitespace-pre-wrap rounded-md border p-2.5 text-xs leading-relaxed"
        style={{ borderColor: 'var(--bg-border)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}
      >
        {result.output}
      </pre>
      <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
        {result.inputTokens} in · {result.outputTokens} out
      </p>
    </div>
  )
}
