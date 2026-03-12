import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { createAttachment, getAttachmentCount } from '@/lib/data/attachments'
import { ATTACHMENT_CONFIG } from '@/lib/attachments/config'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: assetId } = await params

  // Load asset and check ownership
  const supabase = await createClient()
  const { data: asset, error: assetError } = await supabase
    .from('assets')
    .select('id, creator_id')
    .eq('id', assetId)
    .single()

  if (assetError || !asset) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
  }

  const isOwner = asset.creator_id === user.id
  const isManager = user.role === 'manager'
  if (!isOwner && !isManager) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Check attachment limit
  const count = await getAttachmentCount(assetId)
  if (count >= ATTACHMENT_CONFIG.MAX_PER_ASSET) {
    return NextResponse.json(
      { error: `Maximum of ${ATTACHMENT_CONFIG.MAX_PER_ASSET} attachments per asset` },
      { status: 400 },
    )
  }

  // Parse multipart form data
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const label = (formData.get('label') as string | null)?.trim() || undefined
  const description = (formData.get('description') as string | null)?.trim() || undefined

  // Validate mime type
  if (!ATTACHMENT_CONFIG.ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'File type not supported' }, { status: 400 })
  }

  // Validate size
  if (file.size > ATTACHMENT_CONFIG.MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: `File too large — maximum size is ${ATTACHMENT_CONFIG.MAX_SIZE_LABEL}` },
      { status: 400 },
    )
  }

  // Generate storage path
  const uniqueId = crypto.randomUUID()
  const storagePath = `assets/${assetId}/${uniqueId}-${file.name}`

  // Upload to Supabase Storage
  const arrayBuffer = await file.arrayBuffer()
  const { error: uploadError } = await supabase.storage
    .from('attachments')
    .upload(storagePath, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    console.error('[POST /attachments] Storage upload error:', uploadError.message)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }

  // Insert attachment record
  try {
    const attachment = await createAttachment({
      asset_id: assetId,
      uploader_id: user.id,
      filename: file.name,
      storage_path: storagePath,
      mime_type: file.type,
      size_bytes: file.size,
      label,
      description,
    })
    return NextResponse.json(attachment, { status: 201 })
  } catch (err) {
    // Roll back the storage upload if the DB insert fails
    await supabase.storage.from('attachments').remove([storagePath])
    console.error('[POST /attachments] DB insert error:', err)
    return NextResponse.json({ error: 'Failed to save attachment record' }, { status: 500 })
  }
}
