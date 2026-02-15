import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const origin = request.headers.get('origin') || 'http://localhost:3000'

  console.log('🔵 Login route hit')
  console.log('🔵 Origin:', origin)

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { 
      redirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    console.error('🔴 OAuth error:', error)
    return NextResponse.redirect(`${origin}/?error=auth`)
  }

  console.log('🟢 OAuth data:', data)

  // THIS IS THE KEY: Return the redirect URL
  if (data?.url) {
    console.log('🟢 Redirecting to:', data.url)
    return NextResponse.redirect(data.url)
  }

  // If no URL, something went wrong
  console.error('🔴 No OAuth URL generated')
  return NextResponse.json(
    { error: 'Failed to generate OAuth URL' }, 
    { status: 500 }
  )
}