import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { getAllSystemPrompts } from '@/lib/data/ai-prompts'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'manager') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const prompts = await getAllSystemPrompts()
  return NextResponse.json(prompts)
}
