'use client'

import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useTheme } from '@/components/providers/ThemeProvider'

export function PromptContentBlock({ content }: { content: string }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

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
    <div
      className="rounded-lg border p-4 text-sm leading-relaxed"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--bg-border)',
      }}
    >
      <div className="md-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={codeComponents}>
          {content}
        </ReactMarkdown>
      </div>
    </div>
  )
}
