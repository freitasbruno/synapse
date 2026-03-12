import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { getCurrentUser } from '@/lib/auth/session'

const google = createGoogleGenerativeAI({ apiKey: process.env.BITLAB_GEMINI_API_KEY })
const GEMINI_MODEL = process.env.BITLAB_GEMINI_MODEL ?? 'gemini-2.0-flash'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'manager') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await params // key available if needed for logging

  let body: { prompt: string; userMessage: string }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.prompt?.trim()) {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
  }
  if (!body.userMessage?.trim()) {
    return NextResponse.json({ error: 'userMessage is required' }, { status: 400 })
  }

  try {
    const { text, usage } = await generateText({
      model: google(GEMINI_MODEL),
      system: body.prompt.trim(),
      prompt: body.userMessage.trim(),
    })

    return NextResponse.json({
      output: text,
      inputTokens: usage.inputTokens ?? 0,
      outputTokens: usage.outputTokens ?? 0,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[admin/prompts/test] error:', err)
    return NextResponse.json({ error: 'Test failed', detail: message }, { status: 500 })
  }
}
