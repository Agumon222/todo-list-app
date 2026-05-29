'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import SharedList from '@/components/shared-list/SharedList'

export default function SharedListPage() {
  const [listId, setListId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const findList = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('用户未登录')
        setLoading(false)
        return
      }

      // Find shared lists where user is creator or member
      const [createdResult, memberResult] = await Promise.all([
        supabase
          .from('shared_lists')
          .select('id')
          .eq('created_by', user.id),
        supabase
          .from('list_members')
          .select('list_id')
          .eq('user_id', user.id),
      ])

      const listIds = [
        ...(createdResult.data?.map((l) => l.id) ?? []),
        ...(memberResult.data?.map((m) => m.list_id) ?? []),
      ]

      if (listIds.length === 0) {
        setError('没有找到共享清单')
        return
      }

      setListId(listIds[0])
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '无法加载共享清单'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    findList()
  }, [findList])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-[#A8D8EA]" />
        <p className="mt-3 text-sm text-[#8E8E93]">加载中...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="mb-4 text-sm text-[#8E8E93]">{error}</p>
        <button
          onClick={findList}
          className={cn(
            'min-h-[44px] min-w-[44px] rounded-xl bg-[#A8D8EA] px-5 text-sm font-medium text-white',
            'transition-all hover:bg-[#8EC8D8] active:scale-95'
          )}
        >
          重试
        </button>
      </div>
    )
  }

  if (!listId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-[#8E8E93]">没有找到共享清单</p>
      </div>
    )
  }

  return <SharedList listId={listId} />
}
