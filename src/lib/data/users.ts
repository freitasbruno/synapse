import { createClient } from '@/lib/supabase/server'
import type { UserRow } from '@/lib/types/database'

export async function getUserByAuthId(authId: string): Promise<UserRow | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', authId)
    .single()

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('[getUserByAuthId] error:', error.message)
    }
    return null
  }

  return data as UserRow
}

export async function createUser(input: {
  auth_id: string
  display_name: string
  email: string
  photo_url?: string | null
}): Promise<UserRow | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('users')
    .insert({
      auth_id: input.auth_id,
      display_name: input.display_name,
      email: input.email,
      photo_url: input.photo_url ?? null,
    })
    .select()
    .single()

  if (error) {
    console.error('[createUser] error:', error.message)
    return null
  }

  return data as UserRow
}

export async function getUserById(id: string): Promise<UserRow | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('users').select('*').eq('id', id).single()

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('[getUserById] error:', error.message)
    }
    return null
  }

  return data as UserRow
}

export async function updateUser(
  id: string,
  updates: {
    display_name?: string
    bio?: string | null
    technical_focus?: string | null
    profile_complete?: boolean
  },
): Promise<UserRow | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[updateUser] error:', error.message)
    return null
  }

  return data as UserRow
}
