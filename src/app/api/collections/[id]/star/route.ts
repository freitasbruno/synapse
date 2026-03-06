import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

export async function POST(_request: NextRequest, { params }: Params) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: collectionId } = await params
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('toggle_collection_star', {
    p_collection_id: collectionId,
    p_user_id: user.id,
  })

  if (error) {
    console.error('[collection star] toggle_collection_star error:', error.message)
    return NextResponse.json({ error: 'Failed to toggle star' }, { status: 500 })
  }

  return NextResponse.json(data as { starred: boolean; star_count: number })
}
