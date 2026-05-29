'use client'

import { useState } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

const COLOR_OPTIONS = [
  { name: 'mint', value: '#A8D8EA' },
  { name: 'peach', value: '#FFB7B2' },
  { name: 'lavender', value: '#C3B1E1' },
  { name: 'sage', value: '#B5EAD7' },
  { name: 'sky', value: '#E2F0CB' },
  { name: 'coral', value: '#FFDAC1' },
  { name: 'lilac', value: '#E0BBE4' },
  { name: 'cream', value: '#FDFD96' },
]

interface PostMessageFormProps {
  onSend: (content: string, bubbleColor: string) => Promise<void>
}

export default function PostMessageForm({ onSend }: PostMessageFormProps) {
  const [content, setContent] = useState('')
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0].value)
  const [sending, setSending] = useState(false)

  const handleSubmit = async () => {
    const trimmed = content.trim()
    if (!trimmed || sending) return

    setSending(true)
    try {
      await onSend(trimmed, selectedColor)
      setContent('')
    } catch (err) {
      console.error('Failed to send message:', err)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="p-4 space-y-3">
      {/* Color picker */}
      <div className="flex items-center gap-2 flex-wrap">
        {COLOR_OPTIONS.map((color) => (
          <button
            key={color.value}
            type="button"
            onClick={() => setSelectedColor(color.value)}
            className={cn(
              'size-7 rounded-full transition-all duration-200 border-2 border-transparent',
              selectedColor === color.value
                ? 'border-foreground scale-110 shadow-sm'
                : 'hover:scale-105'
            )}
            style={{ backgroundColor: color.value }}
            aria-label={color.name}
          >
            {selectedColor === color.value && (
              <span className="flex items-center justify-center text-[10px] text-foreground/60">
                ✓
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Input row */}
      <div className="flex items-end gap-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入留言..."
          className="min-h-10 max-h-24 resize-none text-sm flex-1"
          rows={1}
          disabled={sending}
        />
        <Button
          onClick={handleSubmit}
          disabled={!content.trim() || sending}
          size="icon"
          className="h-10 w-10 shrink-0"
          aria-label="发送"
        >
          {sending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </Button>
      </div>
    </div>
  )
}
