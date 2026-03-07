import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { getNotifications, getUnreadCount } from '@/lib/data/notifications'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const countOnly = searchParams.get('countOnly') === 'true'
  const limit = parseInt(searchParams.get('limit') ?? '20', 10)

  if (countOnly) {
    const count = await getUnreadCount(user.id)
    return NextResponse.json({ count })
  }

  const notifications = await getNotifications(user.id, limit)
  return NextResponse.json(notifications)
}

export async function DELETE() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()
  const { error } = await supabase.from('notifications').delete().eq('user_id', user.id)
  if (error) {
    return NextResponse.json({ error: 'Failed to delete notifications' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
