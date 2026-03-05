'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { uploadFile } from '@/lib/storage/upload'
import { RefinementModal } from './RefinementModal'

// ─── block types (exported for AssetEditor) ───────────────────────────────────

export type TextBlock = { type: 'text'; id: string; content: string }
export type ImageBlock = { type: 'image'; id: string; url: string; caption: string }
export type VideoBlock = { type: 'video'; id: string; url: string; caption: string }
export type EditorBlock = TextBlock | ImageBlock | VideoBlock

// ─── helpers ─────────────────────────────────────────────────────────────────

const MAX_FILE_BYTES = 10 * 1024 * 1024 // 10 MB

const inputStyle = {
  backgroundColor: 'var(--bg)',
  borderColor: 'var(--bg-border)',
  color: 'var(--text-primary)',
}

// ─── BlockControls ────────────────────────────────────────────────────────────

function BlockControls({
  index,
  total,
  onMoveUp,
  onMoveDown,
  onRemove,
  onRefine,
}: {
  index: number
  total: number
  onMoveUp: () => void
  onMoveDown: () => void
  onRemove: () => void
  onRefine?: () => void
}) {
  const btnBase =
    'rounded px-1.5 py-0.5 text-xs transition-colors disabled:opacity-30 hover:[background-color:var(--bg-border)]'

  return (
    <div className="mb-1.5 flex items-center gap-1">
      <button
        type="button"
        onClick={onMoveUp}
        disabled={index === 0}
        style={{ color: 'var(--text-secondary)' }}
        className={btnBase}
        aria-label="Move block up"
      >
        ↑
      </button>
      <button
        type="button"
        onClick={onMoveDown}
        disabled={index === total - 1}
        style={{ color: 'var(--text-secondary)' }}
        className={btnBase}
        aria-label="Move block down"
      >
        ↓
      </button>
      {onRefine && (
        <button
          type="button"
          onClick={onRefine}
          style={{ color: 'var(--accent)' }}
          className={btnBase}
          aria-label="Refine this block with AI"
        >
          ✨ Refine
        </button>
      )}
      <button
        type="button"
        onClick={onRemove}
        style={{ color: '#ef4444' }}
        className={`${btnBase} ml-auto`}
        aria-label="Remove block"
      >
        ✕ Remove
      </button>
    </div>
  )
}

// ─── TextBlockEditor ──────────────────────────────────────────────────────────

function TextBlockEditor({
  block,
  onChange,
}: {
  block: TextBlock
  onChange: (updates: Partial<TextBlock>) => void
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function wrap(before: string, after: string) {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = ta.value.slice(start, end)
    const newContent =
      ta.value.slice(0, start) + before + selected + after + ta.value.slice(end)
    onChange({ content: newContent })
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(start + before.length, end + before.length)
    })
  }

  const toolBtn =
    'rounded px-2 py-0.5 text-xs transition-colors hover:[background-color:var(--bg-border)]'

  return (
    <div
      className="overflow-hidden rounded-lg border"
      style={{ borderColor: 'var(--bg-border)' }}
    >
      {/* Toolbar */}
      <div
        className="flex items-center gap-1 border-b px-2 py-1.5"
        style={{ borderColor: 'var(--bg-border)', backgroundColor: 'var(--bg-surface)' }}
      >
        <button
          type="button"
          onClick={() => wrap('**', '**')}
          style={{ color: 'var(--text-primary)', fontWeight: 700 }}
          className={toolBtn}
          title="Bold"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => wrap('*', '*')}
          style={{ color: 'var(--text-primary)', fontStyle: 'italic' }}
          className={toolBtn}
          title="Italic"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => wrap('`', '`')}
          style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}
          className={toolBtn}
          title="Inline code"
        >
          Code
        </button>
        <button
          type="button"
          onClick={() => wrap('```\n', '\n```')}
          style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}
          className={toolBtn}
          title="Code block"
        >
          Block
        </button>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={block.content}
        onChange={(e) => onChange({ content: e.target.value })}
        rows={6}
        placeholder="Write in Markdown…"
        className="w-full resize-y px-3 py-2.5 text-sm outline-none"
        style={{ backgroundColor: 'var(--bg)', color: 'var(--text-primary)' }}
      />

      {/* Char count */}
      <div
        className="border-t px-3 py-1 text-right"
        style={{ borderColor: 'var(--bg-border)', backgroundColor: 'var(--bg)' }}
      >
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {block.content.length} chars
        </span>
      </div>
    </div>
  )
}

// ─── ImageBlockEditor ─────────────────────────────────────────────────────────

