'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import MessageBoard from '@/components/board/MessageBoard'
import { Loader2, AlertCircle, MessageSquare } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function BoardPage() {
  const [listId, setListId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchList = async () => {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setError('请先登录')
          setLoading(false)
          return
        }

        const { data, error: memberError } = await supabase
          .from('list_members')
          .select('list_id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle()

        if (memberError) throw memberError

        if (data) {
          setListId(data.list_id)
        } else {
          setListId(null)
        }
      } catch (err) {
        setError('加载失败')
      } finally {
        setLoading(false)
      }
    }

    fetchList()
  }, [])

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <Loader2 className="size-8 animate-spin text-mint" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] px-4 text-center">
        <AlertCircle className="size-12 text-destructive/50 mb-3" />
        <p className="text-muted-foreground mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-mint hover:underline"
        >
          重试
        </button>
      </div>
    )
  }

  // No list state
  if (!listId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] px-4 text-center">
        <MessageSquare className="size-12 text-muted-foreground/20 mb-3" />
        <p className="text-muted-foreground mb-2">你还没有加入任何共享清单</p>
        <p className="text-sm text-muted-foreground/60">
          请先创建一个共享清单或接受邀请
        </p>
      </div>
    )
  }

  // Success state
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <MessageBoard listId={listId} />
    </div>
  )
}
