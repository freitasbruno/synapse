import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { createAgentRun } from '@/lib/data/agent'

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'manager') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: { domain: string; focus_notes?: string; max_assets: number }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { domain, focus_notes, max_assets } = body

  if (!domain?.trim()) {
    return NextResponse.json({ error: 'domain is required' }, { status: 400 })
  }

  const run = await createAgentRun({
    domain: domain.trim(),
    focus_notes: focus_notes?.trim() || null,
    max_assets: max_assets ?? 10,
    triggered_by: user.id,
  })

  if (!run) {
    return NextResponse.json({ error: 'Failed to create agent run' }, { status: 500 })
  }

  return NextResponse.json({ runId: run.id })
}
