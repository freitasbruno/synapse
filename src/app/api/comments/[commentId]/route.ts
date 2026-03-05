import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { deleteComment } from '@/lib/data/comments'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> },
) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { commentId } = await params

  // Fetch the comment to check ownership and get assetId for the RPC
  const supabase = await createClient()
  const { data: comment, error: fetchError } = await supabase
    .from('comments')
    .select('id, user_id, asset_id')
    .eq('id', commentId)
    .single()

  if (fetchError || !comment) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
  }

  if (comment.user_id !== user.id && user.role !== 'manager') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const ok = await deleteComment(commentId, comment.asset_id)
  if (!ok) {
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 })
  }

  return new NextResponse(null, { status: 200 })
}
