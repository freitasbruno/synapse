import { notFound } from 'next/navigation'
import { SequenceRenderer } from '@/components/asset/SequenceRenderer'
import { PromptContentBlock } from '@/components/asset/PromptContentBlock'
import { ActionButtons } from '@/components/ui/ActionButtons'
import { GoldBadge } from '@/components/ui/GoldBadge'
import { getAssetById } from '@/lib/data/assets'
import type { AssetRow } from '@/lib/data/assets'

const TYPE_STYLES: Record<AssetRow['type'], string> = {
  prompt:   'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
  agent:    'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  app:      'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  workflow: 'bg-violet-500/20 text-violet-400 border border-violet-500/30',
}
const TYPE_LABELS: Record<AssetRow['type'], string> = {
  prompt: 'Prompt', agent: 'Agent', app: 'App', workflow: 'Workflow',
}

export default async function EmbedAssetPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const asset = await getAssetById(id)

  if (!asset) notFound()

  const isPrivate = asset.visibility === 'private'

  return (
    <main className="mx-auto max-w-3xl px-4 py-5 sm:px-6">
      {isPrivate ? (
        <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
          This asset is private
        </p>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_STYLES[asset.type]}`}>
              {TYPE_LABELS[asset.type]}
            </span>
            {asset.is_manager_validated && <GoldBadge />}
          </div>

          <h1
            style={{ color: 'var(--text-primary)' }}
            className="mt-3 text-2xl font-bold leading-tight tracking-tight"
          >
            {asset.title}
          </h1>

          {asset.description && (
            <p style={{ color: 'var(--text-secondary)' }} className="mt-2 text-base leading-relaxed">
              {asset.description}
            </p>
          )}

          <div className="mt-4">
            <ActionButtons content={asset.content} externalUrl={asset.external_url} />
          </div>

          {asset.type === 'prompt' && asset.content && (
            <div className="mt-6">
              <PromptContentBlock content={asset.content} />
            </div>
          )}

          <div className="mt-6">
            <SequenceRenderer blocks={asset.description_sequence} />
          </div>
        </>
      )}

      <div style={{ borderColor: 'var(--bg-border)' }} className="mt-8 border-t pt-4">
        <a
          href={`https://synapse.bitlab.pt/asset/${asset.id}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--accent)' }}
          className="text-sm font-medium hover:underline"
        >
          View on Synapse →
        </a>
      </div>
    </main>
  )
}
