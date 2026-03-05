import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'manager') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const supabase = await createClient()

  const { error } = await supabase.from('assets').delete().eq('id', id)
  if (error) {
    console.error('[delete asset]', error.message)
    return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 })
  }

  return new NextResponse(null, { status: 200 })
}
