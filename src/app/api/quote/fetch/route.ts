import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fetchQuote } from '@/lib/hitokoto'

export async function GET(request: Request) {
  try {
    // 1. Verify Authorization header (protected by CRON_SECRET)
    const authHeader = request.headers.get('Authorization')

    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Fetch a new quote from the hitokoto API
    const hitokoto = await fetchQuote()

    // 3. Get admin client for upsert (bypasses RLS)
    const supabase = createAdminClient()
    const today = new Date().toISOString().split('T')[0]

    // 4. Upsert into daily_quotes — handle reruns gracefully with ON CONFLICT
    const { data, error } = await supabase
      .from('daily_quotes')
      .upsert(
        {
          quote_date: today,
          hitokoto: hitokoto.hitokoto,
          from_name: hitokoto.from,
          from_who: hitokoto.from_who,
        },
        { onConflict: 'quote_date' }
      )
      .select()
      .single()

    if (error) {
      throw error
    }

    // 5. Return success
    return NextResponse.json({ success: true, quote: data.hitokoto })
  } catch (error) {
    console.error('Error fetching daily quote via cron:', error)
    return NextResponse.json(
      { error: 'Failed to fetch daily quote' },
      { status: 500 }
    )
  }
}
