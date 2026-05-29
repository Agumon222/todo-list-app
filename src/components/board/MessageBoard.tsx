'use client'

import { useEffect, useRef, useState } from 'react'
import { useMessageBoard } from '@/hooks/useMessageBoard'
import MessageBubble from '@/components/board/MessageBubble'
import PostMessageForm from '@/components/board/PostMessageForm'
import { createClient } from '@/lib/supabase/client'
import { MessageSquare } from 'lucide-react'

interface MessageBoardProps {
  listId: string
}

export default function MessageBoard({ listId }: MessageBoardProps) {
  const { messages, loading, postMessage } = useMessageBoard(listId)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id || null)
    })
  }, [])

  // Auto-scroll to bottom when new messages arrive or on initial load
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Loading skeleton
  if (loading) {
    return (
      <div className="flex flex-col h-full">
        {/* Skeleton header */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border px-4 py-3">
          <div className="h-5 bg-muted/60 rounded w-16 animate-pulse" />
        </div>

        {/* Skeleton messages */}
        <div className="flex-1 px-4 py-4 space-y-4 animate-pulse">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-end gap-3">
              <div className="size-9 rounded-full bg-muted/60 flex-shrink-0" />
              <div className="space-y-2">
                <div className="h-3 bg-muted/60 rounded w-16" />
                <div
                  className="h-14 bg-muted/60 rounded-2xl"
                  style={{ width: i % 2 === 0 ? '12rem' : '9rem' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border px-4 py-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="size-5 text-mint" />
          留言板
        </h2>
      </div>

      {/* Message list */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <MessageSquare className="size-12 text-muted-foreground/20 mb-3" />
            <p className="text-muted-foreground text-sm">
              还没有留言，来写下第一句话吧！
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              avatar_url={msg.user_avatar ?? null}
              nickname={msg.user_nickname || '未知用户'}
              content={msg.content}
              bubbleColor={msg.bubble_color}
              isOwn={msg.user_id === currentUserId}
              created_at={msg.created_at}
            />
          ))
        )}
      </div>

      {/* Post form */}
      <div className="sticky bottom-0 border-t border-border bg-background">
        <PostMessageForm onSend={postMessage} />
      </div>
    </div>
  )
}
