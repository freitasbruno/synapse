import { redirect, notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/session'
import { getAssetForEdit } from '@/lib/data/assets'
import { getAssetAttachments } from '@/lib/data/attachments'
import { Header } from '@/components/layout/Header'
import { AssetEditor } from '@/components/editor/AssetEditor'

export default async function EditAssetPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) redirect('/auth/signin')

  const [asset, attachments] = await Promise.all([
    getAssetForEdit(id),
    getAssetAttachments(id),
  ])

  if (!asset) notFound()

  // Only the creator can edit
  if (asset.creator_id !== user.id) redirect('/dashboard')

  return (
    <>
      <Header />
      <AssetEditor
        mode="edit"
        initialData={asset}
        creatorId={user.id}
        initialAttachments={attachments}
      />
    </>
  )
}
