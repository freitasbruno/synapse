import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { getUserCollectionsForAsset, getCollectionsByUser } from '@/lib/data/collections'

// GET /api/collections/mine?assetId=xxx  → UserCollectionOption[]
// GET /api/collections/mine               → CollectionPreview[]
export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const assetId = searchParams.get('assetId')

  if (assetId) {
    const options = await getUserCollectionsForAsset(user.id, assetId)
    return NextResponse.json(options)
  }

  const collections = await getCollectionsByUser(user.id)
  return NextResponse.json(collections)
}
