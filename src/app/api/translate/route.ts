import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { translateTexts } from '@/lib/translate'
import { z } from 'zod'

const translateSchema = z.object({
  texts: z.array(z.string().max(5000)).min(1).max(50),
  targetLanguage: z.enum(['en', 'hi', 'ta']),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const result = translateSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { texts, targetLanguage } = result.data

    // Skip if no Azure config (dev mode fallback)
    if (!process.env.AZURE_TRANSLATOR_KEY || !process.env.AZURE_TRANSLATOR_REGION) {
      return NextResponse.json(
        { error: 'Azure Translator is not configured. Add AZURE_TRANSLATOR_KEY and AZURE_TRANSLATOR_REGION to your environment.' },
        { status: 503 }
      )
    }

    const translations = await translateTexts(texts, targetLanguage)

    return NextResponse.json({ translations })
  } catch (error) {
    console.error('Translation error:', error)
    return NextResponse.json(
      { error: 'Translation failed' },
      { status: 500 }
    )
  }
}
