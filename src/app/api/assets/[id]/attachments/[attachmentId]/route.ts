import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { getAttachmentById, deleteAttachment } from '@/lib/data/attachments'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> },
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: assetId, attachmentId } = await params

  // Load attachment and verify it belongs to this asset
  const attachment = await getAttachmentById(attachmentId)
  if (!attachment || attachment.asset_id !== assetId) {
    return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
  }

  // Check permission: uploader or manager
  const isUploader = attachment.uploader_id === user.id
  const isManager = user.role === 'manager'
  if (!isUploader && !isManager) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Delete from storage
  const supabase = await createClient()
  const { error: storageError } = await supabase.storage
    .from('attachments')
    .remove([attachment.storage_path])

  if (storageError) {
    console.error('[DELETE /attachments] Storage delete error:', storageError.message)
    // Continue to delete the DB record even if storage fails
  }

  // Delete attachment record
  try {
    await deleteAttachment(attachmentId)
  } catch (err) {
    console.error('[DELETE /attachments] DB delete error:', err)
    return NextResponse.json({ error: 'Failed to delete attachment' }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> },
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: assetId, attachmentId } = await params

  const attachment = await getAttachmentById(attachmentId)
  if (!attachment || attachment.asset_id !== assetId) {
    return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
  }

  const isUploader = attachment.uploader_id === user.id
  const isManager = user.role === 'manager'
  if (!isUploader && !isManager) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: { label?: string | null; description?: string | null }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const updates: { label?: string | null; description?: string | null } = {}
  if ('label' in body) updates.label = body.label ?? null
  if ('description' in body) updates.description = body.description ?? null

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('asset_attachments')
    .update(updates)
    .eq('id', attachmentId)
    .select('*')
    .single()

  if (error) {
    console.error('[PATCH /attachments] Supabase error:', error.message)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  return NextResponse.json(data)
}
