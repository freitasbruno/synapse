import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { addComment } from '@/lib/data/comments'
import type { CommentRow } from '@/lib/types/database'

const MAX_COMMENT_LENGTH = 1000

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: assetId } = await params

  let body: { text?: string }
  try {
    body = (await request.json()) as { text?: string }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const rawText = body.text ?? ''
  // Strip HTML tags server-side
  const text = rawText.replace(/<[^>]*>/g, '').trim()

  if (!text) {
    return NextResponse.json({ error: 'Comment text is required' }, { status: 400 })
  }
  if (text.length > MAX_COMMENT_LENGTH) {
    return NextResponse.json({ error: 'Comment exceeds maximum length' }, { status: 400 })
  }

  const commentId = await addComment(assetId, user.id, user.display_name, text)
  if (!commentId) {
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 })
  }

  const comment: CommentRow = {
    id: commentId,
    asset_id: assetId,
    user_id: user.id,
    user_name: user.display_name,
    text,
    created_at: new Date().toISOString(),
  }

  // Fire-and-forget: notify asset owner on new comment
  void (async () => {
    try {
      const supabase = await createClient()
      const { data: asset } = await supabase
        .from('assets')
        .select('creator_id')
        .eq('id', assetId)
        .single()
      if (asset?.creator_id) {
        await supabase.rpc('create_notification', {
          p_user_id: asset.creator_id,
          p_type: 'new_comment',
          p_actor_id: user.id,
          p_asset_id: assetId,
        })
      }
    } catch {
      // ignore
    }
  })()

  return NextResponse.json(comment, { status: 201 })
}
