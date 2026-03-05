import { getAdminAssets } from '@/lib/data/admin'
import { AssetsTable } from '@/components/admin/AssetsTable'

export default async function AdminAssetsPage() {
  const assets = await getAdminAssets()

  return (
    <div className="space-y-6">
      <div>
        <h1 style={{ color: 'var(--text-primary)' }} className="text-2xl font-bold tracking-tight">
          Assets
        </h1>
        <p style={{ color: 'var(--text-secondary)' }} className="mt-1 text-sm">
          Content oversight — all assets across all statuses
        </p>
      </div>

      <AssetsTable initialAssets={assets} />
    </div>
  )
}
