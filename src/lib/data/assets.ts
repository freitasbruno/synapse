import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/database'

export type AssetRow = Database['public']['Tables']['assets']['Row']

export type AssetPreview = Pick<
  Database['public']['Tables']['assets']['Row'],
  | 'id'
  | 'title'
  | 'type'
  | 'description'
  | 'tags'
  | 'vote_count'
  | 'star_count'
  | 'comment_count'
  | 'view_count'
  | 'is_manager_validated'
  | 'created_at'
>

const SELECT_COLUMNS =
  'id, title, type, description, tags, vote_count, star_count, comment_count, view_count, is_manager_validated, created_at' as const

export async function getPublishedAssets(): Promise<AssetPreview[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('assets')
    .select(SELECT_COLUMNS)
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getPublishedAssets] Supabase error:', error.message)
    return []
  }

  return (data ?? []) as AssetPreview[]
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
