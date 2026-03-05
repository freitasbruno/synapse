'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SequenceBuilder } from './SequenceBuilder'
import { SequenceRenderer } from '@/components/asset/SequenceRenderer'
import type { AssetRow } from '@/lib/data/assets'
import type { EditorBlock } from './SequenceBuilder'
import type { Json } from '@/lib/types/database'

// ─── helpers ─────────────────────────────────────────────────────────────────

type AssetType = AssetRow['type']

function blocksToJson(blocks: EditorBlock[]): Json {
  return blocks.map((b) => {
    if (b.type === 'text') return { type: 'text', content: b.content }
    const caption = b.caption.trim() || undefined
    if (b.type === 'image') return { type: 'image', url: b.url, ...(caption ? { caption } : {}) }
    return { type: 'video', url: b.url, ...(caption ? { caption } : {}) }
  })
}

function jsonToBlocks(seq: Json): EditorBlock[] {
  if (!Array.isArray(seq)) return []
  return (seq as unknown[]).flatMap((item): EditorBlock[] => {
    if (typeof item !== 'object' || item === null) return []
    const b = item as Record<string, unknown>
    if (b.type === 'text')
      return [{ type: 'text', id: crypto.randomUUID(), content: String(b.content ?? '') }]
    if (b.type === 'image')
      return [
        {
          type: 'image',
          id: crypto.randomUUID(),
          url: String(b.url ?? ''),
          caption: String(b.caption ?? ''),
        },
      ]
    if (b.type === 'video')
      return [
        {
          type: 'video',
          id: crypto.randomUUID(),
          url: String(b.url ?? ''),
          caption: String(b.caption ?? ''),
        },
      ]
    return []
  })
}

// ─── props ────────────────────────────────────────────────────────────────────

interface AssetEditorProps {
  initialData?: Partial<AssetRow>
  mode: 'create' | 'edit'
  creatorId: string
}

// ─── AssetEditor ──────────────────────────────────────────────────────────────

