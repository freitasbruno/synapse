'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

// ─── types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface PromptAssistantProps {
  assetTitle: string
  onInsert: (content: string) => void
}

// ─── constants ────────────────────────────────────────────────────────────────

const OPENING_MESSAGE =
  "Hi! I'll help you write a great prompt. Let's start with a few quick questions. What should this prompt help the AI do? (e.g. 'summarise meeting notes', 'write cold emails', 'explain code')"

// ─── helpers ──────────────────────────────────────────────────────────────────

function extractDraft(content: string): string {
  const match = /```[^\n]*\n([\s\S]*?)```/.exec(content)
  return match ? match[1].trim() : content.trim()
}

function hasDraft(content: string): boolean {
  return content.includes('```')
}

// Find the most recent assistant message that contains a drafted prompt
function findLastDraft(messages: Message[]): Message | undefined {
  return [...messages].reverse().find((m) => m.role === 'assistant' && hasDraft(m.content))
}

// ─── ChevronIcon ──────────────────────────────────────────────────────────────

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{
        transform: open ? 'rotate(180deg)' : 'none',
        transition: 'transform 0.15s ease',
        marginLeft: '2px',
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

// ─── PromptAssistant ──────────────────────────────────────────────────────────

export function PromptAssistant({ assetTitle, onInsert }: PromptAssistantProps) {
  const initialMessages: Message[] = [
    { id: 'opening', role: 'assistant', content: OPENING_MESSAGE },
  ]

  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(t)
    }
  }, [open])

  function clearConversation() {
    abortRef.current?.abort()
    setMessages(initialMessages)
    setIsStreaming(false)
    setInput('')
  }

  const sendMessage = useCallback(
    async (userText: string) => {
      if (!userText.trim() || isStreaming) return

      // Cancel any in-flight stream
      abortRef.current?.abort()
      const abort = new AbortController()
      abortRef.current = abort

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: userText.trim(),
      }

      // Append user message + placeholder assistant message
      const assistantId = crypto.randomUUID()
      setMessages((prev) => [
        ...prev,
        userMsg,
        { id: assistantId, role: 'assistant', content: '' },
      ])
      setInput('')
      setIsStreaming(true)

      try {
        const historyForApi = [...messages, userMsg].map(({ role, content }) => ({
          role,
          content,
        }))

        const res = await fetch('/api/prompt-assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: historyForApi, assetTitle }),
          signal: abort.signal,
        })

        if (!res.ok || !res.body) {
          const errText = await res.text().catch(() => 'Unknown error')
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: `Error: ${errText}` }
                : m,
            ),
          )
          return
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + chunk } : m,
            ),
          )
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        const msg = err instanceof Error ? err.message : String(err)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: `Error: ${msg}` } : m,
          ),
        )
      } finally {
        setIsStreaming(false)
      }
    },
    [isStreaming, messages, assetTitle],
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    void sendMessage(input)
  }

  const lastDraft = findLastDraft(messages)

  return (
    <div className="mt-4">
      {/* ── Trigger ── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{ color: 'var(--text-secondary)', borderColor: 'var(--bg-border)' }}
        className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors hover:[border-color:var(--text-secondary)] hover:[color:var(--text-primary)]"
      >
        <span>💡</span>
        <span>Need help writing this prompt?</span>
        <ChevronIcon open={open} />
      </button>

      {/* ── Panel ── */}
      {open && (
        <div
          className="mt-2 flex flex-col overflow-hidden rounded-xl border"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--bg-border)',
            height: '420px',
          }}
        >
          {/* Panel header */}
          <div
            className="flex shrink-0 items-center justify-between border-b px-4 py-2.5"
            style={{ borderColor: 'var(--bg-border)' }}
          >
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Prompt Assistant
            </span>
            <button
              type="button"
              onClick={clearConversation}
              className="text-xs transition-opacity hover:opacity-70"
              style={{ color: 'var(--text-secondary)' }}
            >
              Clear conversation
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className="max-w-[85%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm leading-relaxed"
                  style={
                    m.role === 'user'
                      ? { backgroundColor: 'var(--accent)', color: '#fff' }
                      : {
                          backgroundColor: 'var(--bg)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--bg-border)',
                        }
                  }
                >
                  {m.content || (
                    <span style={{ color: 'var(--text-secondary)' }} className="animate-pulse">
                      Thinking…
                    </span>
                  )}
                </div>
              </div>
            ))}
            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>

          {/* Insert button — visible when a draft has been produced */}
          {lastDraft && !isStreaming && (
            <div
              className="shrink-0 border-t px-4 py-2"
              style={{ borderColor: 'var(--bg-border)' }}
            >
              <button
                type="button"
                onClick={() => onInsert(extractDraft(lastDraft.content))}
                style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
                className="rounded-lg px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-90"
              >
                Insert into prompt →
              </button>
            </div>
          )}

          {/* Input area */}
          <div
            className="shrink-0 border-t px-3 py-2.5"
            style={{ borderColor: 'var(--bg-border)' }}
          >
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your answer…"
                disabled={isStreaming}
                className="flex-1 rounded-lg border px-3 py-1.5 text-sm outline-none transition-colors focus:[border-color:var(--accent)] placeholder:[color:var(--text-secondary)] disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--bg)',
                  borderColor: 'var(--bg-border)',
                  color: 'var(--text-primary)',
                }}
              />
              <button
                type="submit"
                disabled={isStreaming || !input.trim()}
                style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
                className="rounded-lg px-3 py-1.5 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
