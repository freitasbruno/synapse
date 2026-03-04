import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=auth_error`)
  }

  // Password reset — forward the code to the client-side reset page so it
  // can exchange it there. Do NOT exchange it here (codes are single-use).
  const type = searchParams.get('type')
  if (type === 'recovery') {
    return NextResponse.redirect(`${origin}/auth/reset-password?code=${code}`)
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    console.error('[auth/callback] exchange error:', error?.message)
    return NextResponse.redirect(`${origin}/?error=auth_error`)
  }

  const authUser = data.user

  // Check whether a users-table row exists for this auth identity.
  // Use the same client (it now holds the session from the exchange).
  const { data: existingUser, error: lookupError } = await supabase
    .from('users')
    .select('id, profile_complete')
    .eq('auth_id', authUser.id)
    .single()

  if (lookupError && lookupError.code !== 'PGRST116') {
    console.error('[auth/callback] lookup error:', lookupError.message)
    return NextResponse.redirect(`${origin}/?error=auth_error`)
  }

  if (!existingUser) {
    // First login — create the profile row.
    const { error: insertError } = await supabase.from('users').insert({
      auth_id: authUser.id,
      display_name:
        (authUser.user_metadata.full_name as string | undefined) ??
        authUser.email ??
        'User',
      email: authUser.email ?? '',
      photo_url:
        (authUser.user_metadata.avatar_url as string | undefined) ?? null,
    })

    if (insertError) {
      console.error('[auth/callback] insert error:', insertError.message)
      return NextResponse.redirect(`${origin}/?error=auth_error`)
    }

    return NextResponse.redirect(`${origin}/onboarding`)
  }

  if (!existingUser.profile_complete) {
    return NextResponse.redirect(`${origin}/onboarding`)
  }

  return NextResponse.redirect(`${origin}/`)
}
