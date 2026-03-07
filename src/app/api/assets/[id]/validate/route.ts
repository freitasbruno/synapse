/**
 * POST /api/assets/[id]/validate
 *
 * Toggles the is_manager_validated flag on a published asset.
 * Only users with role = 'manager' may call this endpoint.
 *
 * To promote a user to manager, run in the Supabase SQL Editor:
 *   UPDATE users SET role = 'manager' WHERE email = 'manager@example.com';
 *
 * No UI for role management in the MVP — this is intentional.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (user.role !== 'manager') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id: assetId } = await params

  const supabase = await createClient()

  // Fetch current value
  const { data: asset, error: fetchError } = await supabase
    .from('assets')
    .select('is_manager_validated, creator_id')
    .eq('id', assetId)
    .single()

  if (fetchError || !asset) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
  }

  // Toggle
  const newValue = !asset.is_manager_validated
  const { error: updateError } = await supabase
    .from('assets')
    .update({ is_manager_validated: newValue })
    .eq('id', assetId)

  if (updateError) {
    console.error('[validate] update error:', updateError.message)
    return NextResponse.json({ error: 'Failed to update validation status' }, { status: 500 })
  }

  // Fire-and-forget: notify asset owner when validated (not when unvalidated)
  if (newValue && asset.creator_id) {
    void (async () => {
      try {
        await supabase.rpc('create_notification', {
          p_user_id: asset.creator_id,
          p_type: 'asset_validated',
          p_actor_id: user.id,
          p_asset_id: assetId,
        })
      } catch {
        // ignore
      }
    })()
  }

  return NextResponse.json({ is_manager_validated: newValue })
}
