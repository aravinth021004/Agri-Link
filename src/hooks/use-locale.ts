'use client'

import { useRouter } from 'next/navigation'
import { locales, localeNames, type Locale, defaultLocale } from '@/i18n/config'

export function useLocale() {
  const router = useRouter()

  const setLocale = (locale: Locale) => {
    // Set cookie with proper options
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`
    // Force a hard refresh to apply the new locale
    window.location.reload()
  }

  const getLocale = (): Locale => {
    if (typeof document === 'undefined') return defaultLocale
    const match = document.cookie.match(/NEXT_LOCALE=([^;]+)/)
    const locale = match?.[1] as Locale
    return locales.includes(locale) ? locale : defaultLocale
  }

  return {
    locales,
    localeNames,
    setLocale,
    getLocale,
  }
}
