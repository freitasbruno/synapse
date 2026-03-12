import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { getAgentRun, updateAgentCandidate, updateAgentRun } from '@/lib/data/agent'
import type { Json } from '@/lib/types/database'
import { draftAsset, generateEmbedding } from '@/lib/ai/draft-asset'

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'manager') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: { candidateId: string }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { candidateId } = body
  if (!candidateId) return NextResponse.json({ error: 'candidateId is required' }, { status: 400 })

  const supabase = await createClient()

  // Load and validate the candidate
  const { data: candidateData, error: candidateError } = await supabase
    .from('agent_candidates')
    .select('*')
    .eq('id', candidateId)
    .single()

  if (candidateError || !candidateData) {
    return NextResponse.json({ error: 'Candidate not found' }, { status: 400 })
  }

  const candidate = candidateData as typeof candidateData & {
    passed_deduplication: boolean | null
    drafted_asset_id: string | null
    run_id: string
    title: string
    summary: string | null
    source_url: string | null
    evaluation_score: number | null
  }

  if (!candidate.passed_deduplication) {
    return NextResponse.json({ error: 'Candidate did not pass deduplication' }, { status: 400 })
  }

  if (candidate.drafted_asset_id) {
    return NextResponse.json({ error: 'Candidate is already drafted' }, { status: 400 })
  }

  // Load parent run for domain info
  const run = await getAgentRun(candidate.run_id)
  if (!run) {
    return NextResponse.json({ error: 'Parent run not found' }, { status: 400 })
  }

  // Draft the asset
  const asset = await draftAsset(
    run.domain,
    candidate.title,
    candidate.summary,
    candidate.source_url,
  )

  if (!asset) {
    return NextResponse.json({ error: 'Gemini drafting failed' }, { status: 500 })
  }

  // Insert asset
  const { data: newAsset, error: insertError } = await supabase
    .from('assets')
    .insert({
      creator_id: user.id,
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
      agent_run_id: candidate.run_id,
      agent_candidate_id: candidateId,
      source_url: candidate.source_url ?? null,
      agent_quality_score: candidate.evaluation_score ?? null,
    })
    .select('*')
    .single()

  if (insertError || !newAsset) {
    console.error('[draft-candidate] Insert error:', insertError?.message)
    return NextResponse.json({ error: 'Failed to insert asset' }, { status: 500 })
  }

  const assetId = (newAsset as { id: string }).id

  // Generate and store embedding
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

  // Mark candidate as drafted (manually)
  await updateAgentCandidate(candidateId, {
    drafted_asset_id: assetId,
    manually_drafted: true,
    status: 'drafted',
  })

  // Increment run's assets_drafted counter
  await updateAgentRun(candidate.run_id, {
    assets_drafted: run.assets_drafted + 1,
  })

  return NextResponse.json(newAsset)
}
