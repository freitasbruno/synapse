import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { getCurrentUser } from '@/lib/auth/session'
import { getAgentRun, updateAgentRun, createAgentCandidate } from '@/lib/data/agent'

const google = createGoogleGenerativeAI({ apiKey: process.env.BITLAB_GEMINI_API_KEY })
const GEMINI_MODEL = process.env.BITLAB_GEMINI_MODEL ?? 'gemini-2.0-flash'

interface RawCandidate {
  title?: string
  summary?: string
  source_url?: string | null
  raw_content?: string
}

function buildSearchAngles(domain: string, focusNotes: string | null): string[] {
  const focus = focusNotes ? ` ${focusNotes}` : ''
  return [
    `Real-world AI prompt examples used in ${domain}${focus}. Find specific, actionable prompts professionals actually use.`,
    `AI workflow automation use cases in ${domain}${focus}. Real examples with step-by-step processes.`,
    `Best AI agent implementations for ${domain}${focus}. Concrete architectures and system prompts.`,
    `AI tools and applications built for ${domain}${focus}. Live products, open source tools, real deployments.`,
    `${domain} professionals using ChatGPT or Claude${focus}. Specific tasks and prompt strategies.`,
  ]
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
    await updateAgentRun(runId, {
      status: 'searching',
      current_step_detail: 'Starting domain research...',
    })

    const angles = buildSearchAngles(run.domain, run.focus_notes)
    let totalCandidates = 0

    for (let i = 0; i < angles.length; i++) {
      await updateAgentRun(runId, {
        current_step_detail: `Searching angle ${i + 1} of ${angles.length}: ${angles[i].slice(0, 80)}...`,
      })

      // Search with grounding
      let searchResult = ''
      try {
        const { text } = await generateText({
          model: google(GEMINI_MODEL, { useSearchGrounding: true }),
          prompt: angles[i],
        })
        searchResult = text
      } catch (err) {
        console.error(`[agent/search] Search angle ${i + 1} failed:`, err)
        continue
      }

      if (!searchResult?.trim()) continue

      // Extract structured candidates from the search text
      const extractionPrompt = `You are extracting distinct AI use cases from research text about ${run.domain}.

Research text:
${searchResult.slice(0, 8000)}

Identify all distinct, concrete AI use cases mentioned. For each one extract:
- title: A clear, specific name (max 100 chars)
- summary: What it does and how it works (2-3 sentences)
- source_url: The URL mentioned as the source, or null if not present
- raw_content: The key relevant excerpt from the text

Return ONLY a valid JSON array. No preamble, no explanation:
[{"title":"...","summary":"...","source_url":"...","raw_content":"..."}]

If no distinct use cases found, return: []`

      let candidates: RawCandidate[] = []
      try {
        const { text: extractionResult } = await generateText({
          model: google(GEMINI_MODEL),
          prompt: extractionPrompt,
        })

        // Extract JSON array from the response (may have markdown fences)
        const jsonMatch = extractionResult.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          candidates = JSON.parse(jsonMatch[0]) as RawCandidate[]
        }
      } catch (err) {
        console.error(`[agent/search] Extraction parse failed for angle ${i + 1}:`, err)
        continue
      }

      // Insert valid candidates
      for (const c of candidates) {
        if (!c.title?.trim()) continue
        const inserted = await createAgentCandidate({
          run_id: runId,
          title: c.title.slice(0, 120),
          summary: c.summary ?? null,
          source_url: c.source_url ?? null,
          raw_content: c.raw_content ?? null,
        })
        if (inserted) totalCandidates++
      }
    }

    await updateAgentRun(runId, {
      status: 'evaluating',
      assets_found: totalCandidates,
      current_step_detail: `Found ${totalCandidates} candidates. Starting evaluation...`,
    })

    return NextResponse.json({ runId, candidatesFound: totalCandidates })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[agent/search] fatal error:', err)
    await updateAgentRun(runId, { status: 'failed', error_message: message })
    return NextResponse.json({ error: 'Search failed', detail: message }, { status: 500 })
  }
}
