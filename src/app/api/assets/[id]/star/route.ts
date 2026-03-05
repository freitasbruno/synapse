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

  const { id: assetId } = await params

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('toggle_star', {
    p_asset_id: assetId,
    p_user_id: user.id,
  })

  if (error) {
    console.error('[star] toggle_star error:', error.message)
    return NextResponse.json({ error: 'Failed to toggle star' }, { status: 500 })
  }

  return NextResponse.json(data as { starred: boolean; star_count: number })
}
