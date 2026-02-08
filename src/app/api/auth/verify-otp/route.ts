import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyOtpSchema } from '@/lib/validations'

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

    // Find OTP record
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

    // Update user verification status
    if (otpRecord.userId) {
      const updateData: { emailVerified?: boolean; phoneVerified?: boolean } = {}
      
      if (purpose === 'VERIFY_EMAIL') {
        updateData.emailVerified = true
      } else if (purpose === 'VERIFY_PHONE') {
        updateData.phoneVerified = true
      }

      await prisma.user.update({
        where: { id: otpRecord.userId },
        data: updateData,
      })
    }

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
