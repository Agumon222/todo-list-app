'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import SharedList from './SharedList'
import { Plus, Loader2 } from 'lucide-react'
import type { SharedList as SharedListType } from '@/types/database.types'

export default function SharedListsView() {
  const [lists, setLists] = useState<SharedListType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }

  const fetchLists = useCallback(async () => {
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

      const [createdResult, memberResult] = await Promise.all([
        supabase
          .from('shared_lists')
          .select('*')
          .eq('created_by', user.id),
        supabase
          .from('shared_lists')
          .select('*')
          .in(
            'id',
            (
              await supabase
                .from('list_members')
                .select('list_id')
                .eq('user_id', user.id)
            ).data?.map((m) => m.list_id) ?? []
          ),
      ])

      // Merge and deduplicate
      const listMap = new Map<string, SharedListType>()
      for (const list of [
        ...(createdResult.data ?? []),
        ...(memberResult.data ?? []),
      ]) {
        listMap.set(list.id, list)
      }

      const allLists = Array.from(listMap.values())

      if (allLists.length === 0) {
        // Auto-create first shared list
        const { error: rpcError } = await supabase.rpc(
          'create_initial_list'
        )
        if (rpcError) throw rpcError
        // Refetch
        return fetchLists()
      }

      setLists(allLists)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '无法加载共享清单'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLists()
  }, [fetchLists])

  async function handleCreateList() {
    const name = newListName.trim()
    if (!name) return

    setCreating(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('未登录')

      const { data, error: insertError } = await supabase
        .from('shared_lists')
        .insert({ name, created_by: user.id })
        .select('*')
        .single()

      if (insertError) throw insertError
      if (!data) throw new Error('创建失败')

      // Add creator as member
      const { error: memberError } = await supabase
        .from('list_members')
        .insert({ list_id: data.id, user_id: user.id })

      if (memberError) throw memberError

      setLists((prev) => [...prev, data as SharedListType])
      setNewListName('')
      showToast('清单已创建')
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : '创建失败'
      )
    } finally {
      setCreating(false)
    }
  }

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
          onClick={fetchLists}
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

  return (
    <div className="animate-fade-in space-y-6">
      {toast && (
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-full bg-[#2D3436] px-5 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}

      {/* Create new list */}
      <div className="px-1">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            placeholder="输入新清单名称..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleCreateList()
              }
            }}
            disabled={creating}
            className={cn(
              'min-h-[44px] flex-1 rounded-xl border border-[#E8E5E0] bg-white px-4 py-2 text-sm',
              'placeholder:text-[#8E8E93]',
              'focus:border-[#A8D8EA] focus:ring-2 focus:ring-[#A8D8EA]/30 focus:outline-none',
              'disabled:opacity-50'
            )}
          />
          <button
            onClick={handleCreateList}
            disabled={!newListName.trim() || creating}
            className={cn(
              'flex size-11 shrink-0 items-center justify-center rounded-full',
              'bg-[#A8D8EA] text-white shadow-sm transition-all',
              'hover:bg-[#8EC8D8] active:scale-95',
              'disabled:cursor-not-allowed disabled:opacity-40'
            )}
            aria-label="创建新清单"
          >
            {creating ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Plus className="size-5" />
            )}
          </button>
        </div>
      </div>

      {/* List sections */}
      {lists.map((list) => (
        <div key={list.id}>
          {/* List header */}
          <div className="mb-3 px-1">
            <h2 className="text-base font-semibold text-[#2D3436]">
              {list.name}
            </h2>
          </div>

          {/* List items */}
          <SharedList listId={list.id} />
        </div>
      ))}
    </div>
  )
}
