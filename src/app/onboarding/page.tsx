'use client'

import { Suspense, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const BUBBLE_COLORS = [
  { name: 'mint', color: '#A8D8EA' },
  { name: 'peach', color: '#FFB7B2' },
  { name: 'lavender', color: '#C3B1E1' },
  { name: 'sage', color: '#B5EAD7' },
  { name: 'sky', color: '#E2F0CB' },
  { name: 'coral', color: '#FFDAC1' },
  { name: 'lilac', color: '#E0BBE4' },
  { name: 'cream', color: '#FDFD96' },
]

type OnboardingState = 'idle' | 'submitting' | 'error'

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingContent />
    </Suspense>
  )
}

function OnboardingContent() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [nickname, setNickname] = useState('')
  const [selectedColor, setSelectedColor] = useState(BUBBLE_COLORS[0].color)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [state, setState] = useState<OnboardingState>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [nicknameError, setNicknameError] = useState('')

  const validateNickname = (value: string): string => {
    const trimmed = value.trim()
    if (trimmed.length < 2) return '昵称至少需要 2 个字符'
    if (trimmed.length > 20) return '昵称不能超过 20 个字符'
    return ''
  }

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setNickname(value)
    if (value) {
      setNicknameError(validateNickname(value))
    } else {
      setNicknameError('')
    }
  }

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrorMessage('请选择图片文件')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('图片大小不能超过 5MB')
      return
    }

    setAvatarFile(file)
    setErrorMessage('')

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    // Validate nickname
    const err = validateNickname(nickname)
    if (err) {
      setNicknameError(err)
      return
    }

    setState('submitting')
    setErrorMessage('')

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('无法获取用户信息，请重试')
      }

      // 1. Create profile
      const { error: insertError } = await supabase.from('profiles').insert({
        id: user.id,
        nickname: nickname.trim(),
        avatar_url: null,
        bubble_color: selectedColor,
      })

      if (insertError) {
        // PGRST116 = no rows returned (expected for insert on table without returning)
        if (insertError.code !== 'PGRST116') {
          throw insertError
        }
      }

      // 2. Create initial shared list
      const { error: rpcError } = await supabase.rpc('create_initial_list')

      if (rpcError) throw rpcError

      // 3. Redirect to app (or return_to from invite link)
      const returnTo = searchParams.get('return_to')
      router.replace(returnTo || '/app/shared')
    } catch (err) {
      console.error('Onboarding error:', err)
      setErrorMessage(
        err instanceof Error ? err.message : '创建失败，请重试'
      )
      setState('error')
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF8F5]">
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Greeting */}
          <div className="mb-8 text-center">
            <div className="text-4xl mb-3">👋</div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#2D3436]">
              欢迎加入
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              设置你的个人资料，开始和朋友一起管理任务吧
            </p>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-[#F0EDE8] ring-2 ring-[#E8E5E0] transition-all hover:ring-[#A8D8EA] active:scale-95"
                style={{ minWidth: 44, minHeight: 44 }}
              >
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="头像预览"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#8E8E93"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                )}
              </button>
              <span className="text-xs text-muted-foreground">
                点击设置头像（可选）
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarSelect}
              />
            </div>

            {/* Nickname */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#2D3436]">
                昵称
              </label>
              <Input
                value={nickname}
                onChange={handleNicknameChange}
                placeholder="输入你的昵称（2-20 个字符）"
                maxLength={20}
                disabled={state === 'submitting'}
                aria-invalid={nicknameError ? true : undefined}
              />
              {nicknameError && (
                <p className="text-xs text-destructive">{nicknameError}</p>
              )}
            </div>

            {/* Bubble Color */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#2D3436]">
                心情气泡色
              </label>
              <div className="flex flex-wrap gap-3">
                {BUBBLE_COLORS.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setSelectedColor(item.color)}
                    className="relative flex items-center justify-center rounded-full transition-all active:scale-90"
                    style={{ minWidth: 44, minHeight: 44 }}
                    disabled={state === 'submitting'}
                    aria-label={item.name}
                  >
                    <span
                      className={`block rounded-full ${
                        selectedColor === item.color
                          ? 'h-10 w-10 ring-2 ring-[#2D3436] ring-offset-2'
                          : 'h-8 w-8'
                      } transition-all`}
                      style={{ backgroundColor: item.color }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Error message */}
            {errorMessage && (
              <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {errorMessage}
              </div>
            )}

            {/* Submit */}
            <Button
              className="w-full h-11 text-base"
              onClick={handleSubmit}
              disabled={
                state === 'submitting' || !!nicknameError || !nickname.trim()
              }
            >
              {state === 'submitting' ? '创建中...' : '开始使用'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
