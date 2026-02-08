import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// GET subscription status
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: 'ACTIVE',
        endDate: {
          gt: new Date(),
        },
      },
      orderBy: { endDate: 'desc' },
    })

    if (!subscription) {
      return NextResponse.json({
        isActive: false,
        subscription: null,
        daysRemaining: 0,
      })
    }

    const daysRemaining = Math.ceil(
      (new Date(subscription.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )

    return NextResponse.json({
      isActive: true,
      subscription,
      daysRemaining,
      expiresAt: subscription.endDate,
    })
  } catch (error) {
    console.error('Get subscription status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
