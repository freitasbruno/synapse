import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { getCurrentUser } from '@/lib/auth/session'
import { getAgentRun, updateAgentRun, getAgentCandidates, updateAgentCandidate } from '@/lib/data/agent'
import { getSystemPromptWithVars } from '@/lib/ai/get-system-prompt'

const google = createGoogleGenerativeAI({ apiKey: process.env.BITLAB_GEMINI_API_KEY })
const GEMINI_MODEL = process.env.BITLAB_GEMINI_MODEL ?? 'gemini-2.0-flash'

const EVAL_THRESHOLD = 0.65

interface EvalResult {
  score: number
  reasoning: string
}

async function evaluateCandidate(
  domain: string,
  title: string,
  summary: string | null,
  sourceUrl: string | null,
): Promise<EvalResult | null> {
  const prompt = await getSystemPromptWithVars('agent_evaluate', {
    domain,
    title,
    summary: summary ?? 'N/A',
    source_url: sourceUrl ?? 'N/A',
  })

  try {
    const { text } = await generateText({
      model: google(GEMINI_MODEL),
      prompt,
    })

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const parsed = JSON.parse(jsonMatch[0]) as EvalResult
    if (typeof parsed.score !== 'number' || typeof parsed.reasoning !== 'string') return null

    return {
      score: Math.max(0, Math.min(1, parsed.score)),
      reasoning: parsed.reasoning,
    }
  } catch {
    return null
  }
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
    const toEvaluate = allCandidates.filter((c) => c.status === 'found')

    if (toEvaluate.length === 0) {
      await updateAgentRun(runId, {
        status: 'deduplicating',
        current_step_detail: 'No candidates to evaluate. Skipping to deduplication...',
      })
      return NextResponse.json({ passed: 0, failed: 0 })
    }

    let passed = 0
    let failed = 0

    for (let i = 0; i < toEvaluate.length; i++) {
      const candidate = toEvaluate[i]

      await updateAgentRun(runId, {
        current_step_detail: `Evaluating candidate ${i + 1} of ${toEvaluate.length}: ${candidate.title.slice(0, 60)}`,
      })

      const result = await evaluateCandidate(
        run.domain,
        candidate.title,
        candidate.summary,
        candidate.source_url,
      )

      const score = result?.score ?? 0
      const reasoning = result?.reasoning ?? 'Evaluation failed — skipping'
      const passedEval = score >= EVAL_THRESHOLD

      await updateAgentCandidate(candidate.id, {
        evaluation_score: score,
        evaluation_reasoning: reasoning,
        passed_evaluation: passedEval,
        status: 'evaluated',
      })

      if (passedEval) passed++
      else failed++
    }

    await updateAgentRun(runId, {
      status: 'deduplicating',
      assets_evaluated: toEvaluate.length,
      assets_passed_evaluation: passed,
      current_step_detail: `Evaluated ${toEvaluate.length} candidates. ${passed} passed. Starting deduplication...`,
    })

    return NextResponse.json({ passed, failed })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[agent/evaluate] fatal error:', err)
    await updateAgentRun(runId, { status: 'failed', error_message: message })
    return NextResponse.json({ error: 'Evaluation failed', detail: message }, { status: 500 })
  }
}
