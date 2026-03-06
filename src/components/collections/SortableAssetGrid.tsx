'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AssetCard } from '@/components/gallery/AssetCard'
import type { AssetRow } from '@/lib/data/assets'
import type { AssetPreview } from '@/lib/data/assets'

// ─── icons ────────────────────────────────────────────────────────────────────

function DragHandleIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  )
}

// ─── SortableItem ─────────────────────────────────────────────────────────────

function SortableItem({
  asset,
  collectionId,
  onRemove,
}: {
  asset: AssetRow
  collectionId: string
  onRemove: (assetId: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: asset.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
  }

  async function handleRemove(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const res = await fetch(`/api/collections/${collectionId}/assets`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assetId: asset.id }),
    })
    if (res.ok) onRemove(asset.id)
  }

  return (
    <div ref={setNodeRef} style={style} className="group relative">
      {/* Drag handle */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        className="absolute left-2 top-2 z-10 cursor-grab rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
        style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
      >
        <DragHandleIcon />
      </button>

      {/* Remove button */}
      <button
        type="button"
        onClick={(e) => void handleRemove(e)}
        aria-label="Remove from collection"
        className="absolute right-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full text-xs opacity-0 transition-opacity group-hover:opacity-100"
        style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#ef4444' }}
      >
        ✕
      </button>

      <AssetCard asset={asset as AssetPreview} isAuthenticated />
    </div>
  )
}

// ─── SortableAssetGrid ────────────────────────────────────────────────────────

interface Props {
  initialAssets: AssetRow[]
  collectionId: string
  isOwner: boolean
}

export function SortableAssetGrid({ initialAssets, collectionId, isOwner }: Props) {
  const [assets, setAssets] = useState(initialAssets)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = assets.findIndex((a) => a.id === active.id)
    const newIndex = assets.findIndex((a) => a.id === over.id)
    const reordered = arrayMove(assets, oldIndex, newIndex)
    setAssets(reordered) // optimistic

    await fetch(`/api/collections/${collectionId}/reorder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedAssetIds: reordered.map((a) => a.id) }),
    })
  }

  function handleRemove(assetId: string) {
    setAssets((prev) => prev.filter((a) => a.id !== assetId))
  }

  if (assets.length === 0) {
    return (
      <p
        className="py-16 text-center text-sm"
        style={{ color: 'var(--text-secondary)' }}
      >
        This collection has no assets yet.
      </p>
    )
  }

  if (!isOwner) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {assets.map((asset) => (
          <AssetCard key={asset.id} asset={asset as AssetPreview} isAuthenticated />
        ))}
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={(e) => void handleDragEnd(e)}
    >
      <SortableContext items={assets.map((a) => a.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => (
            <SortableItem
              key={asset.id}
              asset={asset}
              collectionId={collectionId}
              onRemove={handleRemove}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
