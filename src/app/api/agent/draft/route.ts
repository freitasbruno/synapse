import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { getAgentRun, updateAgentRun, getAgentCandidates, updateAgentCandidate } from '@/lib/data/agent'
import type { Json } from '@/lib/types/database'
import { draftAsset, generateEmbedding } from '@/lib/ai/draft-asset'

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'manager') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: { runId: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { runId } = body
  if (!runId) return NextResponse.json({ error: 'runId is required' }, { status: 400 })

  const run = await getAgentRun(runId)
  if (!run) return NextResponse.json({ error: 'Run not found' }, { status: 404 })

  try {
    const allCandidates = await getAgentCandidates(runId)

    // Take candidates that passed dedup, sorted by score DESC, limited to max_assets
    const toDraft = allCandidates
      .filter((c) => c.passed_deduplication === true)
      .sort((a, b) => (b.evaluation_score ?? 0) - (a.evaluation_score ?? 0))
      .slice(0, run.max_assets)

    if (toDraft.length === 0) {
      await updateAgentRun(runId, {
        status: 'completed',
        assets_drafted: 0,
        completed_at: new Date().toISOString(),
        current_step_detail: 'No candidates passed deduplication. Run complete.',
      })
      return NextResponse.json({ drafted: 0 })
    }

    const supabase = await createClient()
    let drafted = 0

    for (let i = 0; i < toDraft.length; i++) {
      const candidate = toDraft[i]

      await updateAgentRun(runId, {
        current_step_detail: `Drafting asset ${i + 1} of ${toDraft.length}: ${candidate.title.slice(0, 60)}`,
      })

      const asset = await draftAsset(run.domain, candidate.title, candidate.summary, candidate.source_url)

      if (!asset) {
        console.error(`[agent/draft] Failed to draft asset for candidate ${candidate.id}`)
        continue
      }

      // Insert asset as draft
      const { data: newAsset, error: insertError } = await supabase
        .from('assets')
        .insert({
          creator_id: run.triggered_by,
          title: asset.title.slice(0, 200),
          type: asset.type,
          description: asset.description.slice(0, 300),
          content: asset.content ?? null,
          tags: Array.isArray(asset.tags) ? asset.tags.slice(0, 10) : [],
          external_url: asset.external_url ?? null,
          description_sequence: (asset.description_sequence ?? []) as Json,
          status: 'draft',
          visibility: 'private',
          is_agent_generated: true,
          agent_run_id: runId,
          agent_candidate_id: candidate.id,
          source_url: candidate.source_url ?? null,
          agent_quality_score: candidate.evaluation_score ?? null,
        })
        .select('id')
        .single()

      if (insertError || !newAsset) {
        console.error('[agent/draft] Insert error:', insertError?.message)
        continue
      }

      const assetId = (newAsset as { id: string }).id

      // Generate and store embedding for the new asset
      const embeddingText = `${asset.title} ${asset.description} ${asset.tags?.join(' ') ?? ''}`
      const vector = await generateEmbedding(embeddingText)

      if (vector) {
        const vectorStr = `[${vector.join(',')}]`
        await supabase
          .from('assets')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .update({ embedding: vectorStr } as any)
          .eq('id', assetId)
      }

      // Link candidate to the drafted asset
      await updateAgentCandidate(candidate.id, {
        drafted_asset_id: assetId,
        status: 'drafted',
      })

      drafted++
    }

    await updateAgentRun(runId, {
      status: 'completed',
      assets_drafted: drafted,
      completed_at: new Date().toISOString(),
      current_step_detail: `Completed. ${drafted} assets drafted and ready for review.`,
    })

    return NextResponse.json({ drafted })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[agent/draft] fatal error:', err)
    await updateAgentRun(runId, { status: 'failed', error_message: message })
    return NextResponse.json({ error: 'Drafting failed', detail: message }, { status: 500 })
  }
}
