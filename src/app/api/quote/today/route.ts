import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fetchQuote } from '@/lib/hitokoto'

export async function GET() {
  try {
    const supabase = await createClient()

    // 1. Query today's cached quote from the database
    const today = new Date().toISOString().split('T')[0]

    const { data: existingQuote, error: queryError } = await supabase
      .from('daily_quotes')
      .select('*')
      .eq('quote_date', today)
      .maybeSingle()

    if (queryError) {
      throw queryError
    }

    if (existingQuote) {
      return NextResponse.json(existingQuote)
    }

    // 2. Fallback: cron hasn't run yet, fetch from hitokoto API directly
    const hitokoto = await fetchQuote()

    // 3. Insert the result with today's date (use admin client to bypass RLS)
    const adminClient = createAdminClient()

    const { data: newQuote, error: insertError } = await adminClient
      .from('daily_quotes')
      .insert({
        quote_date: today,
        hitokoto: hitokoto.hitokoto,
        from_name: hitokoto.from,
        from_who: hitokoto.from_who,
      })
      .select()
      .single()

    if (insertError) {
      throw insertError
    }

    // 4. Return the new quote
    return NextResponse.json(newQuote)
  } catch (error) {
    console.error('Error fetching today\'s quote:', error)
    return NextResponse.json(
      { error: 'Failed to fetch today\'s quote' },
      { status: 500 }
    )
  }
}
