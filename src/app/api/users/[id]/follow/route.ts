import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: targetId } = await params

  if (targetId === user.id) {
    return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('toggle_follow', {
    p_follower_id: user.id,
    p_following_id: targetId,
  })

  if (error) {
    console.error('[follow] toggle_follow error:', error.message)
    return NextResponse.json({ error: 'Failed to toggle follow' }, { status: 500 })
  }

  return NextResponse.json(data as { following: boolean })
}
