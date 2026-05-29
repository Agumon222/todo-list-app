import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Get current authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Find the user's shared list from list_members
    const { data: memberships, error: membershipError } = await supabase
      .from('list_members')
      .select('list_id')
      .eq('user_id', user.id)
      .limit(1)

    if (membershipError) {
      throw membershipError
    }

    if (!memberships || memberships.length === 0) {
      return NextResponse.json(
        { error: 'No shared list found for this user' },
        { status: 404 }
      )
    }

    const listId = memberships[0].list_id

    // 3. Generate a unique invite token
    const token = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days from now

    // 4. Insert into invite_tokens
    const { error: insertError } = await supabase
      .from('invite_tokens')
      .insert({
        token,
        list_id: listId,
        created_by: user.id,
        expires_at: expiresAt.toISOString(),
      })

    if (insertError) {
      throw insertError
    }

    // 5. Build the full invite URL
    const host = request.headers.get('host') || 'localhost:3000'
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
    const inviteUrl = `${protocol}://${host}/invite/${token}`

    return NextResponse.json({ inviteUrl })
  } catch (error) {
    console.error('Error creating invite:', error)
    return NextResponse.json(
      { error: 'Failed to create invite' },
      { status: 500 }
    )
  }
}