export function AssetEditor({ initialData, mode, creatorId }: AssetEditorProps) {
  const router = useRouter()

  // Stable asset ID — generated once on mount for new assets
  const [assetId] = useState<string>(() => initialData?.id ?? crypto.randomUUID())

  // ── Form state ────────────────────────────────────────────────────────────
  const [title, setTitle] = useState(initialData?.title ?? '')
  const [type, setType] = useState<AssetType>(initialData?.type ?? 'prompt')
  const [externalUrl, setExternalUrl] = useState(initialData?.external_url ?? '')
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? [])
  const [tagInput, setTagInput] = useState('')
  const [content, setContent] = useState(initialData?.content ?? '')
  const [blocks, setBlocks] = useState<EditorBlock[]>(() =>
    jsonToBlocks(initialData?.description_sequence ?? []),
  )

  // ── UI state ──────────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [publishErrors, setPublishErrors] = useState<string[]>([])

  // Track whether a DB row exists yet (true for edit, false for new create)
  const isInsertedRef = useRef(mode === 'edit')

  // Keep latest save function accessible from auto-save timer
  const saveAssetRef = useRef<((status: 'draft' | 'published') => Promise<boolean>) | null>(null)

  // ── Dirty tracking ────────────────────────────────────────────────────────
  const isMountedRef = useRef(false)
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true
      return
    }
    setHasUnsavedChanges(true)
    setPublishErrors([])
  }, [title, type, externalUrl, tags, content, blocks])

  // ── beforeunload warning ──────────────────────────────────────────────────
  useEffect(() => {
    function handler(e: BeforeUnloadEvent) {
      if (hasUnsavedChanges) e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [hasUnsavedChanges])

  // ── Auto-save (30 s debounce) ─────────────────────────────────────────────
  useEffect(() => {
    if (!isMountedRef.current) return
    const timer = setTimeout(() => {
      if (hasUnsavedChanges) void saveAssetRef.current?.('draft')
    }, 30_000)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, type, externalUrl, tags, content, blocks])

  // ── Core save function ────────────────────────────────────────────────────
  async function saveAsset(status: 'draft' | 'published'): Promise<boolean> {
    setSaveStatus('saving')
    const supabase = createClient()

    const payload = {
      id: assetId,
      creator_id: creatorId,
      title: title.trim() || 'Untitled Asset',
      type,
      external_url: externalUrl.trim() || null,
      tags,
      content: type === 'prompt' ? (content.trim() || null) : null,
      description_sequence: blocksToJson(blocks),
      status,
      updated_at: new Date().toISOString(),
      ...(status === 'published' ? { last_published_at: new Date().toISOString() } : {}),
    }

    let saveError: string | null = null

    if (!isInsertedRef.current) {
      const { error } = await supabase.from('assets').insert(payload)
      if (error) {
        saveError = error.message
      } else {
        isInsertedRef.current = true
        // Update the URL bar without triggering a server re-render.
        // router.replace would re-fetch the edit page from the server, which
        // requires the "Owners can read own drafts" RLS policy to be in place
        // and would also reset all editor state. replaceState avoids both.
        window.history.replaceState({}, '', `/asset/${assetId}/edit`)
      }
    } else {
      const { error } = await supabase
        .from('assets')
        .update(payload)
        .eq('id', assetId)
      if (error) saveError = error.message
    }

    if (saveError) {
      console.error('[AssetEditor] save error:', saveError)
      setSaveStatus('idle')
      return false
    }

    setSaveStatus('saved')
    setHasUnsavedChanges(false)
    setTimeout(() => setSaveStatus('idle'), 2000)
    return true
  }

  // Keep ref in sync
  saveAssetRef.current = saveAsset

  // ── Tag handling ──────────────────────────────────────────────────────────
  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const tag = tagInput.trim().toLowerCase().replace(/,/g, '')
      if (tag && !tags.includes(tag) && tags.length < 10) {
        setTags([...tags, tag])
      }
      setTagInput('')
    } else if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) {
      setTags(tags.slice(0, -1))
    }
  }

  // ── Publish ───────────────────────────────────────────────────────────────
  async function handlePublish() {
    const errors: string[] = []
    if (!title.trim()) errors.push('Title is required.')
    if (blocks.length === 0) errors.push('Add at least one content block.')
    if (errors.length > 0) {
      setPublishErrors(errors)
      return
    }
    setPublishErrors([])
    const ok = await saveAsset('published')
    if (ok) router.push(`/asset/${assetId}`)
  }

  // ─── Styles ───────────────────────────────────────────────────────────────
  const inputBase =
    'w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:[border-color:var(--accent)] placeholder:[color:var(--text-secondary)]'
  const fieldStyle = {
    backgroundColor: 'var(--bg)',
    borderColor: 'var(--bg-border)',
    color: 'var(--text-primary)',
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:px-6">

      {/* ── Top bar ── */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled Asset"
          className="min-w-0 flex-1 border-0 bg-transparent text-2xl font-bold tracking-tight outline-none placeholder:[color:var(--text-secondary)]"
          style={{ color: 'var(--text-primary)' }}
        />

        {/* Edit / Preview toggle */}
        <div
          className="flex rounded-lg border p-0.5"
          style={{ borderColor: 'var(--bg-border)', backgroundColor: 'var(--bg-surface)' }}
        >
          {(['edit', 'preview'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setViewMode(m)}
              className="rounded-md px-3 py-1 text-sm font-medium capitalize transition-colors"
              style={
                viewMode === m
                  ? { backgroundColor: 'var(--accent)', color: '#ffffff' }
                  : { color: 'var(--text-secondary)' }
              }
            >
              {m}
            </button>
          ))}
        </div>

        {/* Save Draft */}
        <button
          type="button"
          onClick={() => void saveAsset('draft')}
          disabled={saveStatus === 'saving'}
          style={{ borderColor: 'var(--bg-border)', color: 'var(--text-primary)' }}
          className="rounded-lg border px-4 py-2 text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          {saveStatus === 'saving'
            ? 'Saving…'
            : saveStatus === 'saved'
              ? '✓ Saved'
              : 'Save Draft'}
        </button>

        {/* Publish */}
        <button
          type="button"
          onClick={() => void handlePublish()}
          disabled={saveStatus === 'saving'}
          style={{ backgroundColor: 'var(--accent)', color: '#ffffff' }}
          className="rounded-lg px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          Publish
        </button>
      </div>

      {/* Publish errors */}
      {publishErrors.length > 0 && (
        <div className="mb-4 rounded-lg bg-red-500/10 px-4 py-3">
          {publishErrors.map((e) => (
            <p key={e} className="text-sm text-red-400">
              {e}
            </p>
          ))}
        </div>
      )}

      {/* ── Fields (always visible) ── */}
      <div className="mb-6 space-y-4">

        {/* Type */}
        <div>
          <label
            htmlFor="asset_type"
            style={{ color: 'var(--text-secondary)' }}
            className="mb-1.5 block text-sm font-medium"
          >
            Asset Type
          </label>
          <select
            id="asset_type"
            value={type}
            onChange={(e) => setType(e.target.value as AssetType)}
            className={`${inputBase} cursor-pointer`}
            style={fieldStyle}
          >
            <option value="prompt">Prompt</option>
            <option value="tool">Tool</option>
            <option value="app">App</option>
            <option value="workflow">Workflow</option>
          </select>
        </div>

        {/* External URL */}
        <div>
          <label
            htmlFor="external_url"
            style={{ color: 'var(--text-secondary)' }}
            className="mb-1.5 block text-sm font-medium"
          >
            External Link{' '}
            <span style={{ color: 'var(--text-secondary)' }} className="font-normal">
              (optional)
            </span>
          </label>
          <input
            id="external_url"
            type="url"
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
            placeholder="https://"
            className={inputBase}
            style={fieldStyle}
          />
        </div>

        {/* Tags */}
        <div>
          <label
            htmlFor="tags_input"
            style={{ color: 'var(--text-secondary)' }}
            className="mb-1.5 block text-sm font-medium"
          >
            Tags{' '}
            <span style={{ color: 'var(--text-secondary)' }} className="font-normal">
              (press Enter or comma to add, max 10)
            </span>
          </label>
          <div
            className="flex min-h-[42px] flex-wrap items-center gap-1.5 rounded-lg border px-2 py-1.5 transition-colors focus-within:[border-color:var(--accent)]"
            style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--bg-border)' }}
          >
            {tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                style={{ backgroundColor: 'var(--accent)', color: '#ffffff', opacity: 0.85 }}
              >
                {tag}
                <button
                  type="button"
                  onClick={() => setTags(tags.filter((t) => t !== tag))}
                  className="leading-none transition-opacity hover:opacity-70"
                  aria-label={`Remove tag ${tag}`}
                >
                  ×
                </button>
              </span>
            ))}
            {tags.length < 10 && (
              <input
                id="tags_input"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder={tags.length === 0 ? 'e.g. gpt-4, coding' : ''}
                className="min-w-[120px] flex-1 bg-transparent text-sm outline-none placeholder:[color:var(--text-secondary)]"
                style={{ color: 'var(--text-primary)' }}
              />
            )}
          </div>
        </div>

        {/* Prompt content (only for prompt type) */}
        {type === 'prompt' && (
          <div>
            <label
              htmlFor="prompt_content"
              style={{ color: 'var(--text-secondary)' }}
              className="mb-1.5 block text-sm font-medium"
            >
              Prompt Text{' '}
              <span style={{ color: 'var(--text-secondary)' }} className="font-normal">
                (powers the Copy Prompt button)
              </span>
            </label>
            <textarea
              id="prompt_content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              placeholder="Enter the full prompt text here…"
              className="w-full resize-y rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:[border-color:var(--accent)] placeholder:[color:var(--text-secondary)]"
              style={fieldStyle}
            />
          </div>
        )}
      </div>

      {/* ── Divider ── */}
      <hr style={{ borderColor: 'var(--bg-border)' }} className="mb-6" />

      {/* ── Content area: Edit or Preview ── */}
      {viewMode === 'edit' ? (
        <div>
          <h2
            style={{ color: 'var(--text-primary)' }}
            className="mb-4 text-base font-semibold"
          >
            Content Blocks
          </h2>
          <SequenceBuilder
            blocks={blocks}
            assetId={assetId}
            onChange={(next) => setBlocks(next)}
          />
        </div>
      ) : (
        <div>
          <h2
            style={{ color: 'var(--text-primary)' }}
            className="mb-4 text-base font-semibold"
          >
            Preview
          </h2>
          <SequenceRenderer blocks={blocksToJson(blocks)} />
        </div>
      )}
    </div>
  )
}