function ImageBlockEditor({
  block,
  progress,
  onFileSelect,
  onCaptionChange,
  onClearImage,
}: {
  block: ImageBlock
  progress?: number
  onFileSelect: (file: File) => void
  onCaptionChange: (caption: string) => void
  onClearImage: () => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (progress !== undefined && !block.url) {
    return (
      <div
        className="flex h-32 items-center justify-center rounded-lg border"
        style={{ borderColor: 'var(--bg-border)', backgroundColor: 'var(--bg-surface)' }}
      >
        <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
          Uploading image…
        </p>
      </div>
    )
  }

  if (block.url) {
    return (
      <div className="space-y-2">
        <div className="relative overflow-hidden rounded-lg" style={{ aspectRatio: '16/9' }}>
          <Image
            src={block.url}
            alt={block.caption || 'Uploaded image'}
            fill
            unoptimized
            className="object-cover"
          />
          <button
            type="button"
            onClick={onClearImage}
            className="absolute right-2 top-2 rounded-md bg-black/60 px-2 py-1 text-xs text-white hover:bg-black/80"
          >
            Change image
          </button>
        </div>
        <input
          type="text"
          value={block.caption}
          onChange={(e) => onCaptionChange(e.target.value)}
          placeholder="Caption (optional)"
          className="w-full rounded-lg border px-3 py-1.5 text-sm outline-none focus:[border-color:var(--accent)]"
          style={inputStyle}
        />
      </div>
    )
  }

  return (
    <div
      className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors hover:[border-color:var(--accent)]"
      style={{ borderColor: 'var(--bg-border)' }}
      onClick={() => fileInputRef.current?.click()}
    >
      <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
        Click to upload image
      </p>
      <p style={{ color: 'var(--text-secondary)' }} className="mt-1 text-xs">
        Max 10 MB · JPG, PNG, GIF, WebP
      </p>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onFileSelect(file)
        }}
      />
    </div>
  )
}

// ─── VideoBlockEditor ─────────────────────────────────────────────────────────

function VideoBlockEditor({
  block,
  progress,
  onFileSelect,
  onCaptionChange,
  onClearVideo,
}: {
  block: VideoBlock
  progress?: number
  onFileSelect: (file: File) => void
  onCaptionChange: (caption: string) => void
  onClearVideo: () => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (progress !== undefined && !block.url) {
    return (
      <div
        className="flex h-32 items-center justify-center rounded-lg border"
        style={{ borderColor: 'var(--bg-border)', backgroundColor: 'var(--bg-surface)' }}
      >
        <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
          Uploading video…
        </p>
      </div>
    )
  }

  if (block.url) {
    return (
      <div className="space-y-2">
        <div
          className="flex items-center justify-between rounded-lg border px-3 py-2.5"
          style={{ borderColor: 'var(--bg-border)', backgroundColor: 'var(--bg-surface)' }}
        >
          <span className="truncate text-sm" style={{ color: 'var(--text-primary)' }}>
            {block.url.split('/').pop() ?? 'video'}
          </span>
          <button
            type="button"
            onClick={onClearVideo}
            className="ml-3 shrink-0 text-xs"
            style={{ color: '#ef4444' }}
          >
            Remove
          </button>
        </div>
        <input
          type="text"
          value={block.caption}
          onChange={(e) => onCaptionChange(e.target.value)}
          placeholder="Caption (optional)"
          className="w-full rounded-lg border px-3 py-1.5 text-sm outline-none focus:[border-color:var(--accent)]"
          style={inputStyle}
        />
      </div>
    )
  }

  return (
    <div
      className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors hover:[border-color:var(--accent)]"
      style={{ borderColor: 'var(--bg-border)' }}
      onClick={() => fileInputRef.current?.click()}
    >
      <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
        Click to upload video
      </p>
      <p style={{ color: 'var(--text-secondary)' }} className="mt-1 text-xs">
        Max 10 MB · MP4, WebM
      </p>
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onFileSelect(file)
        }}
      />
    </div>
  )
}

// ─── SequenceBuilder (main export) ───────────────────────────────────────────

interface SequenceBuilderProps {
  blocks: EditorBlock[]
  assetId: string
  assetTitle: string
  assetType: string
  onChange: (blocks: EditorBlock[]) => void
  onBlockRefined?: (updatedBlocks: EditorBlock[]) => void
}

