'use client'

import { UserProvider } from '@/lib/user-context'
import BottomNav from '@/components/layout/BottomNav'

export const dynamic = 'force-dynamic'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <UserProvider>
      <div className="min-h-screen bg-[#FAF8F5]">
        <div className="mx-auto max-w-lg">
          <main className="px-4 pt-4 pb-20">{children}</main>
        </div>
        <BottomNav />
      </div>
    </UserProvider>
  )
}
