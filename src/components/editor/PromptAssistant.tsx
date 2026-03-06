'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'

// ─── types ────────────────────────────────────────────────────────────────────

type ContentPart =
  | { type: 'text'; content: string }
  | { type: 'code'; lang: string; content: string }

interface PromptAssistantProps {
  assetTitle: string
  onInsert: (content: string) => void
}

// ─── constants ────────────────────────────────────────────────────────────────

const OPENING_MESSAGE =
  "Hi! I'll help you write a great prompt. Let's start with the basics — what should this prompt help the AI do? For example: 'summarise meeting notes', 'write cold emails', 'explain code to beginners'."

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Extract text content from a UIMessage's parts */
function getMessageText(m: UIMessage): string {
  return m.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('')
}

/** Parse message text into text and code-block segments */
function parseContent(text: string): ContentPart[] {
  const parts: ContentPart[] = []
  const fence = /```([^\n]*)\n?([\s\S]*?)```/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = fence.exec(text)) !== null) {
    if (m.index > last) {
      parts.push({ type: 'text', content: text.slice(last, m.index) })
    }
    parts.push({ type: 'code', lang: m[1].trim(), content: m[2] ?? '' })
    last = m.index + m[0].length
  }
  if (last < text.length) {
    parts.push({ type: 'text', content: text.slice(last) })
  }
  return parts
}

/** Extract the content of the last fenced code block from the text */
function extractLastCodeBlock(text: string): string {
  const matches = [...text.matchAll(/```[^\n]*\n?([\s\S]*?)```/g)]
  const last = matches[matches.length - 1]
  return last ? (last[1] ?? '').trim() : ''
}

/** Format a date as a relative time string */
function relativeTime(date: Date): string {
  const s = Math.floor((Date.now() - date.getTime()) / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  return `${Math.floor(m / 60)}h ago`
}

// ─── icons ────────────────────────────────────────────────────────────────────

function PaperPlaneIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}

// ─── MessageBubble ────────────────────────────────────────────────────────────

