import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyOtpSchema } from '@/lib/validations'
import { verifyTotpCode } from '@/lib/totp'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const result = verifyOtpSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { email, phone, code, purpose } = result.data

    // For email/phone verification, use TOTP
    if (purpose === 'VERIFY_EMAIL' || purpose === 'VERIFY_PHONE') {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: email || undefined },
            { phone: phone || undefined },
          ],
        },
      })

      if (!user || !user.totpSecret) {
        return NextResponse.json(
          { error: 'Invalid verification request' },
          { status: 400 }
        )
      }

      const isValid = verifyTotpCode(user.totpSecret, code)

      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid authenticator code' },
          { status: 400 }
        )
      }

      const updateData: { emailVerified?: boolean; phoneVerified?: boolean; totpEnabled?: boolean } = {}
      if (purpose === 'VERIFY_EMAIL') {
        updateData.emailVerified = true
        updateData.totpEnabled = true
      } else if (purpose === 'VERIFY_PHONE') {
        updateData.phoneVerified = true
        updateData.totpEnabled = true
      }

      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      })

      return NextResponse.json({
        message: 'Verification successful',
        verified: true,
      })
    }

    // For password reset, use stored OTP from database
    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        OR: [
          { email: email || undefined },
          { phone: phone || undefined },
        ],
        code,
        purpose,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    })

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      )
    }

    // Mark OTP as used
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { used: true },
    })

    return NextResponse.json({
      message: 'Verification successful',
      verified: true,
    })
  } catch (error) {
    console.error('OTP verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
