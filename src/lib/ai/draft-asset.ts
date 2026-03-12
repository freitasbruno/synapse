import { generateText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { getSystemPromptWithVars } from '@/lib/ai/get-system-prompt'

const google = createGoogleGenerativeAI({ apiKey: process.env.BITLAB_GEMINI_API_KEY })
const GEMINI_MODEL = process.env.BITLAB_GEMINI_MODEL ?? 'gemini-2.0-flash'
const GEMINI_EMBEDDING_API =
  'https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent'

export interface DraftedAsset {
  title: string
  type: 'prompt' | 'agent' | 'app' | 'workflow'
  description: string
  content: string | null
  tags: string[]
  external_url: string | null
  description_sequence: Array<{ type: string; content: string }>
}

export async function generateEmbedding(text: string): Promise<number[] | null> {
  const apiKey = process.env.BITLAB_GEMINI_API_KEY
  if (!apiKey) return null

  try {
    const response = await fetch(`${GEMINI_EMBEDDING_API}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/text-embedding-004',
        content: { parts: [{ text }] },
      }),
    })

    if (!response.ok) return null

    const data = (await response.json()) as { embedding?: { values?: number[] } }
    return data.embedding?.values ?? null
  } catch {
    return null
  }
}

export async function draftAsset(
  domain: string,
  title: string,
  summary: string | null,
  sourceUrl: string | null,
): Promise<DraftedAsset | null> {
  const prompt = await getSystemPromptWithVars('agent_draft', {
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

    const parsed = JSON.parse(jsonMatch[0]) as DraftedAsset

    if (!parsed.title || !parsed.type || !parsed.description) return null
    if (!['prompt', 'agent', 'app', 'workflow'].includes(parsed.type)) {
      parsed.type = 'prompt'
    }

    return parsed
  } catch {
    return null
  }
}
