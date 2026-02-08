import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'

export const locales = ['en', 'hi', 'ta'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'

export default getRequestConfig(async () => {
  // Read locale from cookie
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get('NEXT_LOCALE')
  let locale = localeCookie?.value as Locale
  
  // Validate locale - ensure it's one of our supported locales
  if (!locale || !locales.includes(locale)) {
    locale = defaultLocale
  }

  // Use static imports for messages
  let messages
  switch (locale) {
    case 'hi':
      messages = (await import('../../messages/hi.json')).default
      break
    case 'ta':
      messages = (await import('../../messages/ta.json')).default
      break
    default:
      messages = (await import('../../messages/en.json')).default
  }

  return {
    locale,
    messages,
  }
})
