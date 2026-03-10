import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { getCollectionById, reorderCollectionAssets } from '@/lib/data/collections'

type Params = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const collection = await getCollectionById(id)
  if (!collection) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (collection.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: { orderedAssetIds?: string[] }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!Array.isArray(body.orderedAssetIds)) {
    return NextResponse.json({ error: 'orderedAssetIds array is required' }, { status: 400 })
  }

  const { error } = await reorderCollectionAssets(id, body.orderedAssetIds)
  if (error) return NextResponse.json({ error }, { status: 500 })

  return new NextResponse(null, { status: 200 })
}
