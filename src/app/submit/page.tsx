import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/session'
import { Header } from '@/components/layout/Header'
import { AssetEditor } from '@/components/editor/AssetEditor'

export default async function SubmitPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/signin')

  return (
    <>
      <Header />
      <AssetEditor mode="create" creatorId={user.id} />
    </>
  )
}
