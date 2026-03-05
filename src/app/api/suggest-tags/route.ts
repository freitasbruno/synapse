import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { getCurrentUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { getAllTags } from '@/lib/data/assets'

const google = createGoogleGenerativeAI({ apiKey: process.env.BITLAB_GEMINI_API_KEY })
const GEMINI_MODEL = process.env.BITLAB_GEMINI_MODEL ?? 'gemini-2.0-flash'

// ─── system prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a tagging assistant for Synapse, an AI asset community portal.
Your job is to suggest relevant tags for an AI asset based on its title, type, and content.

Rules:
- Suggest exactly 3 to 5 tags
- Tags must be lowercase, single words or short hyphenated phrases (e.g. "prompt-engineering", "python", "automation")
- Prioritise tags that already exist in the platform's tag library when they are relevant
- Only suggest new tags if no existing tag fits
- Do not suggest tags already applied to this asset
- Return ONLY a JSON array of strings, nothing else
- Example: ["python", "automation", "llm", "prompt-engineering"]`

// ─── types ────────────────────────────────────────────────────────────────────

interface SuggestTagsRequest {
  title: string
  assetType: string
  content: string
  existingTags: string[]
}

// ─── handler ──────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: SuggestTagsRequest
  try {
    body = (await request.json()) as SuggestTagsRequest
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { title, assetType, content, existingTags } = body

  const platformTags = await getAllTags()

  const userMessage = [
    `Asset Title: "${title}"`,
    `Asset Type: ${assetType}`,
    `Tags already applied: ${existingTags.length > 0 ? existingTags.join(', ') : 'none'}`,
    `Platform tag library: ${platformTags.length > 0 ? platformTags.join(', ') : 'none yet'}`,
    '',
    'Content:',
    content || '(no content yet)',
  ].join('\n')

  try {
    const { text, usage } = await generateText({
      model: google(GEMINI_MODEL),
      system: SYSTEM_PROMPT,
      prompt: userMessage,
    })

    // Parse the JSON array — strip markdown code fences if the model adds them
    let tags: string[]
    try {
      const cleaned = text.replace(/```(?:json)?\n?/g, '').trim()
      const parsed = JSON.parse(cleaned) as unknown
      if (!Array.isArray(parsed)) throw new Error('not an array')
      tags = (parsed as unknown[]).map(String)
    } catch {
      console.error('[suggest-tags] parse error, raw response:', text)
      return NextResponse.json({ error: 'tag suggestion failed' }, { status: 500 })
    }

    // Fire-and-forget usage logging — must not block the response
    const supabase = await createClient()
    supabase
      .from('ai_usage_logs')
      .insert({
        user_id: user.id,
        type: 'tag_suggestion',
        tokens_input: usage.inputTokens ?? 0,
        tokens_output: usage.outputTokens ?? 0,
      })
      .then(({ error }) => {
        if (error) console.error('[suggest-tags] usage log error:', error.message)
      })

    return NextResponse.json({ tags })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[suggest-tags] generateText error:', err)
    return NextResponse.json({ error: 'tag suggestion failed', detail: message }, { status: 500 })
  }
}
