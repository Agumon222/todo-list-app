'use client'

import { cn } from '@/lib/utils'

interface MessageBubbleProps {
  avatar_url: string | null
  nickname: string
  content: string
  bubbleColor: string
  isOwn: boolean
  created_at: string
}

function formatTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return '刚刚'
  if (diffMin < 60) return `${diffMin}分钟前`

  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}小时前`

  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 7) return `${diffDay}天前`

  return date.toLocaleDateString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function MessageBubble({
  avatar_url,
  nickname,
  content,
  bubbleColor,
  isOwn,
  created_at,
}: MessageBubbleProps) {
  return (
    <div
      className={cn(
        'flex items-end gap-2.5 max-w-full',
        isOwn ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 size-9 rounded-full bg-muted flex items-center justify-center overflow-hidden">
        {avatar_url ? (
          <img
            src={avatar_url}
            alt={nickname}
            className="size-full object-cover"
          />
        ) : (
          <span className="text-sm font-medium text-muted-foreground select-none">
            {nickname.charAt(0) || '?'}
          </span>
        )}
      </div>

      {/* Message content area */}
      <div
        className={cn(
          'flex flex-col max-w-[85%]',
          isOwn ? 'items-end' : 'items-start'
        )}
      >
        {/* Nickname */}
        <span className="text-xs text-muted-foreground mb-1 px-1">
          {nickname}
        </span>

        {/* Bubble with tail */}
        <div className="relative">
          {/* Bubble tail — a small rotated square pointing toward avatar */}
          <div
            className={cn(
              'absolute top-3 size-2.5 rotate-45',
              isOwn ? '-right-1' : '-left-1'
            )}
            style={{ backgroundColor: bubbleColor }}
          />

          {/* Message bubble */}
          <div
            className="rounded-2xl px-4 py-2.5 break-words shadow-sm"
            style={{ backgroundColor: bubbleColor }}
          >
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
              {content}
            </p>
          </div>
        </div>

        {/* Timestamp */}
        <span className="text-[10px] text-muted-foreground/60 mt-1 px-1">
          {formatTime(created_at)}
        </span>
      </div>
    </div>
  )
}
