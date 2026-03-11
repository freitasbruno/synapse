import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'manager') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: { ids: string[]; action: 'approve' | 'reject' }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { ids, action } = body

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'ids must be a non-empty array' }, { status: 400 })
  }
  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'action must be approve or reject' }, { status: 400 })
  }

  const supabase = await createClient()

  // Fetch assets to get run_ids for counter updates
  const { data: assets } = await supabase
    .from('assets')
    .select('id, agent_run_id')
    .in('id', ids)

  const runIds = new Set(
    (assets ?? [])
      .map((a) => (a as { id: string; agent_run_id: string | null }).agent_run_id)
      .filter(Boolean) as string[],
  )

  if (action === 'approve') {
    const { error } = await supabase
      .from('assets')
      .update({ status: 'published', visibility: 'public' })
      .in('id', ids)

    if (error) return NextResponse.json({ error: 'Failed to approve' }, { status: 500 })

    // Update approved counters per run
    for (const runId of runIds) {
      const count = (assets ?? []).filter(
        (a) => (a as { agent_run_id: string | null }).agent_run_id === runId,
      ).length
      const { data: run } = await supabase
        .from('agent_runs')
        .select('assets_approved')
        .eq('id', runId)
        .single()
      if (run) {
        const r = run as { assets_approved: number }
        await supabase
          .from('agent_runs')
          .update({ assets_approved: r.assets_approved + count })
          .eq('id', runId)
      }
    }
  } else {
    // Clear FK references in agent_candidates before deleting
    await supabase
      .from('agent_candidates')
      .update({ drafted_asset_id: null })
      .in('drafted_asset_id', ids)

    const { error } = await supabase.from('assets').delete().in('id', ids)
    if (error) return NextResponse.json({ error: 'Failed to reject' }, { status: 500 })

    // Update rejected counters per run
    for (const runId of runIds) {
      const count = (assets ?? []).filter(
        (a) => (a as { agent_run_id: string | null }).agent_run_id === runId,
      ).length
      const { data: run } = await supabase
        .from('agent_runs')
        .select('assets_rejected')
        .eq('id', runId)
        .single()
      if (run) {
        const r = run as { assets_rejected: number }
        await supabase
          .from('agent_runs')
          .update({ assets_rejected: r.assets_rejected + count })
          .eq('id', runId)
      }
    }
  }

  return NextResponse.json({ ok: true, processed: ids.length })
}