export function SequenceBuilder({ blocks, assetId, assetTitle, assetType, onChange, onBlockRefined }: SequenceBuilderProps) {
  const [progress, setProgress] = useState<Map<string, number>>(new Map())
  const [refineBlockId, setRefineBlockId] = useState<string | null>(null)

  const refineBlock = blocks.find((b) => b.id === refineBlockId && b.type === 'text') as
    | (TextBlock & { id: string })
    | undefined

  function updateBlock(id: string, updates: Partial<EditorBlock>) {
    onChange(
      blocks.map((b) => (b.id === id ? ({ ...b, ...updates } as EditorBlock) : b)),
    )
  }

  function removeBlock(id: string) {
    onChange(blocks.filter((b) => b.id !== id))
  }

  function moveBlock(id: string, dir: 'up' | 'down') {
    const idx = blocks.findIndex((b) => b.id === id)
    if (dir === 'up' && idx === 0) return
    if (dir === 'down' && idx === blocks.length - 1) return
    const next = [...blocks]
    const swap = dir === 'up' ? idx - 1 : idx + 1
    ;[next[idx], next[swap]] = [next[swap]!, next[idx]!]
    onChange(next)
  }

  function addTextBlock() {
    onChange([...blocks, { type: 'text', id: crypto.randomUUID(), content: '' }])
  }

  function addImageBlock() {
    onChange([...blocks, { type: 'image', id: crypto.randomUUID(), url: '', caption: '' }])
  }

  function addVideoBlock() {
    onChange([...blocks, { type: 'video', id: crypto.randomUUID(), url: '', caption: '' }])
  }

  async function handleFileUpload(
    blockId: string,
    file: File,
    kind: 'images' | 'videos',
  ) {
    if (file.size > MAX_FILE_BYTES) {
      alert('File exceeds the 10 MB limit.')
      return
    }
    const ext = file.name.split('.').pop() ?? ''
    const path = `assets/${assetId}/${kind}/${Date.now()}.${ext}`
    setProgress((prev) => new Map(prev).set(blockId, 0))
    try {
      const url = await uploadFile('assets', path, file, (pct) => {
        setProgress((prev) => new Map(prev).set(blockId, pct))
      })
      updateBlock(blockId, { url })
    } catch (err) {
      console.error('Upload failed:', err)
      alert('Upload failed. Please try again.')
    } finally {
      setProgress((prev) => {
        const m = new Map(prev)
        m.delete(blockId)
        return m
      })
    }
  }

  const addBtnBase =
    'rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:[background-color:var(--bg-surface)]'

  return (
    <div className="space-y-4">
      {/* Block list */}
      {blocks.map((block, idx) => (
        <div
          key={block.id}
          className="rounded-xl border p-3"
          style={{ borderColor: 'var(--bg-border)', backgroundColor: 'var(--bg-surface)' }}
        >
          <BlockControls
            index={idx}
            total={blocks.length}
            onMoveUp={() => moveBlock(block.id, 'up')}
            onMoveDown={() => moveBlock(block.id, 'down')}
            onRemove={() => removeBlock(block.id)}
            onRefine={block.type === 'text' ? () => setRefineBlockId(block.id) : undefined}
          />

          {block.type === 'text' && (
            <TextBlockEditor
              block={block}
              onChange={(updates) => updateBlock(block.id, updates)}
            />
          )}

          {block.type === 'image' && (
            <ImageBlockEditor
              block={block}
              progress={progress.get(block.id)}
              onFileSelect={(file) => void handleFileUpload(block.id, file, 'images')}
              onCaptionChange={(caption) => updateBlock(block.id, { caption })}
              onClearImage={() => updateBlock(block.id, { url: '', caption: '' })}
            />
          )}

          {block.type === 'video' && (
            <VideoBlockEditor
              block={block}
              progress={progress.get(block.id)}
              onFileSelect={(file) => void handleFileUpload(block.id, file, 'videos')}
              onCaptionChange={(caption) => updateBlock(block.id, { caption })}
              onClearVideo={() => updateBlock(block.id, { url: '', caption: '' })}
            />
          )}
        </div>
      ))}

      {/* Add block buttons */}
      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          onClick={addTextBlock}
          style={{ borderColor: 'var(--bg-border)', color: 'var(--text-secondary)' }}
          className={addBtnBase}
        >
          + Text Block
        </button>
        <button
          type="button"
          onClick={addImageBlock}
          style={{ borderColor: 'var(--bg-border)', color: 'var(--text-secondary)' }}
          className={addBtnBase}
        >
          + Image
        </button>
        <button
          type="button"
          onClick={addVideoBlock}
          style={{ borderColor: 'var(--bg-border)', color: 'var(--text-secondary)' }}
          className={addBtnBase}
        >
          + Video
        </button>
      </div>

      {/* Refinement modal */}
      <RefinementModal
        isOpen={refineBlockId !== null}
        onClose={() => setRefineBlockId(null)}
        originalContent={refineBlock?.content ?? ''}
        assetTitle={assetTitle}
        assetType={assetType}
        onAccept={(refined) => {
          if (!refineBlockId) return
          const updatedBlocks = blocks.map((b) =>
            b.id === refineBlockId ? ({ ...b, content: refined } as EditorBlock) : b,
          )
          onChange(updatedBlocks)
          setRefineBlockId(null)
          onBlockRefined?.(updatedBlocks)
        }}
      />
    </div>
  )
}
