import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { getAgentRun, updateAgentRun, getAgentCandidates, updateAgentCandidate } from '@/lib/data/agent'

const GEMINI_EMBEDDING_API = 'https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent'
const SIMILARITY_THRESHOLD = 0.85

async function generateEmbedding(text: string): Promise<number[] | null> {
  const apiKey = process.env.BITLAB_GEMINI_API_KEY
  if (!apiKey) return null

  try {
    const response = await fetch(`${GEMINI_EMBEDDING_API}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/text-embedding-004',
        content: { parts: [{ text }] },
      }),
    })

    if (!response.ok) {
      console.error('[generateEmbedding] API error:', response.status, await response.text())
      return null
    }

    const data = (await response.json()) as { embedding?: { values?: number[] } }
    return data.embedding?.values ?? null
  } catch (err) {
    console.error('[generateEmbedding] fetch error:', err)
    return null
  }
}

interface MatchResult {
  id: string
  title: string
  similarity: number
}

async function findNearestAsset(vector: number[]): Promise<MatchResult | null> {
  const supabase = await createClient()

  const vectorStr = `[${vector.join(',')}]`

  const { data, error } = await supabase.rpc('match_assets_by_embedding', {
    query_embedding: vectorStr,
    match_count: 1,
  })

  if (error) {
    console.error('[findNearestAsset] rpc error:', error.message)
    return null
  }

  const rows = data as MatchResult[] | null
  return rows?.[0] ?? null
}

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
    const toDeduplicate = allCandidates.filter((c) => c.passed_evaluation === true)

    if (toDeduplicate.length === 0) {
      await updateAgentRun(runId, {
        status: 'drafting',
        current_step_detail: 'No candidates passed evaluation. Skipping to drafting...',
      })
      return NextResponse.json({ passed: 0, duplicates: 0 })
    }

    let passed = 0
    let duplicates = 0

    for (let i = 0; i < toDeduplicate.length; i++) {
      const candidate = toDeduplicate[i]

      await updateAgentRun(runId, {
        current_step_detail: `Deduplicating candidate ${i + 1} of ${toDeduplicate.length}: ${candidate.title.slice(0, 60)}`,
      })

      const text = [candidate.title, candidate.summary].filter(Boolean).join(' ')
      const vector = await generateEmbedding(text)

      if (!vector) {
        // Embedding failed — pass through rather than lose the candidate
        await updateAgentCandidate(candidate.id, {
          passed_deduplication: true,
          status: 'deduplicated',
        })
        passed++
        continue
      }

      const nearest = await findNearestAsset(vector)

      if (nearest && nearest.similarity > SIMILARITY_THRESHOLD) {
        // Duplicate detected
        await updateAgentCandidate(candidate.id, {
          similarity_score: nearest.similarity,
          nearest_asset_id: nearest.id,
          passed_deduplication: false,
          status: 'deduplicated',
        })
        duplicates++
      } else {
        await updateAgentCandidate(candidate.id, {
          similarity_score: nearest?.similarity ?? null,
          nearest_asset_id: nearest?.id ?? null,
          passed_deduplication: true,
          status: 'deduplicated',
        })
        passed++
      }
    }

    await updateAgentRun(runId, {
      status: 'drafting',
      assets_passed_deduplication: passed,
      current_step_detail: `Deduplication complete. ${passed} passed, ${duplicates} duplicates found. Drafting assets...`,
    })

    return NextResponse.json({ passed, duplicates })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[agent/deduplicate] fatal error:', err)
    await updateAgentRun(runId, { status: 'failed', error_message: message })
    return NextResponse.json({ error: 'Deduplication failed', detail: message }, { status: 500 })
  }
}
