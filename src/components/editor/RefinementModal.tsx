'use client'

import { useState, useEffect, useRef } from 'react'
import { AIStatusIndicator } from './AIStatusIndicator'

// ─── types ────────────────────────────────────────────────────────────────────

type ModalState = 'idle' | 'loading' | 'result' | 'error'

interface RefineResponse {
  refined: string
  inputTokens: number
  outputTokens: number
}

export interface RefinementModalProps {
  isOpen: boolean
  onClose: () => void
  originalContent: string
  assetTitle: string
  assetType: string
  onAccept: (refinedContent: string) => void
}

// ─── RefinementModal ──────────────────────────────────────────────────────────

export function RefinementModal({
  isOpen,
  onClose,
  originalContent,
  assetTitle,
  assetType,
  onAccept,
}: RefinementModalProps) {
  const [modalState, setModalState] = useState<ModalState>('idle')
  const [currentContent, setCurrentContent] = useState(originalContent)
  const [refinedContent, setRefinedContent] = useState('')
  const [instruction, setInstruction] = useState('')
  const [totalTokens, setTotalTokens] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')

  const instructionRef = useRef<HTMLInputElement>(null)
  const firstBtnRef = useRef<HTMLButtonElement>(null)

  // Reset state each time the modal opens
  useEffect(() => {
    if (isOpen) {
      setModalState('idle')
      setCurrentContent(originalContent)
      setRefinedContent('')
      setInstruction('')
      setTotalTokens(0)
      setErrorMsg('')
    }
  }, [isOpen, originalContent])

  // Escape to close (not while loading)
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape' && modalState !== 'loading') onClose()
    }
    if (isOpen) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, modalState, onClose])

  // Focus the first button when result arrives
  useEffect(() => {
    if (modalState === 'result') firstBtnRef.current?.focus()
  }, [modalState])

  async function handleRefine() {
    setModalState('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: currentContent,
          assetTitle,
          assetType,
          instruction: instruction.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({})) as { detail?: string }
        throw new Error(`HTTP ${res.status}${errBody.detail ? `: ${errBody.detail}` : ''}`)
      }

      const data = (await res.json()) as RefineResponse
      setRefinedContent(data.refined)
      setTotalTokens((prev) => prev + data.inputTokens + data.outputTokens)
      setModalState('result')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[RefinementModal] refine error:', err)
      setErrorMsg(`Refinement failed: ${msg}`)
      setModalState('error')
    }
  }

  function handleRefineAgain() {
    // Iterate on the refined content
    setCurrentContent(refinedContent)
    setRefinedContent('')
    setModalState('idle')
    setTimeout(() => instructionRef.current?.focus(), 50)
  }

  function handleAccept() {
    onAccept(refinedContent)
    onClose()
  }

  if (!isOpen) return null

  // ── Shared styles ────────────────────────────────────────────────────────
  const textareaClass =
    'w-full resize-none rounded-lg border p-3 text-sm outline-none'
  const textareaStyle = {
    backgroundColor: 'var(--bg)',
    borderColor: 'var(--bg-border)',
    color: 'var(--text-primary)',
  }
  const labelClass = 'mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.70)', backdropFilter: 'blur(4px)' }}
      role="dialog"
      aria-modal="true"
      aria-label="Refine with AI"
    >
      <div
        className="flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl border shadow-2xl"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--bg-border)',
          maxHeight: '90vh',
        }}
      >
        {/* ── Header ── */}
        <div
          className="flex shrink-0 items-center justify-between border-b px-6 py-4"
          style={{ borderColor: 'var(--bg-border)' }}
        >
          <h2 style={{ color: 'var(--text-primary)' }} className="font-semibold">
            ✨ Refine with AI
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={modalState === 'loading'}
            style={{ color: 'var(--text-secondary)' }}
            className="rounded-md p-1 text-sm transition-opacity hover:opacity-70 disabled:opacity-30"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* ── Content panels ── */}
        <div className="grid min-h-0 flex-1 grid-cols-2 gap-4 overflow-auto p-6">
          {/* Left: Original / Current */}
          <div className="flex flex-col">
            <p style={{ color: 'var(--text-secondary)' }} className={labelClass}>
              {modalState === 'result' ? 'Original' : 'Content'}
            </p>
            <textarea
              value={currentContent}
              readOnly
              rows={12}
              className={`${textareaClass} flex-1 cursor-default select-text`}
              style={textareaStyle}
              aria-label="Original content"
            />
          </div>

          {/* Right: Refined / Loading / Placeholder */}
          <div className="flex flex-col">
            {modalState === 'result' ? (
              <>
                <p style={{ color: 'var(--text-secondary)' }} className={labelClass}>
                  <span>✨</span>
                  <span>Refined</span>
                </p>
                <textarea
                  value={refinedContent}
                  readOnly
                  rows={12}
                  className={`${textareaClass} flex-1 select-text`}
                  style={{
                    ...textareaStyle,
                    borderColor: 'var(--accent)',
                    cursor: 'text',
                  }}
                  aria-label="Refined content"
                />
              </>
            ) : modalState === 'loading' ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-lg border border-dashed"
                style={{ borderColor: 'var(--bg-border)' }}
              >
                <AIStatusIndicator message="Analysing…" />
                <AIStatusIndicator message="Claude is reviewing your content…" />
              </div>
            ) : (
              <div
                className="flex flex-1 items-center justify-center rounded-lg border border-dashed"
                style={{ borderColor: 'var(--bg-border)' }}
              >
                <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
                  Refined version will appear here
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div
          className="shrink-0 border-t px-6 py-4"
          style={{ borderColor: 'var(--bg-border)' }}
        >
          {/* Instruction input — shown in idle/error states (and always re-shown for refine-again) */}
          {(modalState === 'idle' || modalState === 'error') && (
            <input
              ref={instructionRef}
              type="text"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void handleRefine() }}
              disabled={false}
              placeholder="Optional: give specific instructions (e.g. 'make it shorter', 'more technical')"
              className="mb-4 w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:[border-color:var(--accent)] placeholder:[color:var(--text-secondary)] disabled:opacity-50"
              style={{
                backgroundColor: 'var(--bg)',
                borderColor: 'var(--bg-border)',
                color: 'var(--text-primary)',
              }}
            />
          )}

          {/* Error message */}
          {modalState === 'error' && errorMsg && (
            <p className="mb-3 text-sm text-red-400">{errorMsg}</p>
          )}

          {/* Action buttons */}
          {modalState === 'result' ? (
            <div className="flex flex-wrap items-center gap-3">
              <button
                ref={firstBtnRef}
                type="button"
                onClick={handleAccept}
                style={{ backgroundColor: 'var(--accent)', color: '#ffffff' }}
                className="rounded-lg px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
              >
                ✓ Accept
              </button>
              <button
                type="button"
                onClick={handleRefineAgain}
                style={{ borderColor: 'var(--bg-border)', color: 'var(--text-primary)' }}
                className="rounded-lg border px-4 py-2 text-sm font-medium transition-opacity hover:opacity-80"
              >
                ↺ Refine Again
              </button>
              <button
                type="button"
                onClick={onClose}
                style={{ color: 'var(--text-secondary)' }}
                className="rounded-lg px-4 py-2 text-sm font-medium transition-opacity hover:opacity-80"
              >
                ✕ Discard
              </button>
              <span
                className="ml-auto text-xs"
                style={{ color: 'var(--text-secondary)' }}
              >
                ~{totalTokens.toLocaleString()} tokens used
              </span>
            </div>
          ) : modalState === 'loading' ? (
            <div className="flex items-center gap-3">
              <AIStatusIndicator message="Analysing…" />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => void handleRefine()}
              style={{ backgroundColor: 'var(--accent)', color: '#ffffff' }}
              className="rounded-lg px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
            >
              ✨ Refine with AI
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
