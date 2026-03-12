import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { getCurrentUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { getAllTags } from '@/lib/data/assets'
import { getSystemPrompt } from '@/lib/ai/get-system-prompt'

const google = createGoogleGenerativeAI({ apiKey: process.env.BITLAB_GEMINI_API_KEY })
const GEMINI_MODEL = process.env.BITLAB_GEMINI_MODEL ?? 'gemini-2.0-flash'

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
    const systemPrompt = await getSystemPrompt('suggest_tags')
    const { text, usage } = await generateText({
      model: google(GEMINI_MODEL),
      system: systemPrompt,
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
