import { createClient } from '@/lib/supabase/server'

export async function getFollowCounts(
  userId: string,
): Promise<{ followers: number; following: number }> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_follow_counts', { p_user_id: userId })
  if (error) {
    console.error('[getFollowCounts] error:', error.message)
    return { followers: 0, following: 0 }
  }
  return data as { followers: number; following: number }
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle()
  if (error) {
    console.error('[isFollowing] error:', error.message)
    return false
  }
  return data !== null
}

export async function getFollowingIds(userId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId)
  if (error) {
    console.error('[getFollowingIds] error:', error.message)
    return []
  }
  return (data ?? []).map((row) => row.following_id)
}
