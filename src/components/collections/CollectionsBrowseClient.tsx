'use client'

import { useRouter, usePathname } from 'next/navigation'
import { CollectionCard } from './CollectionCard'
import type { CollectionPreview } from '@/lib/data/collections'

interface Props {
  collections: CollectionPreview[]
  currentSort: 'popular' | 'newest'
}

export function CollectionsBrowseClient({ collections, currentSort }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  function setSort(sort: string) {
    const qs = sort === 'newest' ? '?sort=newest' : ''
    router.replace(`${pathname}${qs}`, { scroll: false })
  }

  if (collections.length === 0) return null

  return (
    <div className="space-y-5">
      {/* Sort row */}
      <div className="flex items-center justify-end">
        <select
          value={currentSort}
          onChange={(e) => setSort(e.target.value)}
          aria-label="Sort order"
          className="rounded-md border px-3 py-1.5 text-sm outline-none transition-colors focus:[border-color:var(--accent)]"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--bg-border)',
            color: 'var(--text-primary)',
          }}
        >
          <option value="popular">Most Popular</option>
          <option value="newest">Newest First</option>
        </select>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((c) => (
          <CollectionCard key={c.id} collection={c} />
        ))}
      </div>
    </div>
  )
}
