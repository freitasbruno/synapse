import { createClient } from '@/lib/supabase/server'
import type { AssetAttachment } from '@/lib/types/database'

export type { AssetAttachment }

export async function getAssetAttachments(assetId: string): Promise<AssetAttachment[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('asset_attachments')
    .select('*')
    .eq('asset_id', assetId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[getAssetAttachments] Supabase error:', error.message)
    return []
  }

  return (data ?? []) as AssetAttachment[]
}

export async function createAttachment(data: {
  asset_id: string
  uploader_id: string
  filename: string
  storage_path: string
  mime_type: string
  size_bytes: number
  label?: string
  description?: string
}): Promise<AssetAttachment> {
  const supabase = await createClient()

  const { data: row, error } = await supabase
    .from('asset_attachments')
    .insert({
      asset_id: data.asset_id,
      uploader_id: data.uploader_id,
      filename: data.filename,
      storage_path: data.storage_path,
      mime_type: data.mime_type,
      size_bytes: data.size_bytes,
      label: data.label ?? null,
      description: data.description ?? null,
    })
    .select('*')
    .single()

  if (error) {
    console.error('[createAttachment] Supabase error:', error.message)
    throw new Error(error.message)
  }

  return row as AssetAttachment
}

export async function deleteAttachment(attachmentId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('asset_attachments')
    .delete()
    .eq('id', attachmentId)

  if (error) {
    console.error('[deleteAttachment] Supabase error:', error.message)
    throw new Error(error.message)
  }
}

export async function incrementDownloadCount(attachmentId: string): Promise<void> {
  const supabase = await createClient()

  // Read-then-write is acceptable here because download_count is a soft metric.
  const { data: current } = await supabase
    .from('asset_attachments')
    .select('download_count')
    .eq('id', attachmentId)
    .single()

  if (current) {
    await supabase
      .from('asset_attachments')
      .update({ download_count: (current as { download_count: number }).download_count + 1 })
      .eq('id', attachmentId)
  }
}

export async function getAttachmentCount(assetId: string): Promise<number> {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('asset_attachments')
    .select('*', { count: 'exact', head: true })
    .eq('asset_id', assetId)

  if (error) {
    console.error('[getAttachmentCount] Supabase error:', error.message)
    return 0
  }

  return count ?? 0
}

export async function getAttachmentById(id: string): Promise<AssetAttachment | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('asset_attachments')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('[getAttachmentById] Supabase error:', error.message)
    }
    return null
  }

  return data as AssetAttachment
}
