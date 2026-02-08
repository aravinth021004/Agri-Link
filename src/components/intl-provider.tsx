'use client'

import { NextIntlClientProvider, AbstractIntlMessages } from 'next-intl'

interface IntlProviderProps {
  children: React.ReactNode
  locale: string
  messages: AbstractIntlMessages
}

export function IntlClientProvider({ children, locale, messages }: IntlProviderProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}
