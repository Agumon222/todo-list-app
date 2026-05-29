'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile, SharedListItem } from '@/types/database.types'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export function useSharedList(listId: string) {
  const [items, setItems] = useState<SharedListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)
  const userIdRef = useRef<string | null>(null)
  const itemsRef = useRef<SharedListItem[]>([])

  // Keep itemsRef in sync
  useEffect(() => {
    itemsRef.current = items
  }, [items])

  useEffect(() => {
    if (!listId) {
      setLoading(false)
      return
    }

    mountedRef.current = true
    const supabase = createClient()

    async function init() {
      try {
        setLoading(true)
        setError(null)

        // Get current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()
        if (userError) throw userError
        if (!user) {
          setError('User not authenticated')
          setLoading(false)
          return
        }
        userIdRef.current = user.id

        // Fetch items
        const { data, error: fetchError } = await supabase
          .from('shared_list_items')
          .select('*')
          .eq('list_id', listId)
          .order('created_at', { ascending: true })

        if (fetchError) throw fetchError

        if (!mountedRef.current) return

        // Batch-fetch profiles
        const typedData = (data ?? []) as SharedListItem[]
        const itemsWithProfiles = await attachProfiles(typedData)
        setItems(itemsWithProfiles)
      } catch (err) {
        if (mountedRef.current) {
          setError(
            err instanceof Error ? err.message : '加载共享清单失败'
          )
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false)
        }
      }
    }

    init()

    // Subscribe to Realtime
    const channel = supabase
      .channel(`shared-list-${listId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shared_list_items',
          filter: `list_id=eq.${listId}`,
        },
        async (payload: RealtimePostgresChangesPayload<any>) => {
          if (!mountedRef.current) return

          if (payload.eventType === 'INSERT') {
            if (itemsRef.current.some((i) => i.id === payload.new.id)) return

            const { data: profile } = await supabase
              .from('profiles')
              .select('nickname, avatar_url')
              .eq('id', payload.new.created_by)
              .single()

            const newItem: SharedListItem = {
              ...payload.new,
              creator_nickname: profile?.nickname ?? undefined,
              creator_avatar: profile?.avatar_url ?? undefined,
            }
            setItems((prev) => addSorted(prev, newItem))
          } else if (payload.eventType === 'UPDATE') {
            setItems((prev) =>
              prev.map((item) =>
                item.id === payload.new.id
                  ? {
                      ...item,
                      ...payload.new,
                      creator_nickname: item.creator_nickname,
                      creator_avatar: item.creator_avatar,
                    }
                  : item
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setItems((prev) =>
              prev.filter((item) => item.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      mountedRef.current = false
      supabase.removeChannel(channel)
    }
  }, [listId])

  const addItem = useCallback(
    async (content: string, deadline?: string | null) => {
      const supabase = createClient()
      const userId = userIdRef.current
      if (!userId) throw new Error('User not authenticated')

      const { error } = await supabase.from('shared_list_items').insert({
        list_id: listId,
        created_by: userId,
        content,
        is_done: false,
        deadline: deadline || null,
      })

      if (error) throw error
    },
    [listId]
  )

  const toggleItem = useCallback(
    async (itemId: string, isDone: boolean) => {
      const supabase = createClient()

      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, is_done: isDone } : item
        )
      )

      const { error } = await supabase
        .from('shared_list_items')
        .update({ is_done: isDone })
        .eq('id', itemId)

      if (error) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === itemId ? { ...item, is_done: !isDone } : item
          )
        )
        throw error
      }
    },
    []
  )

  const deleteItem = useCallback(async (itemId: string) => {
    const supabase = createClient()

    const deletedItem = itemsRef.current.find((i) => i.id === itemId)

    setItems((prev) => prev.filter((item) => item.id !== itemId))

    const { error } = await supabase
      .from('shared_list_items')
      .delete()
      .eq('id', itemId)

    if (error && deletedItem) {
      setItems((prev) => {
        const idx = prev.findIndex(
          (i) => i.created_at > deletedItem.created_at
        )
        const restored = [...prev]
        if (idx === -1) {
          restored.push(deletedItem)
        } else {
          restored.splice(idx, 0, deletedItem)
        }
        return restored
      })
      throw error
    }
  }, [])

  const copyToPersonal = useCallback(async (itemId: string) => {
    const supabase = createClient()
    const userId = userIdRef.current
    if (!userId) throw new Error('User not authenticated')

    const item = itemsRef.current.find((i) => i.id === itemId)
    if (!item) throw new Error('Item not found')

    const { error } = await supabase.from('personal_list_items').insert({
      user_id: userId,
      content: item.content,
      is_done: false,
      deadline: item.deadline || null,
    })

    if (error) throw error
  }, [])

  return {
    items,
    loading,
    error,
    addItem,
    toggleItem,
    deleteItem,
    copyToPersonal,
  }
}

/* -------- Helper functions -------- */

async function attachProfiles(
  items: SharedListItem[]
): Promise<SharedListItem[]> {
  if (items.length === 0) return items

  const supabase = createClient()
  const userIds = [...new Set(items.map((i) => i.created_by))]
  let profileMap = new Map<string, Profile>()

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', userIds)

    if (profiles) {
      profileMap = new Map(profiles.map((p) => [p.id, p]))
    }
  }

  return items.map((item) => {
    const profile = profileMap.get(item.created_by)
    return {
      ...item,
      creator_nickname: profile?.nickname ?? undefined,
      creator_avatar: profile?.avatar_url ?? undefined,
    }
  })
}

/** Insert item into the array maintaining sort: non-overdue first by deadline asc, then overdue by deadline desc */
function addSorted(
  prev: SharedListItem[],
  newItem: SharedListItem
): SharedListItem[] {
  return sortSharedItems([...prev, newItem])
}

export function sortSharedItems(items: SharedListItem[]): SharedListItem[] {
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  return [...items].sort((a, b) => {
    const aPastDue = a.deadline ? new Date(a.deadline) < now : false
    const bPastDue = b.deadline ? new Date(b.deadline) < now : false

    // Non-overdue items come first
    if (!aPastDue && bPastDue) return -1
    if (aPastDue && !bPastDue) return 1

    if (aPastDue && bPastDue) {
      // Both overdue: sort by deadline descending (most overdue last)
      const aTime = a.deadline ? new Date(a.deadline).getTime() : 0
      const bTime = b.deadline ? new Date(b.deadline).getTime() : 0
      return bTime - aTime
    }

    // Non-overdue: sort by deadline ascending (closest deadline first)
    if (a.deadline && b.deadline) {
      const aTime = new Date(a.deadline).getTime()
      const bTime = new Date(b.deadline).getTime()
      if (aTime !== bTime) return aTime - bTime
    } else if (a.deadline && !b.deadline) return -1
    else if (!a.deadline && b.deadline) return 1

    // Fall back to created_at
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })
}
