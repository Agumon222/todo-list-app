import DailyQuoteCard from '@/components/inspiration/DailyQuoteCard'

export const metadata = {
  title: '每日寄语 - To Do List',
}

export default function InspirationPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] px-4 py-8">
      <h1 className="text-2xl font-semibold text-foreground mb-2">每日寄语</h1>
      <p className="text-sm text-muted-foreground mb-8">每一天，都有新的力量</p>
      <DailyQuoteCard />
      <p className="mt-12 text-xs text-muted-foreground/40 text-center">
        语录来源：Hitokoto · 一言
      </p>
    </div>
  )
}
