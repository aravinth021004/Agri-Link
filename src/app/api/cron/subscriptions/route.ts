import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'

// POST - Cron job to expire subscriptions and downgrade users
// Called by Vercel Cron or external scheduler
// Secured via CRON_SECRET header
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const now = new Date()

    // 1. Find all expired active subscriptions
    const expiredSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        endDate: { lt: now },
      },
      include: {
        user: {
          select: { id: true, fullName: true, role: true },
        },
      },
    })

    if (expiredSubscriptions.length === 0) {
      return NextResponse.json({ message: 'No expired subscriptions', processed: 0 })
    }

    let downgraded = 0
    let expired = 0

    for (const subscription of expiredSubscriptions) {
      // Mark subscription as expired
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'EXPIRED' },
      })
      expired++

      // Check if user has any other active subscription
      const otherActive = await prisma.subscription.findFirst({
        where: {
          userId: subscription.userId,
          status: 'ACTIVE',
          endDate: { gt: now },
          id: { not: subscription.id },
        },
      })

      // Downgrade to CUSTOMER if no other active subscription
      if (!otherActive && subscription.user.role === 'FARMER') {
        await prisma.user.update({
          where: { id: subscription.userId },
          data: { role: 'CUSTOMER' },
        })
        downgraded++

        createNotification({
          userId: subscription.userId,
          type: 'SUBSCRIPTION_EXPIRY',
          title: 'Subscription Expired',
          message: 'Your farmer subscription has expired. Renew to continue selling products.',
          link: '/subscription',
        })
      }
    }

    // 2. Warn users whose subscription expires within 3 days
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    const expiringSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          gt: now,
          lte: threeDaysFromNow,
        },
      },
      select: { userId: true, endDate: true },
    })

    for (const sub of expiringSubscriptions) {
      const daysLeft = Math.ceil((sub.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      createNotification({
        userId: sub.userId,
        type: 'SUBSCRIPTION_EXPIRY',
        title: 'Subscription Expiring Soon',
        message: `Your subscription expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. Renew now to avoid losing access.`,
        link: '/subscription',
      })
    }

    return NextResponse.json({
      message: 'Cron job completed',
      expired,
      downgraded,
      warned: expiringSubscriptions.length,
    })
  } catch (error) {
    console.error('Subscription cron error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
