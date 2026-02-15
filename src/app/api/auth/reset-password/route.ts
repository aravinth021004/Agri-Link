import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { resetPasswordSchema, newPasswordSchema } from '@/lib/validations'
import { generateOTP } from '@/lib/utils'
import { sendEmail, otpEmail } from '@/lib/email'

// Request password reset
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const result = resetPasswordSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { email } = result.data

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      // Return success even if user not found (security)
      return NextResponse.json({
        message: 'If the email exists, a reset code has been sent.',
      })
    }

    // Generate OTP
    const otp = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Delete any existing reset OTPs for this user
    await prisma.otpCode.deleteMany({
      where: {
        userId: user.id,
        purpose: 'RESET_PASSWORD',
        used: false,
      },
    })

    await prisma.otpCode.create({
      data: {
        userId: user.id,
        email: user.email,
        code: otp,
        purpose: 'RESET_PASSWORD',
        expiresAt,
      },
    })

    // Log OTP to console (development mode)
    console.log('='.repeat(50))
    console.log(`🔐 Password Reset OTP for ${email}: ${otp}`)
    console.log(`⏰ Expires at: ${expiresAt.toLocaleString()}`)
    console.log('='.repeat(50))

    // Send OTP via email
    const otpMail = otpEmail(otp)
    sendEmail({ to: email, ...otpMail }).catch(() => {})

    return NextResponse.json({
      message: 'If the email exists, a reset code has been sent.',
    })
  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Set new password
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    const result = newPasswordSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { token, password } = result.data

    // Find valid OTP
    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        code: token,
        purpose: 'RESET_PASSWORD',
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    })

    if (!otpRecord || !otpRecord.userId) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 12)

    // Update user password
    await prisma.user.update({
      where: { id: otpRecord.userId },
      data: { passwordHash },
    })

    // Mark OTP as used
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { used: true },
    })

    return NextResponse.json({
      message: 'Password reset successful',
    })
  } catch (error) {
    console.error('Password update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
