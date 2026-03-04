import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()

  // Supabase rpc() generic inference doesn't reliably propagate Database.Functions
  // through @supabase/ssr. The function and args are correct at runtime.
  // @ts-expect-error -- TS2345: args type defaults to `never` due to generics limitation
  const { error } = await supabase.rpc('increment_view_count', { asset_id: id })

  if (error) {
    console.error('[view route] Supabase error:', error.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
