'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { PersonalListItem } from '@/types/database.types'

export function usePersonalList() {
  const [items, setItems] = useState<PersonalListItem[]>([])
  const [loading, setLoading] = useState(true)
  const mountedRef = useRef(true)
  const userIdRef = useRef<string | null>(null)
  const itemsRef = useRef<PersonalListItem[]>([])

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  useEffect(() => {
    mountedRef.current = true
    const supabase = createClient()

    async function init() {
      try {
        setLoading(true)

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()
        if (userError) throw userError
        if (!user) {
          setLoading(false)
          return
        }
        userIdRef.current = user.id

        const { data, error: fetchError } = await supabase
          .from('personal_list_items')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })

        if (fetchError) throw fetchError

        if (mountedRef.current) {
          setItems(data ?? [])
        }
      } catch (err) {
        console.error('Failed to load personal list:', err)
      } finally {
        if (mountedRef.current) {
          setLoading(false)
        }
      }
    }

    init()

    return () => {
      mountedRef.current = false
    }
  }, [])

  const addItem = useCallback(
    async (content: string, deadline?: string | null) => {
      const supabase = createClient()
      const userId = userIdRef.current
      if (!userId) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('personal_list_items')
        .insert({
          user_id: userId,
          content,
          is_done: false,
          deadline: deadline || null,
        })
        .select('*')
        .single()

      if (error) throw error

      setItems((prev) => [...prev, data as PersonalListItem])
    },
    []
  )

  const toggleItem = useCallback(async (itemId: string) => {
    const supabase = createClient()

    const currentItem = itemsRef.current.find((i) => i.id === itemId)
    if (!currentItem) return

    const newIsDone = !currentItem.is_done

    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, is_done: newIsDone } : item
      )
    )

    const { error } = await supabase
      .from('personal_list_items')
      .update({ is_done: newIsDone })
      .eq('id', itemId)
      .eq('user_id', userIdRef.current)

    if (error) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, is_done: currentItem.is_done } : item
        )
      )
      throw error
    }
  }, [])

  const updateItem = useCallback(
    async (itemId: string, content: string) => {
      const supabase = createClient()

      const originalItem = itemsRef.current.find((i) => i.id === itemId)
      if (!originalItem) return

      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, content } : item
        )
      )

      const { error } = await supabase
        .from('personal_list_items')
        .update({ content })
        .eq('id', itemId)
        .eq('user_id', userIdRef.current)

      if (error) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === itemId
              ? { ...item, content: originalItem.content }
              : item
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
    if (!deletedItem) return

    setItems((prev) => prev.filter((item) => item.id !== itemId))

    const { error } = await supabase
      .from('personal_list_items')
      .delete()
      .eq('id', itemId)
      .eq('user_id', userIdRef.current)

    if (error) {
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

  /** Copy a personal item to the user's first shared list */
  const copyToShared = useCallback(async (itemId: string) => {
    const supabase = createClient()
    const userId = userIdRef.current
    if (!userId) throw new Error('User not authenticated')

    const item = itemsRef.current.find((i) => i.id === itemId)
    if (!item) throw new Error('Item not found')

    // Find first shared list the user belongs to
    const [createdRes, memberRes] = await Promise.all([
      supabase
        .from('shared_lists')
        .select('id')
        .eq('created_by', userId)
        .limit(1)
        .maybeSingle(),
      supabase
        .from('list_members')
        .select('list_id')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle(),
    ])

    const listId =
      createdRes.data?.id ?? memberRes.data?.list_id ?? null

    if (!listId) {
      throw new Error('没有找到共享清单，请先创建一个')
    }

    const { error } = await supabase.from('shared_list_items').insert({
      list_id: listId,
      created_by: userId,
      content: item.content,
      is_done: item.is_done,
      deadline: item.deadline || null,
    })

    if (error) throw error
  }, [])

  return {
    items,
    loading,
    addItem,
    toggleItem,
    updateItem,
    deleteItem,
    copyToShared,
  }
}
