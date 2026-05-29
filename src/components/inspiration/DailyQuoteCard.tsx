'use client'

import { useState, useEffect, useCallback } from 'react'
import { Quote, RefreshCcw } from 'lucide-react'
import type { DailyQuote } from '@/types/database.types'
import { Button } from '@/components/ui/button'

export default function DailyQuoteCard() {
  const [quote, setQuote] = useState<DailyQuote | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchQuote = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch('/api/quote/today')
      if (!res.ok) throw new Error('Failed to fetch quote')
      const data = await res.json()
      setQuote(data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchQuote()
  }, [fetchQuote])

  // Loading skeleton
  if (loading) {
    return (
      <div className="w-full max-w-lg mx-auto animate-pulse">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="h-8 w-8 bg-muted/60 rounded mb-4" />
          <div className="space-y-3">
            <div className="h-5 bg-muted/60 rounded w-full" />
            <div className="h-5 bg-muted/60 rounded w-5/6" />
            <div className="h-5 bg-muted/60 rounded w-4/6" />
          </div>
          <div className="h-3 bg-muted/60 rounded w-1/3 mt-4 ml-auto" />
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="w-full max-w-lg mx-auto animate-fade-in">
        <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
          <p className="text-muted-foreground mb-4">今日寄语加载失败</p>
          <Button variant="outline" size="sm" onClick={fetchQuote}>
            <RefreshCcw className="size-4 mr-1" />
            重试
          </Button>
        </div>
      </div>
    )
  }

  // Success state
  return (
    <div className="w-full max-w-lg mx-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-sm p-6 relative overflow-hidden">
        {/* Top accent stripe */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-mint via-lavender to-peach" />

        {/* Decorative quotation mark */}
        <Quote className="size-8 text-mint/30 absolute top-5 left-5" />

        {/* Quote content */}
        <div className="relative z-10 pl-3 pt-2">
          <blockquote className="text-xl md:text-2xl leading-relaxed text-foreground font-serif italic tracking-wide">
            {quote?.hitokoto}
          </blockquote>

          {/* Attribution */}
          {(quote?.from_who || quote?.from_name) && (
            <footer className="mt-5 text-sm text-muted-foreground/70 text-right border-t border-border/50 pt-3">
              ——{' '}
              {quote?.from_who}
              {quote?.from_who && quote?.from_name ? ' · ' : ''}
              {quote?.from_name ? `《${quote.from_name}》` : ''}
            </footer>
          )}
        </div>
      </div>
    </div>
  )
}
