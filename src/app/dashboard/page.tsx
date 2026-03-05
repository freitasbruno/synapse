import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth/session'
import { getAssetsByUser } from '@/lib/data/assets'
import { Header } from '@/components/layout/Header'
import { DashboardClient } from '@/components/dashboard/DashboardClient'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/signin')

  const assets = await getAssetsByUser(user.id)

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Heading row */}
        <div className="mb-6 flex items-center justify-between">
          <h1 style={{ color: 'var(--text-primary)' }} className="text-2xl font-bold tracking-tight">
            My Assets
          </h1>
          <Link
            href="/submit"
            style={{ backgroundColor: 'var(--accent)', color: '#ffffff' }}
            className="rounded-lg px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
          >
            New Asset +
          </Link>
        </div>

        <DashboardClient assets={assets} />
      </main>
    </>
  )
}
