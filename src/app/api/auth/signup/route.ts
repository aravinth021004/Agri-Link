import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { signupSchema } from '@/lib/validations'
import { generateTotpSecret, generateQrCodeDataUrl } from '@/lib/totp'
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

    // Generate TOTP secret for email verification
    const totpSecret = generateTotpSecret()
    await prisma.user.update({
      where: { id: user.id },
      data: { totpSecret },
    })

    const qrCodeUrl = await generateQrCodeDataUrl(email, totpSecret)

    // Send welcome email (fire-and-forget)
    const welcome = welcomeEmail(fullName)
    sendEmail({ to: email, ...welcome }).catch(() => {})

    return NextResponse.json({
      message: 'User created successfully. Please set up authenticator.',
      user,
      requiresVerification: true,
      qrCodeUrl,
      totpSecret,
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
