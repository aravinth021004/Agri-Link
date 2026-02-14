import axios from 'axios'

const AZURE_ENDPOINT = 'https://api.cognitive.microsofttranslator.com'

interface TranslationResult {
  translations: Array<{
    text: string
    to: string
  }>
  detectedLanguage?: {
    language: string
    score: number
  }
}

/**
 * Translate an array of text strings to a target language using Azure Translator.
 * Returns translated strings in the same order as input.
 */
export async function translateTexts(
  texts: string[],
  targetLanguage: string
): Promise<string[]> {
  const key = process.env.AZURE_TRANSLATOR_KEY
  const region = process.env.AZURE_TRANSLATOR_REGION

  if (!key || !region) {
    throw new Error('Azure Translator is not configured')
  }

  // Azure supports max 100 elements per request, each up to 10,000 chars
  // Batch in chunks of 25 to stay well within limits
  const BATCH_SIZE = 25
  const results: string[] = []

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE)
    const body = batch.map((text) => ({ Text: text }))

    const response = await axios.post<TranslationResult[]>(
      `${AZURE_ENDPOINT}/translate`,
      body,
      {
        params: {
          'api-version': '3.0',
          to: targetLanguage,
        },
        headers: {
          'Ocp-Apim-Subscription-Key': key,
          'Ocp-Apim-Subscription-Region': region,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    )

    for (const item of response.data) {
      results.push(item.translations[0]?.text || '')
    }
  }

  return results
}
