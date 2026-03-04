'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useTheme } from '@/components/providers/ThemeProvider'
import type { Json } from '@/lib/types/database'

// ─── block types ─────────────────────────────────────────────────────────────

type TextBlock  = { type: 'text';  content: string }
type ImageBlock = { type: 'image'; url: string; caption?: string }
type VideoBlock = { type: 'video'; url: string; caption?: string }
type ContentBlock = TextBlock | ImageBlock | VideoBlock

function isContentBlock(b: unknown): b is ContentBlock {
  if (typeof b !== 'object' || b === null) return false
  const t = (b as Record<string, unknown>).type
  return t === 'text' || t === 'image' || t === 'video'
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

function Lightbox({ url, onClose }: { url: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85"
      onClick={onClose}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt=""
        className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}

// ─── ImageBlockRenderer ───────────────────────────────────────────────────────

function ImageBlockRenderer({
  block,
  onOpen,
}: {
  block: ImageBlock
  onOpen: (url: string) => void
}) {
  return (
    <figure>
      <div
        className="relative cursor-zoom-in overflow-hidden rounded-lg"
        style={{ aspectRatio: '16/9' }}
        onClick={() => onOpen(block.url)}
      >
        <Image
          src={block.url}
          alt={block.caption ?? ''}
          fill
          className="object-cover transition-transform duration-300 hover:scale-[1.02]"
          unoptimized
        />
      </div>
      {block.caption && (
        <figcaption
          style={{ color: 'var(--text-secondary)' }}
          className="mt-2 text-center text-xs"
        >
          {block.caption}
        </figcaption>
      )}
    </figure>
  )
}

// ─── VideoBlockRenderer ───────────────────────────────────────────────────────

function VideoBlockRenderer({ block }: { block: VideoBlock }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  return (
    <figure>
      <video
        ref={videoRef}
        src={block.url}
        controls
        loop
        muted
        playsInline
        className="w-full rounded-lg"
        onMouseEnter={() => { void videoRef.current?.play() }}
        onMouseLeave={() => { videoRef.current?.pause() }}
      />
      {block.caption && (
        <figcaption
          style={{ color: 'var(--text-secondary)' }}
          className="mt-2 text-center text-xs"
        >
          {block.caption}
        </figcaption>
      )}
    </figure>
  )
}

// ─── TextBlockRenderer ────────────────────────────────────────────────────────

function TextBlockRenderer({ block, isDark }: { block: TextBlock; isDark: boolean }) {
  const codeComponents: Components = {
    code(codeProps) {
      const { className, children } = codeProps
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
        {block.content}
      </ReactMarkdown>
    </div>
  )
}

// ─── SequenceRenderer (main export) ──────────────────────────────────────────

export function SequenceRenderer({ blocks }: { blocks: Json }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  const parsedBlocks = (Array.isArray(blocks) ? blocks : []).filter(isContentBlock)

  if (parsedBlocks.length === 0) {
    return (
      <p
        style={{ color: 'var(--text-secondary)' }}
        className="py-12 text-center text-sm"
      >
        No content yet.
      </p>
    )
  }

  return (
    <>
      <div className="space-y-10">
        {parsedBlocks.map((block, i) => {
          if (block.type === 'text')
            return <TextBlockRenderer key={i} block={block} isDark={isDark} />
          if (block.type === 'image')
            return (
              <ImageBlockRenderer key={i} block={block} onOpen={setLightboxUrl} />
            )
          if (block.type === 'video')
            return <VideoBlockRenderer key={i} block={block} />
          return null
        })}
      </div>

      {lightboxUrl && (
        <Lightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
      )}
    </>
  )
}
