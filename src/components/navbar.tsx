'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Home, Search, ShoppingCart, User, LogOut, Menu, X, MessageSquare, Package, Settings } from 'lucide-react'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useCartStore } from '@/stores/cart-store'
import { Button } from '@/components/ui/button'
import { NotificationBell } from '@/components/notification-bell'

export function Navbar() {
  const t = useTranslations('nav')
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const cartItemCount = useCartStore((state) => state.getItemCount())

  const isActive = (path: string) => pathname === path

  const navLinks = [
    { href: '/feed', label: t('feed'), icon: Home },
    { href: '/search', label: t('search'), icon: Search },
    { href: '/cart', label: t('cart'), icon: ShoppingCart, badge: cartItemCount },
    { href: '/messages', label: t('messages'), icon: MessageSquare },
  ]

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="AgriLink"
              width={40}
              height={40}
              className="w-10 h-10"
            />
            <span className="text-xl font-bold text-green-600 hidden sm:block">
              AgriLink
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                  isActive(link.href)
                    ? 'bg-green-50 text-green-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <link.icon className="w-5 h-5" />
                <span>{link.label}</span>
                {link.badge ? (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {link.badge > 9 ? '9+' : link.badge}
                  </span>
                ) : null}
              </Link>
            ))}
          </div>

          {/* User Section */}
          <div className="hidden md:flex items-center gap-4">
            {status === 'loading' ? (
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
            ) : session?.user ? (
              <div className="flex items-center gap-3">
                {session.user.role === 'FARMER' && (
                  <Link href="/dashboard">
                    <Button variant="outline" size="sm">
                      <Package className="w-4 h-4 mr-1" />
                      {t('dashboard')}
                    </Button>
                  </Link>
                )}
                {session.user.role === 'ADMIN' && (
                  <Link href="/admin">
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4 mr-1" />
                      {t('admin')}
                    </Button>
                  </Link>
                )}
                <Link
                  href="/settings"
                  className="p-2 text-gray-500 hover:text-green-600 hover:bg-gray-100 rounded-full transition"
                  title={t('settings')}
                >
                  <Settings className="w-5 h-5" />
                </Link>
                <NotificationBell />
                <Link
                  href="/profile"
                  className="flex items-center gap-2 text-sm text-gray-700 hover:text-green-600"
                >
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-semibold">
                    {session.user.fullName?.charAt(0) || 'U'}
                  </div>
                </Link>
                <button
                  onClick={() => signOut()}
                  className="text-gray-500 hover:text-red-500"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost">{t('login')}</Button>
                </Link>
                <Link href="/signup">
                  <Button>{t('signup')}</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-600"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                    isActive(link.href)
                      ? 'bg-green-50 text-green-600'
                      : 'text-gray-600'
                  }`}
                >
                  <link.icon className="w-5 h-5" />
                  <span>{link.label}</span>
                </Link>
              ))}
              
              {session?.user ? (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600"
                  >
                    <User className="w-5 h-5" />
                    <span>{t('profile')}</span>
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600"
                  >
                    <Settings className="w-5 h-5" />
                    <span>{t('settings')}</span>
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false)
                      signOut()
                    }}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-500"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>{t('logout')}</span>
                  </button>
                </>
              ) : (
                <div className="flex gap-2 px-4 pt-2">
                  <Link href="/login" className="flex-1">
                    <Button variant="outline" className="w-full" onClick={() => setMobileMenuOpen(false)}>
                      {t('login')}
                    </Button>
                  </Link>
                  <Link href="/signup" className="flex-1">
                    <Button className="w-full" onClick={() => setMobileMenuOpen(false)}>
                      {t('signup')}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
