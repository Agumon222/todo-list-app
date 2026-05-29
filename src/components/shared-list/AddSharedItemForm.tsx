'use client'

import { useState } from 'react'
import { Plus, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AddSharedItemFormProps {
  onAdd: (content: string, deadline?: string | null) => Promise<void>
}

export default function AddSharedItemForm({ onAdd }: AddSharedItemFormProps) {
  const [content, setContent] = useState('')
  const [deadline, setDeadline] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = content.trim()
    if (!trimmed || submitting) return

    setSubmitting(true)
    try {
      await onAdd(trimmed, deadline || null)
      setContent('')
      setDeadline('')
    } catch (err) {
      console.error('Failed to add item:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const todayStr = new Date().toISOString().split('T')[0]

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-[#E8E5E0] bg-white px-4 py-3"
    >
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="添加新任务..."
          disabled={submitting}
          className={cn(
            'min-h-[44px] flex-1 rounded-xl border border-[#E8E5E0] bg-[#FAF8F5] px-4 py-2 text-sm',
            'placeholder:text-[#8E8E93]',
            'focus:border-[#A8D8EA] focus:ring-2 focus:ring-[#A8D8EA]/30 focus:outline-none',
            'disabled:opacity-50'
          )}
        />
        <button
          type="submit"
          disabled={!content.trim() || submitting}
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-full',
            'bg-[#A8D8EA] text-white shadow-sm transition-all',
            'hover:bg-[#8EC8D8] active:scale-95',
            'disabled:cursor-not-allowed disabled:opacity-40'
          )}
          aria-label="添加任务"
        >
          <Plus className="size-5" />
        </button>
      </div>

      {/* Deadline input — always visible */}
      <div className="mt-2 flex items-center gap-2">
        <Clock className="size-3.5 text-[#8E8E93] shrink-0" />
        <input
          type="date"
          value={deadline}
          min={todayStr}
          onChange={(e) => setDeadline(e.target.value)}
          className={cn(
            'min-h-[36px] flex-1 rounded-lg border border-[#E8E5E0] bg-[#FAF8F5] px-3 text-sm text-[#2D3436]',
            'focus:border-[#A8D8EA] focus:ring-2 focus:ring-[#A8D8EA]/30 focus:outline-none'
          )}
        />
        {deadline && (
          <button
            type="button"
            onClick={() => setDeadline('')}
            className="text-xs text-[#8E8E93] hover:text-[#FF6B6B] shrink-0"
          >
            清除
          </button>
        )}
      </div>
    </form>
  )
}
