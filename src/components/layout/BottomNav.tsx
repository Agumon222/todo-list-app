'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ListChecks,
  ClipboardList,
  Quote,
  MessageCircle,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  { label: '共享', href: '/app/shared', icon: ListChecks },
  { label: '个人', href: '/app/personal', icon: ClipboardList },
  { label: '寄语', href: '/app/inspiration', icon: Quote },
  { label: '留言', href: '/app/board', icon: MessageCircle },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#E8E5E0] bg-white">
      <div
        className="mx-auto flex max-w-lg items-center justify-around"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-colors"
              style={{ minHeight: 44, minWidth: 44 }}
            >
              <Icon
                className={`h-5 w-5 ${
                  isActive ? 'text-[#5B7B7A]' : 'text-[#8E8E93]'
                }`}
              />
              <span
                className={`text-[10px] leading-none ${
                  isActive
                    ? 'font-medium text-[#5B7B7A]'
                    : 'text-[#8E8E93]'
                }`}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
