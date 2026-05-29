'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { BoardMessage, Profile } from '@/types/database.types'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export interface MessageWithProfile extends BoardMessage {
  user_nickname: string
  user_avatar: string | undefined
}

export function useMessageBoard(listId: string) {
  const [messages, setMessages] = useState<MessageWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!listId) {
      setLoading(false)
      return
    }

    let mounted = true

    const fetchMessages = async () => {
      setLoading(true)
      // Fetch messages
      const { data: msgs, error } = await supabase
        .from('board_messages')
        .select('*')
        .eq('list_id', listId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Failed to fetch board messages:', error)
        if (mounted) setLoading(false)
        return
      }

      if (!msgs || !mounted) {
        if (mounted) setLoading(false)
        return
      }

      // Batch-fetch profiles for all unique user_ids
      const userIds = [...new Set(msgs.map((m) => m.user_id))]
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

      // Merge profiles into messages
      if (mounted) {
        setMessages(
          msgs.map((msg) => {
            const profile = profileMap.get(msg.user_id)
            return {
              ...msg,
              user_nickname: profile?.nickname || '未知用户',
              user_avatar: profile?.avatar_url || undefined,
            }
          })
        )
        setLoading(false)
      }
    }

    fetchMessages()

    // Subscribe to new board_messages inserts
    const channel = supabase
      .channel(`board-${listId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'board_messages',
          filter: `list_id=eq.${listId}`,
        },
        async (payload: RealtimePostgresChangesPayload<BoardMessage>) => {
          if (!mounted) return

          const newMsg = payload.new as Record<string, unknown>

          // Fetch profile for the new message author
          const { data: profile } = await supabase
            .from('profiles')
            .select('nickname, avatar_url')
            .eq('id', newMsg.user_id as string)
            .single()

          if (mounted) {
            setMessages((prev) => [
              ...prev,
              {
                id: newMsg.id as string,
                list_id: newMsg.list_id as string,
                user_id: newMsg.user_id as string,
                content: newMsg.content as string,
                bubble_color: newMsg.bubble_color as string,
                created_at: newMsg.created_at as string,
                user_nickname: profile?.nickname || '未知用户',
                user_avatar: profile?.avatar_url || undefined,
              },
            ])
          }
        }
      )
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [listId])

  const postMessage = useCallback(
    async (content: string, bubbleColor: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase.from('board_messages').insert({
        list_id: listId,
        user_id: user.id,
        content,
        bubble_color: bubbleColor,
      } satisfies Partial<BoardMessage>)

      if (error) throw error
    },
    [listId]
  )

  return { messages, loading, postMessage }
}
