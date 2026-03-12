import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { resetSystemPrompt } from '@/lib/data/ai-prompts'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'manager') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { key } = await params

  const updated = await resetSystemPrompt(key, user.id)
  if (!updated) {
    return NextResponse.json({ error: 'Prompt not found or reset failed' }, { status: 404 })
  }

  return NextResponse.json(updated)
}
