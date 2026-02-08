// Client-side locale utilities
export const locales = ['en', 'hi', 'ta'] as const
export type Locale = (typeof locales)[number]

export const localeNames: Record<Locale, string> = {
  en: 'English',
  hi: 'हिंदी',
  ta: 'தமிழ்',
}

export const defaultLocale: Locale = 'en'
