import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { markAllAsRead } from '@/lib/data/notifications'

export async function POST() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await markAllAsRead(user.id)
  return NextResponse.json({ ok: true })
}
