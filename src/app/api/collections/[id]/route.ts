import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { getCollectionById, updateCollection, deleteCollection } from '@/lib/data/collections'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const collection = await getCollectionById(id)
  if (!collection) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (collection.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: { title?: string; description?: string }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const update: Parameters<typeof updateCollection>[1] = {}
  if (body.title !== undefined) update.title = body.title.trim()
  if (body.description !== undefined) update.description = body.description.trim() || null

  const { error } = await updateCollection(id, update)
  if (error) return NextResponse.json({ error }, { status: 500 })

  return new NextResponse(null, { status: 200 })
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const collection = await getCollectionById(id)
  if (!collection) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (collection.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await deleteCollection(id)
  if (error) return NextResponse.json({ error }, { status: 500 })

  return new NextResponse(null, { status: 200 })
}
