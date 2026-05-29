'use client'

import { useState } from 'react'
import { Plus, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AddSharedItemFormProps {
  onAdd: (content: string, deadline?: string | null) => Promise<void>
}

export default function AddSharedItemForm({ onAdd }: AddSharedItemFormProps) {
  const [content, setContent] = useState('')
  const [deadline, setDeadline] = useState('')
  const [showDeadline, setShowDeadline] = useState(false)
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
      setShowDeadline(false)
    } catch (err) {
      console.error('Failed to add item:', err)
    } finally {
      setSubmitting(false)
    }
  }

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
          type="button"
          onClick={() => setShowDeadline(!showDeadline)}
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-lg transition-colors',
            showDeadline
              ? 'bg-[#A8D8EA] text-white'
              : 'text-[#8E8E93] hover:bg-[#F0EDE8]'
          )}
          aria-label="设置截止日期"
        >
          <Calendar className="size-5" />
        </button>
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

      {/* Deadline picker */}
      {showDeadline && (
        <div className="mt-2 flex items-center gap-2 animate-slide-up">
          <label className="text-xs text-[#8E8E93] whitespace-nowrap">
            截止日期:
          </label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className={cn(
              'min-h-[36px] flex-1 rounded-lg border border-[#E8E5E0] bg-[#FAF8F5] px-3 text-sm',
              'focus:border-[#A8D8EA] focus:ring-2 focus:ring-[#A8D8EA]/30 focus:outline-none'
            )}
          />
          {deadline && (
            <button
              type="button"
              onClick={() => setDeadline('')}
              className="text-xs text-[#FF6B6B] hover:underline"
            >
              清除
            </button>
          )}
        </div>
      )}
    </form>
  )
}
