import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    // 1. Parse the request body
    const body = await request.json()
    const { token } = body

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { valid: false, reason: 'Token is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 2. Get current authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { valid: false, reason: 'Not authenticated' },
        { status: 401 }
      )
    }

    // 3. Look up the invite token
    const { data: inviteToken, error: tokenError } = await supabase
      .from('invite_tokens')
      .select('*')
      .eq('token', token)
      .single()

    if (tokenError || !inviteToken) {
      return NextResponse.json(
        { valid: false, reason: '邀请链接已失效或不存在' }
      )
    }

    // 4. Validate: not expired
    const now = new Date()
    const expiresAt = new Date(inviteToken.expires_at)

    if (now > expiresAt) {
      return NextResponse.json(
        { valid: false, reason: '邀请链接已过期' }
      )
    }

    // 5. Validate: used_count < max_uses
    if (inviteToken.used_count >= inviteToken.max_uses) {
      return NextResponse.json(
        { valid: false, reason: '邀请链接已达到使用上限' }
      )
    }

    // 6. Check if the user is already a member of this list
    const { data: existingMembership } = await supabase
      .from('list_members')
      .select('list_id')
      .eq('list_id', inviteToken.list_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!existingMembership) {
      // Add user to list_members
      const { error: insertError } = await supabase
        .from('list_members')
        .insert({
          list_id: inviteToken.list_id,
          user_id: user.id,
        })

      if (insertError) {
        throw insertError
      }
    }

    // 7. Increment the used_count on the token
    const { error: updateError } = await supabase
      .from('invite_tokens')
      .update({ used_count: inviteToken.used_count + 1 })
      .eq('id', inviteToken.id)

    if (updateError) {
      throw updateError
    }

    // 8. Return success with the list ID
    return NextResponse.json({
      valid: true,
      listId: inviteToken.list_id,
    })
  } catch (error) {
    console.error('Error validating invite:', error)
    return NextResponse.json(
      { valid: false, reason: '验证失败，请稍后重试' },
      { status: 500 }
    )
  }
}
