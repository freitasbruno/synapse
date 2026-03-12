import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { getPromptVersions } from '@/lib/data/ai-prompts'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'manager') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { key } = await params
  const versions = await getPromptVersions(key)
  return NextResponse.json(versions)
}
