import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { generateTotpSecret, generateQrCodeDataUrl } from '@/lib/totp'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, totpSecret: true, totpEnabled: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // If TOTP is already enabled, don't regenerate
    if (user.totpEnabled) {
      return NextResponse.json({ error: 'TOTP is already enabled' }, { status: 400 })
    }

    // Generate or reuse existing secret
    const secret = user.totpSecret || generateTotpSecret()

    // Store secret on user if new
    if (!user.totpSecret) {
      await prisma.user.update({
        where: { id: user.id },
        data: { totpSecret: secret },
      })
    }

    const qrCodeUrl = await generateQrCodeDataUrl(user.email, secret)

    return NextResponse.json({ qrCodeUrl, secret })
  } catch (error) {
    console.error('TOTP setup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
