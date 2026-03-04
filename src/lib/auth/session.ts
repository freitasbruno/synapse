import { createClient } from '@/lib/supabase/server'
import { getUserByAuthId } from '@/lib/data/users'
import type { Session } from '@supabase/supabase-js'
import type { UserRow } from '@/lib/types/database'

/**
 * Returns the raw Supabase session (reads from cookies, not server-verified).
 * Use for lightweight "is authenticated?" checks where security is not critical.
 */
export async function getSession(): Promise<Session | null> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

/**
 * Returns the full users-table row for the logged-in user.
 * Uses server-verified getUser() — safe for protected operations.
 */
export async function getCurrentUser(): Promise<UserRow | null> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return getUserByAuthId(user.id)
}