function MessageBubble({ message, timestamp }: { message: UIMessage; timestamp: Date }) {
  const isUser = message.role === 'user'
  const text = getMessageText(message)
  const parts = parseContent(text)

  return (
    <div className={`group flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className="relative max-w-[85%]">
        {/* Bubble */}
        <div
          className="rounded-xl px-3 py-2 text-sm leading-relaxed"
          style={
            isUser
              ? { backgroundColor: 'var(--accent)', color: '#fff' }
              : { backgroundColor: 'var(--bg)', color: 'var(--text-primary)', border: '1px solid var(--bg-border)' }
          }
        >
          {parts.length === 0 ? (
            <span style={{ color: 'var(--text-secondary)' }} className="animate-pulse">
              Thinking…
            </span>
          ) : (
            parts.map((part, i) =>
              part.type === 'code' ? (
                <div
                  key={i}
                  className="my-2 overflow-x-auto rounded-lg border px-3 py-2.5 font-mono text-xs leading-relaxed"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--bg-border)',
                    color: 'var(--text-primary)',
                    whiteSpace: 'pre',
                  }}
                >
                  {part.content}
                </div>
              ) : (
                <span key={i} className="whitespace-pre-wrap">
                  {part.content}
                </span>
              ),
            )
          )}
        </div>

        {/* Timestamp — shown on hover */}
        <span
          className="absolute -bottom-4 text-[10px] opacity-0 transition-opacity group-hover:opacity-100"
          style={{
            color: 'var(--text-secondary)',
            [isUser ? 'right' : 'left']: '4px',
          }}
        >
          {relativeTime(timestamp)}
        </span>
      </div>
    </div>
  )
}

// ─── stable timestamp cache ───────────────────────────────────────────────────
// Module-level Map: records first-seen time per message ID.
// Using module scope (not a ref) avoids both react-hooks/refs and
// react-hooks/set-state-in-effect lint rules while staying idempotent.

const msgTimestamps = new Map<string, Date>()

function getOrSetTimestamp(id: string): Date {
  if (!msgTimestamps.has(id)) msgTimestamps.set(id, new Date())
  return msgTimestamps.get(id)!
}

// ─── PromptAssistant ──────────────────────────────────────────────────────────

const openingMsg: UIMessage = {
  id: 'opening',
  role: 'assistant',
  parts: [{ type: 'text', text: OPENING_MESSAGE }],
}

export function PromptAssistant({ assetTitle, onInsert }: PromptAssistantProps) {
  const [open, setOpen] = useState(false)
  const [localInput, setLocalInput] = useState('')
  const [inserted, setInserted] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/prompt-assistant',
      body: { assetTitle },
    }),
    messages: [openingMsg],
  })

  const isLoading = status === 'submitted' || status === 'streaming'

  // Scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus textarea when panel opens
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => textareaRef.current?.focus(), 50)
      return () => clearTimeout(t)
    }
  }, [open])

  // Detect if any non-opening assistant message contains a drafted prompt
  const draftMessage = [...messages]
    .reverse()
    .find((m) => m.role === 'assistant' && m.id !== 'opening' && getMessageText(m).includes('```'))

  function clearConversation() {
    setMessages([openingMsg])
    setLocalInput('')
    setInserted(false)
  }

  function handleInsert() {
    if (!draftMessage) return
    const draft = extractLastCodeBlock(getMessageText(draftMessage))
    if (!draft) return
    onInsert(draft)
    setInserted(true)
    setTimeout(() => {
      setInserted(false)
      setOpen(false)
    }, 1500)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!localInput.trim() || isLoading) return
    void sendMessage({ text: localInput.trim() })
    setLocalInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setLocalInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      formRef.current?.requestSubmit()
    }
  }

  return (
    <div className="mt-4">
      {/* ── Trigger ── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{ color: 'var(--text-secondary)', borderColor: 'var(--bg-border)' }}
        className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors hover:[border-color:var(--text-secondary)] hover:[color:var(--text-primary)]"
      >
        {open ? (
          <>
            <span>✕</span>
            <span>Close Assistant</span>
          </>
        ) : (
          <>
            <span>💡</span>
            <span>Need help writing this prompt?</span>
          </>
        )}
      </button>

      {/* ── Panel with smooth height transition ── */}
      <div
        className="overflow-hidden transition-all duration-200 ease-out"
        style={{ maxHeight: open ? '700px' : '0', opacity: open ? 1 : 0 }}
      >
        <div
          className="mt-2 flex flex-col overflow-hidden rounded-xl border"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--bg-border)',
            height: '520px',
          }}
        >
          {/* ── Top bar ── */}
          <div
            className="flex shrink-0 items-start justify-between border-b px-4 py-3"
            style={{ borderColor: 'var(--bg-border)' }}
          >
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                ✨ Prompt Assistant
              </p>
              <p className="mt-0.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                Answer a few questions and I&apos;ll draft your prompt
              </p>
            </div>
            <button
              type="button"
              onClick={clearConversation}
              className="mt-0.5 shrink-0 text-xs transition-opacity hover:opacity-70"
              style={{ color: 'var(--text-secondary)' }}
            >
              Clear conversation
            </button>
          </div>

          {/* ── Message history ── */}
          <div
            className="flex-1 space-y-5 overflow-y-auto px-4 pb-4 pt-3"
            style={{ minHeight: '200px', maxHeight: '400px' }}
          >
            {messages.map((m) => (
              <MessageBubble
                key={m.id}
                message={m}
                timestamp={getOrSetTimestamp(m.id)}
              />
            ))}

            {/* Streaming indicator when waiting for first chunk */}
            {isLoading && getMessageText(messages[messages.length - 1] ?? openingMsg) === '' && (
              <div className="flex justify-start">
                <div
                  className="rounded-xl px-3 py-2 text-sm"
                  style={{ backgroundColor: 'var(--bg)', color: 'var(--text-secondary)', border: '1px solid var(--bg-border)' }}
                >
                  <span className="animate-pulse">Thinking…</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ── Insert button ── */}
          {draftMessage && !isLoading && (
            <div
              className="shrink-0 border-t px-4 py-2.5"
              style={{ borderColor: 'var(--bg-border)' }}
            >
              <button
                type="button"
                onClick={handleInsert}
                style={
                  inserted
                    ? { backgroundColor: '#22c55e', color: '#fff' }
                    : { backgroundColor: 'var(--accent)', color: '#fff' }
                }
                className="w-full rounded-lg py-2 text-sm font-medium transition-all hover:opacity-90"
              >
                {inserted ? '✓ Inserted!' : 'Insert into prompt →'}
              </button>
            </div>
          )}

          {/* ── Input area ── */}
          <div
            className="shrink-0 border-t px-3 py-2.5"
            style={{ borderColor: 'var(--bg-border)' }}
          >
            <form ref={formRef} onSubmit={handleSubmit} className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={localInput}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="Type your answer…"
                disabled={isLoading}
                rows={1}
                className="flex-1 resize-none rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:[border-color:var(--accent)] placeholder:[color:var(--text-secondary)] disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--bg)',
                  borderColor: 'var(--bg-border)',
                  color: 'var(--text-primary)',
                  minHeight: '38px',
                  maxHeight: '120px',
                  overflowY: 'auto',
                }}
              />
              <button
                type="submit"
                disabled={isLoading || !localInput.trim()}
                style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
                className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                <PaperPlaneIcon />
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
