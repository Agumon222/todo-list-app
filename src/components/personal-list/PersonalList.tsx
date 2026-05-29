'use client'

import { useCallback, useState, useRef, useEffect } from 'react'
import { Plus, Trash2, Loader2, Share2, Calendar, Edit3, CheckCircle2 } from 'lucide-react'
import { usePersonalList } from '@/hooks/usePersonalList'
import { cn } from '@/lib/utils'

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export default function PersonalList() {
  const { items, loading, addItem, toggleItem, updateItem, deleteItem, copyToShared } =
    usePersonalList()
  const [newContent, setNewContent] = useState('')
  const [newDeadline, setNewDeadline] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  function showToast(message: string) {
    setToast(message)
    setTimeout(() => setToast(null), 2000)
  }

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.setSelectionRange(
        editInputRef.current.value.length,
        editInputRef.current.value.length
      )
    }
  }, [editingId])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = newContent.trim()
    if (!trimmed || submitting) return

    setSubmitting(true)
    try {
      await addItem(trimmed, newDeadline || null)
      setNewContent('')
      setNewDeadline('')
    } catch (err) {
      console.error('Failed to add item:', err)
    } finally {
      setSubmitting(false)
    }
  }

  function startEdit(itemId: string, content: string) {
    setEditingId(itemId)
    setEditContent(content)
  }

  async function saveEdit(itemId: string) {
    const trimmed = editContent.trim()
    if (!trimmed || !editingId) {
      cancelEdit()
      return
    }

    setEditingId(null)
    try {
      await updateItem(itemId, trimmed)
    } catch (err) {
      console.error('Failed to update item:', err)
    }
  }

  function cancelEdit() {
    setEditingId(null)
    setEditContent('')
  }

  function handleEditKeyDown(
    e: React.KeyboardEvent,
    itemId: string
  ) {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveEdit(itemId)
    } else if (e.key === 'Escape') {
      cancelEdit()
    }
  }

  async function handleCopyToShared(itemId: string) {
    setSyncingId(itemId)
    try {
      await copyToShared(itemId)
      showToast('已同步到共享清单')
    } catch (err) {
      showToast(err instanceof Error ? err.message : '同步失败')
    } finally {
      setSyncingId(null)
    }
  }

  if (loading) {
    return (
      <div className="animate-fade-in space-y-3 p-4">
        <SkeletonHeader />
        {[1, 2, 3].map((i) => (
          <SkeletonItem key={i} />
        ))}
        <SkeletonForm />
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
        <h1 className="text-lg font-semibold text-[#2D3436]">个人清单</h1>
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-3 text-4xl">📝</div>
          <p className="text-sm text-[#8E8E93]">
            添加一些个人任务吧！
          </p>
        </div>
      )}

      {/* Item list */}
      {items.length > 0 && (
        <div className="mb-3 space-y-2">
          {items.map((item, index) => {
            const isEditing = editingId === item.id

            return (
              <div
                key={item.id}
                className={cn(
                  'flex items-center gap-2 rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-[#E8E5E0]',
                  'animate-slide-up'
                )}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                {/* Checkbox / Complete */}
                <button
                  onClick={() => toggleItem(item.id)}
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-all',
                    item.is_done
                      ? 'border-[#B5EAD7] bg-[#B5EAD7]'
                      : 'border-[#D1D1D6] hover:border-[#A8D8EA]'
                  )}
                  aria-label={item.is_done ? '标记未完成' : '标记完成'}
                >
                  {item.is_done ? (
                    <svg
                      viewBox="0 0 24 24"
                      className="size-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <CheckCircle2 className="size-4 text-[#D1D1D6]" />
                  )}
                </button>

                {/* Content */}
                <div
                  className="min-w-0 flex-1 cursor-text"
                  onClick={() =>
                    !isEditing && startEdit(item.id, item.content)
                  }
                >
                  {isEditing ? (
                    <input
                      ref={editInputRef}
                      type="text"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      onBlur={() => saveEdit(item.id)}
                      onKeyDown={(e) => handleEditKeyDown(e, item.id)}
                      className={cn(
                        'w-full rounded-lg border border-[#A8D8EA] bg-white px-2 py-1 text-sm text-[#2D3436]',
                        'focus:border-[#A8D8EA] focus:ring-2 focus:ring-[#A8D8EA]/30 focus:outline-none'
                      )}
                    />
                  ) : (
                    <div className="space-y-0.5">
                      <span
                        className={cn(
                          'block text-sm leading-snug text-[#2D3436]',
                          item.is_done && 'text-[#8E8E93] line-through'
                        )}
                      >
                        {item.content}
                      </span>
                      {item.deadline ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-600">
                          <Calendar className="size-3" />
                          截止 {formatDate(item.deadline)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#B0B0B0]">
                          <Calendar className="size-3" />
                          无截止日期
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Sync to shared list */}
                {!isEditing && (
                  <button
                    onClick={() => handleCopyToShared(item.id)}
                    disabled={syncingId === item.id}
                    className={cn(
                      'flex size-9 items-center justify-center rounded-lg',
                      'text-[#8E8E93] transition-colors hover:bg-[#E0F2FE] hover:text-[#5B7B7A]',
                      'disabled:opacity-50'
                    )}
                    aria-label="同步到共享清单"
                    title="同步到共享清单"
                  >
                    {syncingId === item.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Share2 className="size-4" />
                    )}
                  </button>
                )}

                {/* Edit */}
                {!isEditing && (
                  <button
                    onClick={() => startEdit(item.id, item.content)}
                    className={cn(
                      'flex size-9 items-center justify-center rounded-lg',
                      'text-[#8E8E93] transition-colors hover:bg-[#F0EDE8] hover:text-[#A8D8EA]'
                    )}
                    aria-label="编辑"
                    title="编辑"
                  >
                    <Edit3 className="size-4" />
                  </button>
                )}

                {/* Delete */}
                <button
                  onClick={() => deleteItem(item.id)}
                  className={cn(
                    'flex size-9 items-center justify-center rounded-lg',
                    'text-[#8E8E93] transition-colors hover:bg-[#FFE0DE] hover:text-[#FF6B6B]'
                  )}
                  aria-label="删除"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Add form */}
      <form
        onSubmit={handleAdd}
        className="border-t border-[#E8E5E0] bg-white px-4 py-3"
      >
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
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
            disabled={!newContent.trim() || submitting}
            className={cn(
              'flex size-11 shrink-0 items-center justify-center rounded-full',
              'bg-[#A8D8EA] text-white shadow-sm transition-all',
              'hover:bg-[#8EC8D8] active:scale-95',
              'disabled:cursor-not-allowed disabled:opacity-40'
            )}
            aria-label="添加任务"
          >
            {submitting ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Plus className="size-5" />
            )}
          </button>
        </div>

        {/* Deadline input — always visible */}
        <div className="mt-2 flex items-center gap-2">
          <Calendar className="size-3.5 text-[#8E8E93] shrink-0" />
          <input
            type="date"
            value={newDeadline}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setNewDeadline(e.target.value)}
            className={cn(
              'min-h-[36px] flex-1 rounded-lg border border-[#E8E5E0] bg-[#FAF8F5] px-3 text-sm text-[#2D3436]',
              'focus:border-[#A8D8EA] focus:ring-2 focus:ring-[#A8D8EA]/30 focus:outline-none'
            )}
          />
          {newDeadline && (
            <button
              type="button"
              onClick={() => setNewDeadline('')}
              className="text-xs text-[#8E8E93] hover:text-[#FF6B6B] shrink-0"
            >
              清除
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

function SkeletonHeader() {
  return (
    <div className="mb-4 flex items-center justify-between px-1">
      <div className="h-5 w-20 animate-pulse rounded bg-[#E8E5E0]" />
    </div>
  )
}

function SkeletonItem() {
  return (
    <div className="flex animate-pulse items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-[#E8E5E0]">
      <div className="size-6 rounded-full bg-[#E8E5E0]" />
      <div className="flex-1">
        <div className="h-3.5 w-3/4 rounded bg-[#E8E5E0]" />
      </div>
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
