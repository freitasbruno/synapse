import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { getPublicCollections, createCollection } from '@/lib/data/collections'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sort = searchParams.get('sort') === 'newest' ? 'newest' : 'popular'

  const collections = await getPublicCollections(sort)
  return NextResponse.json(collections)
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { title?: string; description?: string; visibility?: string }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { title, description, visibility } = body
  if (!title?.trim()) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 })
  }

  const vis = visibility === 'private' ? 'private' : 'public'

  const collection = await createCollection({
    userId: user.id,
    title: title.trim(),
    description: description?.trim() || null,
    visibility: vis,
  })

  if (!collection) {
    return NextResponse.json({ error: 'Failed to create collection' }, { status: 500 })
  }

  return NextResponse.json(collection, { status: 201 })
}
