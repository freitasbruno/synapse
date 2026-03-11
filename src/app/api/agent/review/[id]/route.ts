import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'manager') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id: assetId } = await params

  let body: { action: 'approve' | 'reject' }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { action } = body
  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'action must be approve or reject' }, { status: 400 })
  }

  const supabase = await createClient()

  if (action === 'approve') {
    // Read run_id first, then update
    const { data: asset, error: fetchError } = await supabase
      .from('assets')
      .select('agent_run_id')
      .eq('id', assetId)
      .single()

    if (fetchError || !asset) {
      console.error('[review approve] fetch error:', fetchError?.message)
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    const runId = (asset as { agent_run_id: string | null }).agent_run_id

    const { error } = await supabase
      .from('assets')
      .update({ status: 'published', visibility: 'public' })
      .eq('id', assetId)

    if (error) {
      console.error('[review approve] update error:', error.message)
      return NextResponse.json({ error: 'Failed to approve' }, { status: 500 })
    }

    // Increment approved counter (best-effort)
    if (runId) {
      const { data: run } = await supabase
        .from('agent_runs')
        .select('assets_approved')
        .eq('id', runId)
        .single()
      if (run) {
        const r = run as { assets_approved: number }
        await supabase
          .from('agent_runs')
          .update({ assets_approved: r.assets_approved + 1 })
          .eq('id', runId)
      }
    }

    return NextResponse.json({ ok: true, action: 'approved' })
  }

  // Clear FK reference in agent_candidates before deleting
  await supabase
    .from('agent_candidates')
    .update({ drafted_asset_id: null })
    .eq('drafted_asset_id', assetId)

  // Reject: delete and capture run_id in one query
  const { data: deleted, error: deleteError } = await supabase
    .from('assets')
    .delete()
    .eq('id', assetId)
    .select('agent_run_id')
    .single()

  if (deleteError) {
    console.error('[review reject] delete error:', deleteError.message)
    return NextResponse.json({ error: 'Failed to reject', detail: deleteError.message }, { status: 500 })
  }

  // Increment rejected counter (best-effort)
  const runId = (deleted as { agent_run_id: string | null } | null)?.agent_run_id
  if (runId) {
    const { data: run } = await supabase
      .from('agent_runs')
      .select('assets_rejected')
      .eq('id', runId)
      .single()
    if (run) {
      const r = run as { assets_rejected: number }
      await supabase
        .from('agent_runs')
        .update({ assets_rejected: r.assets_rejected + 1 })
        .eq('id', runId)
    }
  }

  return NextResponse.json({ ok: true, action: 'rejected' })
}
