import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/database'

export type AssetRow = Database['public']['Tables']['assets']['Row']

export type AssetPreview = Pick<
  Database['public']['Tables']['assets']['Row'],
  | 'id'
  | 'creator_id'
  | 'title'
  | 'type'
  | 'description'
  | 'content'
  | 'external_url'
  | 'tags'
  | 'vote_count'
  | 'star_count'
  | 'comment_count'
  | 'view_count'
  | 'is_manager_validated'
  | 'created_at'
> & { creator_display_name: string }

const SELECT_COLUMNS =
  'id, creator_id, title, type, description, content, external_url, tags, vote_count, star_count, comment_count, view_count, is_manager_validated, created_at, users!creator_id ( display_name )' as const

function mapPreview(row: Record<string, unknown>): AssetPreview {
  const users = row.users as { display_name: string } | null
  return {
    ...(row as Omit<AssetPreview, 'creator_display_name'>),
    creator_display_name: users?.display_name ?? '',
  } as AssetPreview
}

export async function getPublishedAssets(): Promise<AssetPreview[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('assets')
    .select(SELECT_COLUMNS)
    .eq('status', 'published')
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getPublishedAssets] Supabase error:', error.message)
    return []
  }

  return (data ?? []).map((row) => mapPreview(row as unknown as Record<string, unknown>))
}

export async function getFeedAssets(followingIds: string[]): Promise<AssetPreview[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('assets')
    .select(SELECT_COLUMNS)
    .in('creator_id', followingIds)
    .eq('status', 'published')
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('[getFeedAssets] Supabase error:', error.message)
    return []
  }

  return (data ?? []).map((row) => mapPreview(row as unknown as Record<string, unknown>))
}

export async function getPublishedAssetCount(): Promise<number> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('assets')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')
    .eq('visibility', 'public')
  if (error) return 0
  return count ?? 0
}

export async function getAllTags(): Promise<string[]> {
  const supabase = await createClient()

  const result = await supabase
    .from('assets')
    .select('tags')
    .eq('status', 'published')
    .eq('visibility', 'public')

  if (result.error) {
    console.error('[getAllTags] Supabase error:', result.error.message)
    return []
  }

  const rows = (result.data ?? []) as Array<{ tags: string[] }>
  const allTags = rows.flatMap((row) => row.tags ?? [])
  return [...new Set(allTags)].sort()
}

export async function getAssetById(id: string): Promise<AssetRow | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('id', id)
    .eq('status', 'published')
    .single()

  if (error) {
    // PGRST116 = no rows returned — treat as not found, not an error
    if (error.code !== 'PGRST116') {
      console.error('[getAssetById] Supabase error:', error.message)
    }
    return null
  }

  return data as AssetRow
}

export async function getAssetsByUser(userId: string): Promise<AssetRow[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('creator_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getAssetsByUser] Supabase error:', error.message)
    return []
  }

  return (data ?? []) as AssetRow[]
}

export async function getAssetForEdit(id: string): Promise<AssetRow | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('[getAssetForEdit] Supabase error:', error.message)
    }
    return null
  }

  return data as AssetRow
}

export async function deleteAsset(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { error } = await supabase.from('assets').delete().eq('id', id)

  if (error) {
    console.error('[deleteAsset] Supabase error:', error.message)
    return { error: error.message }
  }

  return { error: null }
}

export async function getStarStatus(assetId: string, userId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase.rpc('get_star_status', {
    p_asset_id: assetId,
    p_user_id: userId,
  })
  return Boolean(data)
}

export async function getPublishedAssetsByCreator(creatorId: string): Promise<AssetPreview[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('assets')
    .select(SELECT_COLUMNS)
    .eq('creator_id', creatorId)
    .eq('status', 'published')
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getPublishedAssetsByCreator] Supabase error:', error.message)
    return []
  }

  return (data ?? []).map((row) => mapPreview(row as unknown as Record<string, unknown>))
}

export async function getAssetsByCreator(creatorId: string): Promise<AssetRow[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getAssetsByCreator] Supabase error:', error.message)
    return []
  }

  return (data ?? []) as AssetRow[]
}
