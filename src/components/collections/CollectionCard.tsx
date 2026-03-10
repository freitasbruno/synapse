import Link from 'next/link'
import type { CollectionPreview } from '@/lib/data/collections'

function StarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

interface Props {
  collection: CollectionPreview
}

export function CollectionCard({ collection }: Props) {
  return (
    <Link
      href={`/collections/${collection.id}`}
      className="flex h-full flex-col rounded-xl border p-4 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:[border-color:var(--accent)]"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--bg-border)',
      }}
    >
      <h3
        className="line-clamp-2 text-sm font-semibold leading-snug"
        style={{ color: 'var(--text-primary)' }}
      >
        {collection.title}
      </h3>

      {collection.description && (
        <p
          className="mt-1.5 line-clamp-2 text-xs leading-relaxed"
          style={{ color: 'var(--text-secondary)' }}
        >
          {collection.description}
        </p>
      )}

      <div className="flex-1" />

      <div
        className="mt-3 flex items-center gap-3 border-t pt-3 text-xs"
        style={{ borderColor: 'var(--bg-border)', color: 'var(--text-secondary)' }}
      >
        <span className="min-w-0 flex-1 truncate">by {collection.creator_name}</span>
        <span>{collection.asset_count} {collection.asset_count === 1 ? 'asset' : 'assets'}</span>
        <span className="flex items-center gap-1">
          <StarIcon />
          {collection.star_count}
        </span>
      </div>
    </Link>
  )
}
