'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

type PageState = 'loading' | 'error' | 'redirecting'

export default function HomePage() {
  const router = useRouter()
  const [state, setState] = useState<PageState>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      try {
        const supabase = createClient()

        // Read return_to from URL (for invite redirect flow)
        const params = new URLSearchParams(window.location.search)
        const returnTo = params.get('return_to')

        // 1. Check for existing session
        const {
          data: { session },
        } = await supabase.auth.getSession()

        let userId: string | undefined = session?.user?.id

        // 2. If no session, sign in anonymously
        if (!userId) {
          const { data, error: signInError } =
            await supabase.auth.signInAnonymously()
          if (signInError) throw signInError
          userId = data.user?.id
        }

        if (!userId) throw new Error('无法获取用户信息')

        if (cancelled) return

        // 3. Check if profile exists
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .single()

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError
        }

        if (cancelled) return

        // 4. Redirect based on profile existence and return_to
        if (profile) {
          router.replace(returnTo || '/app/shared')
        } else if (returnTo) {
          router.replace(`/onboarding?return_to=${encodeURIComponent(returnTo)}`)
        } else {
          router.replace('/onboarding')
        }

        setState('redirecting')
      } catch (err) {
        if (!cancelled) {
          console.error('Auth bootstrap error:', err)
          setErrorMessage(
            err instanceof Error ? err.message : '连接失败，请重试'
          )
          setState('error')
        }
      }
    }

    bootstrap()

    return () => {
      cancelled = true
    }
  }, [router])

  if (state === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF8F5] px-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="text-5xl">😵</div>
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
          <Button
            variant="default"
            onClick={() => {
              setState('loading')
              setErrorMessage('')
              window.location.reload()
            }}
          >
            重试
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF8F5] px-6">
      <div className="flex flex-col items-center gap-4">
        <h1
          className="text-3xl font-semibold tracking-tight animate-pulse"
          style={{
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "PingFang SC", "Noto Sans SC", system-ui, sans-serif',
            color: '#5B7B7A',
          }}
        >
          待办清单
        </h1>
      </div>
    </div>
  )
}
