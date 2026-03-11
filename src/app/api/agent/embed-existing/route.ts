import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'

const GEMINI_EMBEDDING_API = 'https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent'
const BATCH_SIZE = 10

async function generateEmbedding(text: string): Promise<number[] | null> {
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

export async function POST() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'manager') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = await createClient()

  // Fetch all published assets without embeddings
  const { data: assets, error } = await supabase
    .from('assets')
    .select('id, title, description, tags')
    .eq('status', 'published')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .is('embedding' as any, null)
    .limit(500)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = (assets ?? []) as Array<{ id: string; title: string; description: string | null; tags: string[] }>

  if (rows.length === 0) {
    return NextResponse.json({ processed: 0, message: 'All assets already have embeddings.' })
  }

  let processed = 0

  // Process in batches to respect rate limits
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)

    await Promise.all(
      batch.map(async (asset) => {
        const text = [asset.title, asset.description, (asset.tags ?? []).join(' ')]
          .filter(Boolean)
          .join(' ')

        const vector = await generateEmbedding(text)
        if (!vector) return

        const vectorStr = `[${vector.join(',')}]`
        const { error: updateErr } = await supabase
          .from('assets')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .update({ embedding: vectorStr } as any)
          .eq('id', asset.id)

        if (!updateErr) processed++
      }),
    )

    // Brief pause between batches to avoid hitting rate limits
    if (i + BATCH_SIZE < rows.length) {
      await new Promise((r) => setTimeout(r, 1000))
    }
  }

  return NextResponse.json({ processed, total: rows.length })
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'manager') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = await createClient()

  const { count, error } = await supabase
    .from('assets')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .is('embedding' as any, null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ withoutEmbedding: count ?? 0 })
}
