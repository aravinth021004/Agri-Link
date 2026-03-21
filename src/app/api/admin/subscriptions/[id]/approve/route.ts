import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

const PLAN_DURATIONS: Record<string, number> = {
  farmer_monthly: 30,
  farmer_quarterly: 90,
  farmer_yearly: 365,
}

// POST approve a pending subscription
export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await context.params

    const pending = await prisma.subscription.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        planId: true,
        status: true,
      },
    })

    if (!pending) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    if (pending.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Only pending subscriptions can be approved' },
        { status: 400 }
      )
    }

    const durationDays = PLAN_DURATIONS[pending.planId]
    if (!durationDays) {
      return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 })
    }

    const startDate = new Date()
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + durationDays)

    const subscription = await prisma.$transaction(async (tx) => {
      const updatedSubscription = await tx.subscription.update({
        where: { id: pending.id },
        data: {
          status: 'ACTIVE',
          startDate,
          endDate,
        },
      })

      await tx.user.update({
        where: { id: pending.userId },
        data: { role: 'FARMER' },
      })

      return updatedSubscription
    })

    return NextResponse.json({
      message: 'Subscription approved',
      subscription,
    })
  } catch (error) {
    console.error('Approve subscription error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
