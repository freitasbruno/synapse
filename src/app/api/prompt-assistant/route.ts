import { NextRequest } from 'next/server'
import { streamText, convertToModelMessages, type UIMessage } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { getCurrentUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'

const google = createGoogleGenerativeAI({ apiKey: process.env.BITLAB_GEMINI_API_KEY })
const GEMINI_MODEL = process.env.BITLAB_GEMINI_MODEL ?? 'gemini-2.0-flash'

// ─── system prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a Prompt Engineering Assistant for Synapse, an AI asset community platform. Your job is to help users write clear, effective, well-structured prompts for AI models.

Guide the user through a short series of questions to understand their use case. Ask ONE question at a time — never ask multiple questions in the same message. Once you have enough context (minimum: the task, the tone, and the output format), draft a complete professional prompt without waiting to be asked.

When drafting, structure the prompt with:
- A role or persona for the AI (if appropriate)
- Clear task instructions
- Relevant context or constraints
- Output format specification
- Important dos and don'ts

Always wrap your drafted prompt in a markdown fenced code block so it is clearly separated from your conversational text.
After drafting, offer to refine based on feedback. Keep all conversational messages concise and friendly.
Never explain what a prompt is — the user already knows.`

// ─── types ────────────────────────────────────────────────────────────────────

interface AssistantRequest {
  messages: UIMessage[]
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

  // Convert UIMessage[] → ModelMessage[] for streamText
  const modelMessages = await convertToModelMessages(
    messages as Array<Omit<UIMessage, 'id'>>,
  )

  // Prepare supabase client upfront so it's available in onFinish closure
  const supabase = await createClient()

  const result = streamText({
    model: google(GEMINI_MODEL),
    system: systemWithContext,
    messages: modelMessages,
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

  return result.toUIMessageStreamResponse()
}
