import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { getCurrentUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { getSystemPrompt } from '@/lib/ai/get-system-prompt'

const google = createGoogleGenerativeAI({ apiKey: process.env.BITLAB_GEMINI_API_KEY })
const GEMINI_MODEL = process.env.BITLAB_GEMINI_MODEL ?? 'gemini-2.0-flash'

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
    const systemPrompt = await getSystemPrompt('refine')
    const { text, usage } = await generateText({
      model: google(GEMINI_MODEL),
      system: systemPrompt,
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
