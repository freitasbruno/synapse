import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { getCurrentUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'

const google = createGoogleGenerativeAI({ apiKey: process.env.BITLAB_GEMINI_API_KEY })
const GEMINI_MODEL = process.env.BITLAB_GEMINI_MODEL ?? 'gemini-2.0-flash'

// ─── system prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a Technical Documentation Specialist for Synapse, an AI asset community portal. Your job is to review and improve content submitted by creators.

When given a piece of text:
- Fix grammatical errors and improve clarity
- Ensure professional, concise tone
- Preserve the original meaning and intent
- For prompt-type assets: specifically improve instruction clarity, specificity, and effectiveness
- For other asset types: focus on clear technical documentation style

If the user provides a specific instruction, prioritise it above all other guidelines.

Return ONLY the refined text — no explanations, no preamble, no "Here is the refined version:" prefix. Just the improved content.`

// ─── types ────────────────────────────────────────────────────────────────────

interface RefineRequest {
  content: string
  assetTitle: string
  assetType: string
  instruction?: string
}

// ─── handler ──────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Auth check — must be signed in
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: RefineRequest
  try {
    body = (await request.json()) as RefineRequest
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { content, assetTitle, assetType, instruction } = body

  if (!content?.trim()) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 })
  }

  const userMessage = [
    `Asset: "${assetTitle}" (type: ${assetType})`,
    '',
    'Content to refine:',
    content,
    ...(instruction?.trim() ? ['', `Instruction: ${instruction.trim()}`] : []),
  ].join('\n')

  try {
    const { text, usage } = await generateText({
      model: google(GEMINI_MODEL),
      system: SYSTEM_PROMPT,
      prompt: userMessage,
    })

    // Fire-and-forget usage logging — do not await, must not block response
    const supabase = await createClient()
    supabase
      .from('ai_usage_logs')
      .insert({
        user_id: user.id,
        type: 'refinement',
        tokens_input: usage.inputTokens ?? 0,
        tokens_output: usage.outputTokens ?? 0,
      })
      .then(({ error }) => {
        if (error) console.error('[refine] usage log error:', error.message)
      })

    return NextResponse.json({
      refined: text,
      inputTokens: usage.inputTokens ?? 0,
      outputTokens: usage.outputTokens ?? 0,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[refine] generateText error:', err)
    return NextResponse.json({ error: 'refinement failed', detail: message }, { status: 500 })
  }
}
