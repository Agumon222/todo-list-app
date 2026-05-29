'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type InviteState = 'verifying' | 'success' | 'error'

export default function InvitePage() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string

  const [state, setState] = useState<InviteState>('verifying')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function validateInvite() {
      try {
        const supabase = createClient()

        // 1. Get current session
        const { data: { session }, error: sessionError } =
          await supabase.auth.getSession()

        if (sessionError || !session?.user) {
          // No session — redirect to root for anonymous sign-in
          const returnTo = encodeURIComponent(`/invite/${token}`)
          router.push(`/?return_to=${returnTo}`)
          return
        }

        const user = session.user

        // 2. Check if the user has a profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single()

        if (!profile) {
          // No profile — redirect to onboarding with return_to
          const returnTo = encodeURIComponent(`/invite/${token}`)
          router.push(`/onboarding?return_to=${returnTo}`)
          return
        }

        // 3. Validate the invite token via API
        const res = await fetch('/api/invite/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })

        const data = await res.json()

        if (data.valid) {
          setState('success')
          // Brief pause so the user sees the success message, then redirect
          setTimeout(() => {
            router.push('/app/shared?joined=true')
          }, 1500)
        } else {
          setState('error')
          setErrorMessage(data.reason || '邀请链接已失效或不存在')
        }
      } catch {
        setState('error')
        setErrorMessage('验证失败，请稍后重试')
      }
    }

    validateInvite()
  }, [token, router])

  // --- Verifying state ---
  if (state === 'verifying') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#FAF8F5]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A8D8EA] mb-4" />
        <p className="text-gray-600 text-lg">正在验证邀请链接...</p>
      </div>
    )
  }

  // --- Success state ---
  if (state === 'success') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#FAF8F5]">
        <p className="text-gray-800 text-lg">已加入清单！</p>
        <p className="text-gray-500 text-sm mt-2">即将跳转...</p>
      </div>
    )
  }

  // --- Error state ---
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#FAF8F5]">
      <p className="text-gray-800 text-lg text-center mb-6">{errorMessage}</p>
      <button
        onClick={() => router.push('/')}
        className="px-6 py-3 bg-[#A8D8EA] text-white rounded-full font-medium hover:bg-[#8ec8da] transition-colors"
      >
        返回首页
      </button>
    </div>
  )
}
