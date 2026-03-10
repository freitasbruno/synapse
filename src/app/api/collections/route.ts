import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { createCollection } from '@/lib/data/collections'

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { title?: string; description?: string }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { title, description } = body
  if (!title?.trim()) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 })
  }

  const collection = await createCollection({
    userId: user.id,
    title: title.trim(),
    description: description?.trim() || null,
  })

  if (!collection) {
    return NextResponse.json({ error: 'Failed to create collection' }, { status: 500 })
  }

  return NextResponse.json(collection, { status: 201 })
}
