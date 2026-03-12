import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { getAttachmentById } from '@/lib/data/attachments'
import { ATTACHMENT_CONFIG } from '@/lib/attachments/config'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> },
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: assetId, attachmentId } = await params

  // Load attachment
  const attachment = await getAttachmentById(attachmentId)
  if (!attachment || attachment.asset_id !== assetId) {
    return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
  }

  // Verify asset accessibility: published+public, owner, or manager
  const supabase = await createClient()
  const { data: asset, error: assetError } = await supabase
    .from('assets')
    .select('id, creator_id, status, visibility')
    .eq('id', assetId)
    .single()

  if (assetError || !asset) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
  }

  const isOwner = asset.creator_id === user.id
  const isManager = user.role === 'manager'
  const isPubliclyVisible =
    asset.status === 'published' && asset.visibility === 'public'

  if (!isPubliclyVisible && !isOwner && !isManager) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Generate signed URL
  const { data: signedData, error: signError } = await supabase.storage
    .from('attachments')
    .createSignedUrl(attachment.storage_path, ATTACHMENT_CONFIG.SIGNED_URL_EXPIRY_SECONDS)

  if (signError || !signedData?.signedUrl) {
    console.error('[GET /download] Signed URL error:', signError?.message)
    return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 })
  }

  // Fire-and-forget download count increment
  void supabase
    .from('asset_attachments')
    .update({ download_count: attachment.download_count + 1 })
    .eq('id', attachmentId)

  return NextResponse.json({
    url: signedData.signedUrl,
    filename: attachment.filename,
  })
}
