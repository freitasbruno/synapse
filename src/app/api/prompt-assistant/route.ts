import { NextRequest } from 'next/server'
import { streamText, convertToModelMessages, type UIMessage } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { getCurrentUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { getSystemPrompt } from '@/lib/ai/get-system-prompt'

const google = createGoogleGenerativeAI({ apiKey: process.env.BITLAB_GEMINI_API_KEY })
const GEMINI_MODEL = process.env.BITLAB_GEMINI_MODEL ?? 'gemini-2.0-flash'

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

  const basePrompt = await getSystemPrompt('prompt_assistant')
  const systemWithContext = assetTitle?.trim()
    ? `${basePrompt}\n\nThe user is creating a prompt asset titled: "${assetTitle}".`
    : basePrompt

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
