'use client'

import Link from 'next/link'
import { Home, Search, PlusCircle, ShoppingCart, Settings, User } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useCartStore } from '@/stores/cart-store'

export function BottomNav() {
  const t = useTranslations('nav')
  const pathname = usePathname()
  const { data: session } = useSession()
  const cartItemCount = useCartStore((state) => state.getItemCount())

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/')

  const navItems = [
    { href: '/feed', icon: Home, label: t('home') },
    { href: '/search', icon: Search, label: t('search') },
    ...(session?.user?.role === 'FARMER' ? [
      { href: '/products/create', icon: PlusCircle, label: t('sell') },
    ] : []),
    { href: '/cart', icon: ShoppingCart, label: t('cart'), badge: cartItemCount },
    { href: session ? '/settings' : '/login', icon: session ? Settings : User, label: session ? t('settings') : t('login') },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 px-3 py-1 relative ${
              isActive(item.href) ? 'text-green-600' : 'text-gray-500'
            }`}
          >
            <item.icon className="w-6 h-6" />
            <span className="text-[10px] font-medium">{item.label}</span>
            {item.badge && item.badge > 0 && (
              <span className="absolute -top-1 right-0 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            )}
          </Link>
        ))}
      </div>
    </nav>
  )
}
