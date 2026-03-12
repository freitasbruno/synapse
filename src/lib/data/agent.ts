import { createClient } from '@/lib/supabase/server'
import type { AgentRunRow, AgentCandidateRow, AssetRow } from '@/lib/types/database'

export type { AgentRunRow, AgentCandidateRow }

// ─── Agent Runs ───────────────────────────────────────────────────────────────

export async function createAgentRun(data: {
  domain: string
  focus_notes?: string | null
  max_assets: number
  triggered_by: string
}): Promise<AgentRunRow | null> {
  const supabase = await createClient()

  const { data: row, error } = await supabase
    .from('agent_runs')
    .insert({
      domain: data.domain,
      focus_notes: data.focus_notes ?? null,
      max_assets: data.max_assets,
      triggered_by: data.triggered_by,
    })
    .select('*')
    .single()

  if (error) {
    console.error('[createAgentRun]', error.message)
    return null
  }

  return row as AgentRunRow
}

export async function updateAgentRun(
  id: string,
  updates: Partial<Omit<AgentRunRow, 'id' | 'started_at'>>,
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase.from('agent_runs').update(updates).eq('id', id)

  if (error) {
    console.error('[updateAgentRun]', error.message)
  }
}

export async function getAgentRun(id: string): Promise<AgentRunRow | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('agent_runs')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code !== 'PGRST116') console.error('[getAgentRun]', error.message)
    return null
  }

  return data as AgentRunRow
}

export async function getAgentRuns(): Promise<AgentRunRow[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('agent_runs')
    .select('*')
    .order('started_at', { ascending: false })

  if (error) {
    console.error('[getAgentRuns]', error.message)
    return []
  }

  return (data ?? []) as AgentRunRow[]
}

// ─── Agent Candidates ─────────────────────────────────────────────────────────

export async function getAgentCandidates(runId: string): Promise<AgentCandidateRow[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('agent_candidates')
    .select('*')
    .eq('run_id', runId)
    .order('evaluation_score', { ascending: false, nullsFirst: false })

  if (error) {
    console.error('[getAgentCandidates]', error.message)
    return []
  }

  return (data ?? []) as AgentCandidateRow[]
}

export async function createAgentCandidate(data: {
  run_id: string
  title: string
  summary?: string | null
  source_url?: string | null
  raw_content?: string | null
}): Promise<AgentCandidateRow | null> {
  const supabase = await createClient()

  const { data: row, error } = await supabase
    .from('agent_candidates')
    .insert({
      run_id: data.run_id,
      title: data.title,
      summary: data.summary ?? null,
      source_url: data.source_url ?? null,
      raw_content: data.raw_content ?? null,
    })
    .select('*')
    .single()

  if (error) {
    console.error('[createAgentCandidate]', error.message)
    return null
  }

  return row as AgentCandidateRow
}

export async function updateAgentCandidate(
  id: string,
  updates: Partial<Omit<AgentCandidateRow, 'id' | 'run_id' | 'created_at'>>,
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase.from('agent_candidates').update(updates).eq('id', id)

  if (error) {
    console.error('[updateAgentCandidate]', error.message)
  }
}

// ─── Draft Assets ─────────────────────────────────────────────────────────────

export interface AgentDraftAsset extends AssetRow {
  agent_quality_score: number | null
  source_url: string | null
  agent_candidate_id: string | null
  agent_run_id: string | null
  manually_drafted?: boolean
}

export async function getAgentDraftAssets(runId: string): Promise<AgentDraftAsset[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('agent_run_id', runId)
    .eq('status', 'draft')
    .order('agent_quality_score', { ascending: false, nullsFirst: false })

  if (error) {
    console.error('[getAgentDraftAssets]', error.message)
    return []
  }

  return (data ?? []) as AgentDraftAsset[]
}

export async function getAllAgentDraftAssets(): Promise<AgentDraftAsset[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('is_agent_generated', true)
    .eq('status', 'draft')
    .order('agent_quality_score', { ascending: false, nullsFirst: false })

  if (error) {
    console.error('[getAllAgentDraftAssets]', error.message)
    return []
  }

  const assets = (data ?? []) as AgentDraftAsset[]

  // Merge manually_drafted flag from associated candidates
  const candidateIds = assets.map((a) => a.agent_candidate_id).filter(Boolean) as string[]
  if (candidateIds.length > 0) {
    const { data: candidates } = await supabase
      .from('agent_candidates')
      .select('id, manually_drafted')
      .in('id', candidateIds)

    if (candidates) {
      const map = new Map(
        (candidates as Array<{ id: string; manually_drafted: boolean }>).map((c) => [
          c.id,
          c.manually_drafted,
        ]),
      )
      assets.forEach((a) => {
        if (a.agent_candidate_id) {
          a.manually_drafted = map.get(a.agent_candidate_id) ?? false
        }
      })
    }
  }

  return assets
}
