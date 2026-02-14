import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { signupSchema } from '@/lib/validations'
import { generateOTP } from '@/lib/utils'
import { sendEmail, welcomeEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const result = signupSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { email, phone, password, fullName } = result.data

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email or phone already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        phone,
        passwordHash,
        fullName,
        role: 'CUSTOMER',
      },
      select: {
        id: true,
        email: true,
        phone: true,
        fullName: true,
        role: true,
      },
    })

    // Generate OTP for email verification
    const otp = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    await prisma.otpCode.create({
      data: {
        userId: user.id,
        email: user.email,
        code: otp,
        purpose: 'VERIFY_EMAIL',
        expiresAt,
      },
    })

    // Log OTP to console (development mode)
    console.log('='.repeat(50))
    console.log(`📧 OTP for ${email}: ${otp}`)
    console.log(`⏰ Expires at: ${expiresAt.toLocaleString()}`)
    console.log('='.repeat(50))

    // Send welcome email (fire-and-forget)
    const welcome = welcomeEmail(fullName)
    sendEmail({ to: email, ...welcome }).catch(() => {})

    return NextResponse.json({
      message: 'User created successfully. Please verify your email.',
      user,
      requiresVerification: true,
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
