'use client'

import { useState, useCallback, useRef } from 'react'
import { useLocale } from '@/hooks/use-locale'

// In-memory cache: key = `${text}:${locale}` → translated text
const translationCache = new Map<string, string>()

export function useTranslate() {
  const { getLocale } = useLocale()
  const [isTranslating, setIsTranslating] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const translate = useCallback(
    async (texts: string[]): Promise<string[]> => {
      const locale = getLocale()

      // No translation needed for English (assumed content language)
      if (locale === 'en') {
        return texts
      }

      // Check cache — return cached results for texts we already translated
      const uncachedTexts: string[] = []
      const uncachedIndices: number[] = []
      const results: string[] = new Array(texts.length)

      for (let i = 0; i < texts.length; i++) {
        const cacheKey = `${texts[i]}:${locale}`
        const cached = translationCache.get(cacheKey)
        if (cached) {
          results[i] = cached
        } else {
          uncachedTexts.push(texts[i])
          uncachedIndices.push(i)
        }
      }

      // If everything was cached, return immediately
      if (uncachedTexts.length === 0) {
        return results
      }

      // Cancel any in-flight request
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setIsTranslating(true)
      try {
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            texts: uncachedTexts,
            targetLanguage: locale,
          }),
          signal: controller.signal,
        })

        if (!response.ok) {
          // On error, return original texts
          for (const idx of uncachedIndices) {
            results[idx] = texts[idx]
          }
          return results
        }

        const data = await response.json()
        const translations: string[] = data.translations || []

        // Fill results and update cache
        for (let j = 0; j < uncachedIndices.length; j++) {
          const idx = uncachedIndices[j]
          const translated = translations[j] || texts[idx]
          results[idx] = translated
          translationCache.set(`${texts[idx]}:${locale}`, translated)
        }

        return results
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
          return texts // request was superseded
        }
        // On error, return original texts
        return texts
      } finally {
        setIsTranslating(false)
      }
    },
    [getLocale]
  )

  return { translate, isTranslating }
}
