import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/session'

export async function POST() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const supabase = await createClient()

    // 1. Delete / anonymise all user data via the DB function
    const { error: rpcError } = await supabase.rpc('delete_user_account', {
      p_user_id: user.id,
    })
    if (rpcError) {
      console.error('[account/delete] RPC error:', rpcError)
      return NextResponse.json({ error: 'Failed to delete account data' }, { status: 500 })
    }

    // 2. Remove the Supabase Auth record (requires service role)
    const adminClient = createAdminClient()
    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(user.auth_id)
    if (authDeleteError) {
      console.error('[account/delete] Auth delete error:', authDeleteError)
      // Data is already deleted — log but don't fail the response
    }

    // 3. Sign the user out of the current session
    await supabase.auth.signOut()

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[account/delete] Unexpected error:', err)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
