import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/session'
import { AdminSidebarNav } from '@/components/admin/AdminSidebarNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/signin')
  if (user.role !== 'manager') redirect('/')

  return (
    <div style={{ backgroundColor: 'var(--bg)' }} className="min-h-screen">
      <AdminSidebarNav />
      {/* Push content right on desktop to account for fixed sidebar */}
      <div className="md:pl-56">
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
