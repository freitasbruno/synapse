import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { updateSystemPrompt } from '@/lib/data/ai-prompts'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'manager') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { key } = await params

  let body: { prompt: string }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.prompt?.trim()) {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
  }

  const updated = await updateSystemPrompt(key, body.prompt.trim(), user.id)
  if (!updated) {
    return NextResponse.json({ error: 'Prompt not found or update failed' }, { status: 404 })
  }

  return NextResponse.json(updated)
}
