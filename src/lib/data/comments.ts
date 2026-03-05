import { createClient } from '@/lib/supabase/server'
import type { CommentRow } from '@/lib/types/database'

export async function getCommentsByAsset(assetId: string): Promise<CommentRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('asset_id', assetId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[getCommentsByAsset]', error.message)
    return []
  }

  return (data ?? []) as CommentRow[]
}

export async function addComment(
  assetId: string,
  userId: string,
  userName: string,
  text: string,
): Promise<string | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('add_comment', {
    p_asset_id: assetId,
    p_user_id: userId,
    p_user_name: userName,
    p_text: text,
  })

  if (error) {
    console.error('[addComment]', error.message)
    return null
  }

  return data as string
}

export async function deleteComment(commentId: string, assetId: string): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('delete_comment', {
    p_comment_id: commentId,
    p_asset_id: assetId,
  })

  if (error) {
    console.error('[deleteComment]', error.message)
    return false
  }

  return true
}
