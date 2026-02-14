'use client'

import { useState } from 'react'
import { Languages, Loader2 } from 'lucide-react'
import { useTranslate } from '@/hooks/use-translate'
import { useLocale } from '@/hooks/use-locale'
import { useTranslations } from 'next-intl'

interface TranslateButtonProps {
  texts: string[]
  onTranslated: (translations: string[]) => void
  onShowOriginal: () => void
}

export function TranslateButton({ texts, onTranslated, onShowOriginal }: TranslateButtonProps) {
  const { translate, isTranslating } = useTranslate()
  const { getLocale } = useLocale()
  const t = useTranslations('common')
  const [isTranslated, setIsTranslated] = useState(false)

  const locale = getLocale()

  // Don't render for English content
  if (locale === 'en') return null

  const handleClick = async () => {
    if (isTranslated) {
      onShowOriginal()
      setIsTranslated(false)
      return
    }

    const results = await translate(texts)
    onTranslated(results)
    setIsTranslated(true)
  }

  return (
    <div className="inline-flex flex-col items-start gap-0.5">
      <button
        onClick={handleClick}
        disabled={isTranslating}
        className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50 transition-colors"
      >
        {isTranslating ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Languages className="w-3 h-3" />
        )}
        {isTranslated ? t('showOriginal') : t('translate')}
      </button>
      {isTranslated && (
        <span className="text-[10px] text-gray-400">{t('translatedBy')}</span>
      )}
    </div>
  )
}
