import { createClient } from '@/lib/supabase/server'
import type { CollectionRow, AssetRow } from '@/lib/types/database'

// ─── types ────────────────────────────────────────────────────────────────────

export type { CollectionRow }

export interface CollectionPreview extends CollectionRow {
  creator_name: string
  asset_count: number
}

export interface CollectionWithAssets extends CollectionPreview {
  assets: AssetRow[]
}

export interface UserCollectionOption {
  id: string
  title: string
  contains: boolean
}

// ─── queries ──────────────────────────────────────────────────────────────────

export async function getPublicCollections(
  sort: 'popular' | 'newest' = 'popular',
): Promise<CollectionPreview[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('collections')
    .select(`
      *,
      users!user_id ( display_name ),
      collection_assets ( id )
    `)
    .eq('visibility', 'public')
    .order(sort === 'popular' ? 'star_count' : 'created_at', { ascending: false })

  if (error) {
    console.error('[getPublicCollections] Supabase error:', error.message)
    return []
  }

  return (data ?? []).map((row) => {
    const r = row as typeof row & {
      users: { display_name: string } | null
      collection_assets: { id: string }[]
    }
    return {
      id: r.id,
      user_id: r.user_id,
      title: r.title,
      description: r.description,
      visibility: r.visibility as 'public' | 'private',
      star_count: r.star_count,
      created_at: r.created_at,
      updated_at: r.updated_at,
      creator_name: r.users?.display_name ?? 'Unknown',
      asset_count: r.collection_assets?.length ?? 0,
    }
  })
}

export async function getCollectionById(
  id: string,
  currentUserId?: string,
): Promise<CollectionPreview | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('collections')
    .select(`
      *,
      users!user_id ( display_name ),
      collection_assets ( id )
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('[getCollectionById] Supabase error:', error.message)
    }
    return null
  }

  const r = data as typeof data & {
    users: { display_name: string } | null
    collection_assets: { id: string }[]
  }

  // Block private collections from non-owners
  if (r.visibility === 'private' && r.user_id !== currentUserId) {
    return null
  }

  return {
    id: r.id,
    user_id: r.user_id,
    title: r.title,
    description: r.description,
    visibility: r.visibility as 'public' | 'private',
    star_count: r.star_count,
    created_at: r.created_at,
    updated_at: r.updated_at,
    creator_name: r.users?.display_name ?? 'Unknown',
    asset_count: r.collection_assets?.length ?? 0,
  }
}

export async function getCollectionAssets(collectionId: string): Promise<AssetRow[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('collection_assets')
    .select(`
      position,
      assets (*)
    `)
    .eq('collection_id', collectionId)
    .order('position', { ascending: true })

  if (error) {
    console.error('[getCollectionAssets] Supabase error:', error.message)
    return []
  }

  const rows = (data ?? []) as unknown as Array<{ assets: AssetRow | null }>
  return rows.map((r) => r.assets).filter((a): a is AssetRow => a != null)
}

export async function getCollectionsByUser(userId: string): Promise<CollectionPreview[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('collections')
    .select(`
      *,
      users!user_id ( display_name ),
      collection_assets ( id )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getCollectionsByUser] Supabase error:', error.message)
    return []
  }

  return (data ?? []).map((row) => {
    const r = row as typeof row & {
      users: { display_name: string } | null
      collection_assets: { id: string }[]
    }
    return {
      id: r.id,
      user_id: r.user_id,
      title: r.title,
      description: r.description,
      visibility: r.visibility as 'public' | 'private',
      star_count: r.star_count,
      created_at: r.created_at,
      updated_at: r.updated_at,
      creator_name: r.users?.display_name ?? 'Unknown',
      asset_count: r.collection_assets?.length ?? 0,
    }
  })
}

export async function getUserCollectionsForAsset(
  userId: string,
  assetId: string,
): Promise<UserCollectionOption[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('collections')
    .select(`
      id,
      title,
      collection_assets!left ( asset_id )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getUserCollectionsForAsset] Supabase error:', error.message)
    return []
  }

  return (data ?? []).map((row) => {
    const r = row as typeof row & {
      collection_assets: { asset_id: string }[] | null
    }
    return {
      id: r.id,
      title: r.title,
      contains: (r.collection_assets ?? []).some((ca) => ca.asset_id === assetId),
    }
  })
}

export async function createCollection(data: {
  userId: string
  title: string
  description?: string | null
  visibility: 'public' | 'private'
}): Promise<CollectionRow | null> {
  const supabase = await createClient()

  const { data: row, error } = await supabase
    .from('collections')
    .insert({
      user_id: data.userId,
      title: data.title,
      description: data.description ?? null,
      visibility: data.visibility,
    })
    .select('*')
    .single()

  if (error) {
    console.error('[createCollection] Supabase error:', error.message)
    return null
  }

  return row as CollectionRow
}

export async function updateCollection(
  id: string,
  data: Partial<Pick<CollectionRow, 'title' | 'description' | 'visibility'>>,
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { error } = await supabase.from('collections').update(data).eq('id', id)

  if (error) {
    console.error('[updateCollection] Supabase error:', error.message)
    return { error: error.message }
  }

  return { error: null }
}

export async function deleteCollection(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { error } = await supabase.from('collections').delete().eq('id', id)

  if (error) {
    console.error('[deleteCollection] Supabase error:', error.message)
    return { error: error.message }
  }

  return { error: null }
}

export async function addAssetToCollection(
  collectionId: string,
  assetId: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  // Get the max position for this collection
  const { data: maxRow } = await supabase
    .from('collection_assets')
    .select('position')
    .eq('collection_id', collectionId)
    .order('position', { ascending: false })
    .limit(1)
    .single()

  const nextPosition = maxRow ? (maxRow as { position: number }).position + 1 : 0

  const { error } = await supabase.from('collection_assets').insert({
    collection_id: collectionId,
    asset_id: assetId,
    position: nextPosition,
  })

  if (error) {
    console.error('[addAssetToCollection] Supabase error:', error.message)
    return { error: error.message }
  }

  return { error: null }
}

export async function removeAssetFromCollection(
  collectionId: string,
  assetId: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('collection_assets')
    .delete()
    .eq('collection_id', collectionId)
    .eq('asset_id', assetId)

  if (error) {
    console.error('[removeAssetFromCollection] Supabase error:', error.message)
    return { error: error.message }
  }

  return { error: null }
}

export async function reorderCollectionAssets(
  collectionId: string,
  orderedAssetIds: string[],
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const updates = orderedAssetIds.map((assetId, index) =>
    supabase
      .from('collection_assets')
      .update({ position: index })
      .eq('collection_id', collectionId)
      .eq('asset_id', assetId),
  )

  const results = await Promise.all(updates)
  const failed = results.find((r) => r.error)

  if (failed?.error) {
    console.error('[reorderCollectionAssets] Supabase error:', failed.error.message)
    return { error: failed.error.message }
  }

  return { error: null }
}
