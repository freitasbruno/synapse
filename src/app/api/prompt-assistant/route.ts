import { NextRequest } from 'next/server'
import { streamText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { getCurrentUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'

const google = createGoogleGenerativeAI({ apiKey: process.env.BITLAB_GEMINI_API_KEY })
const GEMINI_MODEL = process.env.BITLAB_GEMINI_MODEL ?? 'gemini-2.0-flash'

// ─── system prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a Prompt Engineering Assistant for Synapse, an AI asset community platform. Your job is to help users write clear, effective, well-structured prompts for AI models.

Guide the user through a short series of questions to understand their use case. Ask one question at a time — don't overwhelm them. Once you have enough context (at minimum: the task, the tone, and the output format), draft a complete, professional prompt.

When drafting, structure the prompt clearly with:
- A role/persona for the AI (if appropriate)
- Clear task instructions
- Context or constraints
- Output format specification
- Any important dos and don'ts

After drafting, offer to refine based on feedback. Keep your conversational messages concise and friendly. When you present a drafted prompt, wrap it in a markdown code block so it's clearly distinguished from your conversational text.`

// ─── types ────────────────────────────────────────────────────────────────────

interface AssistantRequest {
  messages: { role: 'user' | 'assistant'; content: string }[]
  assetTitle?: string
}

// ─── handler ──────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  let body: AssistantRequest
  try {
    body = (await request.json()) as AssistantRequest
  } catch {
    return new Response('Invalid request body', { status: 400 })
  }

  const { messages, assetTitle } = body

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response('messages array is required', { status: 400 })
  }

  const systemWithContext = assetTitle?.trim()
    ? `${SYSTEM_PROMPT}\n\nThe user is creating a prompt asset titled: "${assetTitle}".`
    : SYSTEM_PROMPT

  // Prepare supabase client upfront so it's available in onFinish closure
  const supabase = await createClient()

  const result = streamText({
    model: google(GEMINI_MODEL),
    system: systemWithContext,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messages: messages as any,
    onFinish({ usage }) {
      supabase
        .from('ai_usage_logs')
        .insert({
          user_id: user.id,
          type: 'prompt_assistant',
          tokens_input: usage.inputTokens ?? 0,
          tokens_output: usage.outputTokens ?? 0,
        })
        .then(({ error }) => {
          if (error) console.error('[prompt-assistant] usage log error:', error.message)
        })
    },
  })

  return result.toTextStreamResponse()
}
