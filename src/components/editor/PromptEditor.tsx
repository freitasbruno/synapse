'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useTheme } from '@/components/providers/ThemeProvider'
import { RefinementModal } from './RefinementModal'

// ─── props ────────────────────────────────────────────────────────────────────

interface PromptEditorProps {
  value: string
  onChange: (value: string) => void
  assetTitle: string
  assetType: string
}

// ─── markdown preview ─────────────────────────────────────────────────────────

function MarkdownPreview({ content, isDark }: { content: string; isDark: boolean }) {
  const codeComponents: Components = {
    code(props) {
      const { className, children } = props
      const match = /language-(\w+)/.exec(className ?? '')
      if (match) {
        return (
          <SyntaxHighlighter
            language={match[1]}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            style={isDark ? (oneDark as any) : (oneLight as any)}
            PreTag="div"
            customStyle={{ borderRadius: '0.5rem', fontSize: '0.875rem' }}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        )
      }
      return <code className={className}>{children}</code>
    },
  }

  return (
    <div className="md-content">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={codeComponents}>
        {content}
      </ReactMarkdown>
    </div>
  )
}

// ─── toolbar button ───────────────────────────────────────────────────────────

function ToolbarBtn({
  onClick,
  title,
  children,
}: {
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{ color: 'var(--text-secondary)' }}
      className="rounded px-2 py-1 text-xs font-medium transition-colors hover:[background-color:var(--bg)] hover:[color:var(--text-primary)]"
    >
      {children}
    </button>
  )
}

// ─── PromptEditor ─────────────────────────────────────────────────────────────

export function PromptEditor({ value, onChange, assetTitle, assetType }: PromptEditorProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [tab, setTab] = useState<'edit' | 'preview'>('edit')
  const [refineOpen, setRefineOpen] = useState(false)

  // Auto-grow textarea height
  function adjustHeight(el: HTMLTextAreaElement) {
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 500)}px`
  }

  // Adjust on initial render and whenever value changes from outside
  useEffect(() => {
    if (textareaRef.current) adjustHeight(textareaRef.current)
  }, [value])

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    onChange(e.target.value)
    adjustHeight(e.target)
  }

  // Wrap selected text (or place cursor) with before/after markdown syntax
  const wrapSelection = useCallback(
    (before: string, after: string) => {
      const el = textareaRef.current
      if (!el) return
      const start = el.selectionStart
      const end = el.selectionEnd
      const selected = value.slice(start, end)
      const next = value.slice(0, start) + before + selected + after + value.slice(end)
      onChange(next)
      requestAnimationFrame(() => {
        el.focus()
        el.setSelectionRange(start + before.length, end + before.length)
      })
    },
    [value, onChange],
  )

  // Prepend a prefix to the current line
  const insertAtLineStart = useCallback(
    (prefix: string) => {
      const el = textareaRef.current
      if (!el) return
      const start = el.selectionStart
      const lineStart = value.lastIndexOf('\n', start - 1) + 1
      const next = value.slice(0, lineStart) + prefix + value.slice(lineStart)
      onChange(next)
      requestAnimationFrame(() => {
        el.focus()
        el.setSelectionRange(start + prefix.length, start + prefix.length)
      })
    },
    [value, onChange],
  )

  // Wrap or insert a fenced code block
  const insertCodeBlock = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = value.slice(start, end)
    const block = '```\n' + selected + '\n```'
    const next = value.slice(0, start) + block + value.slice(end)
    onChange(next)
    requestAnimationFrame(() => {
      el.focus()
      // Place cursor inside the block
      el.setSelectionRange(start + 4, start + 4 + selected.length)
    })
  }, [value, onChange])

  return (
    <>
      {/* Field label */}
      <div>
        <p style={{ color: 'var(--text-secondary)' }} className="mb-1.5 text-sm font-medium">
          Prompt Text{' '}
          <span className="font-normal">(powers the Copy Prompt button — markdown supported)</span>
        </p>

        {/* Editor card */}
        <div
          className="overflow-hidden rounded-lg border"
          style={{ borderColor: 'var(--bg-border)' }}
        >
          {/* ── Top bar: tabs + toolbar ── */}
          <div
            className="flex items-center gap-1 border-b px-2 py-1.5"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--bg-border)' }}
          >
            {/* Segmented edit/preview control */}
            <div
              className="mr-2 flex rounded-md border p-0.5"
              style={{ borderColor: 'var(--bg-border)' }}
            >
              {(['edit', 'preview'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className="rounded px-2.5 py-0.5 text-xs font-medium capitalize transition-colors"
                  style={
                    tab === t
                      ? { backgroundColor: 'var(--accent)', color: '#fff' }
                      : { color: 'var(--text-secondary)' }
                  }
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Markdown toolbar — only in edit mode */}
            {tab === 'edit' && (
              <>
                <ToolbarBtn onClick={() => wrapSelection('**', '**')} title="Bold">
                  <strong>B</strong>
                </ToolbarBtn>
                <ToolbarBtn onClick={() => wrapSelection('*', '*')} title="Italic">
                  <em>I</em>
                </ToolbarBtn>
                <ToolbarBtn onClick={() => wrapSelection('`', '`')} title="Inline code">
                  {'</>'}
                </ToolbarBtn>
                <ToolbarBtn onClick={insertCodeBlock} title="Code block">
                  {'```'}
                </ToolbarBtn>
                <ToolbarBtn onClick={() => insertAtLineStart('## ')} title="Heading">
                  #
                </ToolbarBtn>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Refine button */}
                <button
                  type="button"
                  onClick={() => setRefineOpen(true)}
                  disabled={!value.trim()}
                  style={{ color: 'var(--accent)' }}
                  className="text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
                >
                  ✨ Refine
                </button>
              </>
            )}
          </div>

          {/* ── Edit pane ── */}
          {tab === 'edit' && (
            <div className="relative" style={{ backgroundColor: 'var(--bg)' }}>
              <textarea
                ref={textareaRef}
                value={value}
                onChange={handleChange}
                placeholder="Write your prompt here. Markdown is supported."
                className="w-full resize-none bg-transparent px-3 pb-6 pt-3 font-mono text-sm outline-none placeholder:[color:var(--text-secondary)]"
                style={{
                  color: 'var(--text-primary)',
                  minHeight: '200px',
                  maxHeight: '500px',
                  overflowY: 'auto',
                }}
              />
              {/* Character count */}
              <span
                className="pointer-events-none absolute bottom-2 right-3 text-xs"
                style={{ color: 'var(--text-secondary)' }}
              >
                {value.length} chars
              </span>
            </div>
          )}

          {/* ── Preview pane ── */}
          {tab === 'preview' && (
            <div
              className="min-h-[200px] px-4 py-4"
              style={{ backgroundColor: 'var(--bg)' }}
            >
              {value.trim() ? (
                <MarkdownPreview content={value} isDark={isDark} />
              ) : (
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Nothing to preview yet.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Refinement modal */}
      <RefinementModal
        isOpen={refineOpen}
        onClose={() => setRefineOpen(false)}
        originalContent={value}
        assetTitle={assetTitle}
        assetType={assetType}
        onAccept={(refined) => onChange(refined)}
      />
    </>
  )
}
