'use client'

import { useEffect, useMemo, useState } from 'react'
import { Copy, Share2, Trash2, Loader2, Clock } from 'lucide-react'
import { useSharedList, sortSharedItems } from '@/hooks/useSharedList'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import AddSharedItemForm from './AddSharedItemForm'

interface SharedListProps {
  listId: string
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return new Date(dateStr) < now
}

export default function SharedList({ listId }: SharedListProps) {
  const { items, loading, error, addItem, toggleItem, deleteItem, copyToPersonal } =
    useSharedList(listId)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Sort items: non-overdue first (by deadline asc), then overdue (by deadline desc)
  const sortedItems = useMemo(() => sortSharedItems(items), [items])

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (data.user) setCurrentUserId(data.user.id)
      })
  }, [])

  function showToast(message: string) {
    setToast(message)
    setTimeout(() => setToast(null), 2000)
  }

  async function handleInvite() {
    setInviteLoading(true)
    try {
      const supabase = createClient()
      const res = await fetch('/api/invite/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listId }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.error || 'Failed to create invite')
      }

      const { inviteUrl } = await res.json()
      await navigator.clipboard.writeText(inviteUrl)
      showToast('邀请链接已复制！')
    } catch (err) {
      console.error('Invite error:', err)
      showToast('生成邀请链接失败，请重试')
    } finally {
      setInviteLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-fade-in space-y-3 p-4">
        <SkeletonHeader />
        {[1, 2, 3, 4].map((i) => (
          <SkeletonItem key={i} />
        ))}
        <SkeletonForm />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <p className="mb-2 text-sm text-[#8E8E93]">{error}</p>
        <p className="text-xs text-[#8E8E93]">请检查网络连接后重试</p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {toast && (
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-full bg-[#2D3436] px-5 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="mb-4 flex items-center justify-between px-1">
        <h1 className="text-lg font-semibold text-[#2D3436]">共享清单</h1>
        <button
          onClick={handleInvite}
          disabled={inviteLoading}
          className={cn(
            'flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-medium',
            'bg-[#A8D8EA] text-white transition-all',
            'hover:bg-[#8EC8D8] active:scale-95',
            'disabled:opacity-50'
          )}
          aria-label="邀请好友"
        >
          {inviteLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Share2 className="size-4" />
          )}
          <span>邀请</span>
        </button>
      </div>

      {/* Empty state */}
      {sortedItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-3 text-4xl">📋</div>
          <p className="text-sm text-[#8E8E93]">
            还没有共享任务，快去添加第一个吧！
          </p>
        </div>
      )}

      {/* Item list */}
      {sortedItems.length > 0 && (
        <div className="mb-3 space-y-2">
          {sortedItems.map((item, index) => {
            const isOwn = item.created_by === currentUserId
            const pastDue = isOverdue(item.deadline)

            return (
              <div
                key={item.id}
                className={cn(
                  'flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-[#E8E5E0]',
                  'animate-slide-up',
                  pastDue && 'opacity-50'
                )}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggleItem(item.id, !item.is_done)}
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-all',
                    item.is_done
                      ? 'border-[#B5EAD7] bg-[#B5EAD7]'
                      : 'border-[#D1D1D6] hover:border-[#A8D8EA]'
                  )}
                  aria-label={item.is_done ? '标记未完成' : '标记完成'}
                >
                  {item.is_done && (
                    <svg
                      viewBox="0 0 24 24"
                      className="size-3.5 text-white"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>

                {/* Content */}
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span
                    className={cn(
                      'text-sm leading-snug text-[#2D3436]',
                      item.is_done && 'text-[#8E8E93] line-through'
                    )}
                  >
                    {item.content}
                  </span>
                  <div className="flex items-center gap-2">
                    {item.creator_nickname && (
                      <span className="text-[10px] text-[#8E8E93]">
                        {item.creator_nickname}
                      </span>
                    )}
                    {item.deadline && (
                      <span
                        className={cn(
                          'inline-flex items-center gap-0.5 text-[10px]',
                          pastDue
                            ? 'text-[#FF6B6B]'
                            : 'text-[#8E8E93]'
                        )}
                      >
                        <Clock className="size-2.5" />
                        DDL: {formatDate(item.deadline)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Copy to personal */}
                <button
                  onClick={() => copyToPersonal(item.id)}
                  className={cn(
                    'flex size-10 items-center justify-center rounded-lg',
                    'text-[#8E8E93] transition-colors hover:bg-[#F0EDE8] hover:text-[#5B7B7A]'
                  )}
                  aria-label="复制到我的清单"
                  title="同步到个人清单"
                >
                  <Copy className="size-4" />
                </button>

                {/* Delete (own items only) */}
                {isOwn && (
                  <button
                    onClick={() => deleteItem(item.id)}
                    className={cn(
                      'flex size-10 items-center justify-center rounded-lg',
                      'text-[#8E8E93] transition-colors hover:bg-[#FFE0DE] hover:text-[#FF6B6B]'
                    )}
                    aria-label="删除"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add form */}
      <AddSharedItemForm onAdd={addItem} />
    </div>
  )
}

function SkeletonHeader() {
  return (
    <div className="mb-4 flex items-center justify-between px-1">
      <div className="h-5 w-20 animate-pulse rounded bg-[#E8E5E0]" />
      <div className="h-9 w-20 animate-pulse rounded-xl bg-[#E8E5E0]" />
    </div>
  )
}

function SkeletonItem() {
  return (
    <div className="flex animate-pulse items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-[#E8E5E0]">
      <div className="size-6 rounded-full bg-[#E8E5E0]" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 w-3/4 rounded bg-[#E8E5E0]" />
        <div className="h-2.5 w-16 rounded bg-[#E8E5E0]" />
      </div>
      <div className="size-10 rounded-lg bg-[#E8E5E0]" />
      <div className="size-10 rounded-lg bg-[#E8E5E0]" />
    </div>
  )
}

function SkeletonForm() {
  return (
    <div className="flex animate-pulse items-center gap-3 border-t border-[#E8E5E0] bg-white px-4 py-3">
      <div className="h-11 flex-1 rounded-xl bg-[#E8E5E0]" />
      <div className="size-11 rounded-full bg-[#E8E5E0]" />
    </div>
  )
}
