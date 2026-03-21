import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// GET subscriptions for admin review (pending first)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const subscriptions = await prisma.subscription.findMany({
      select: {
        id: true,
        userId: true,
        planId: true,
        amount: true,
        status: true,
        upiRefId: true,
        createdAt: true,
        startDate: true,
        endDate: true,
        user: {
          select: {
            email: true,
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const statusRank: Record<string, number> = {
      PENDING: 0,
      ACTIVE: 1,
      EXPIRED: 2,
      CANCELLED: 3,
    }

    const sorted = [...subscriptions].sort((a, b) => {
      const rankA = statusRank[a.status] ?? 99
      const rankB = statusRank[b.status] ?? 99
      if (rankA !== rankB) return rankA - rankB
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return NextResponse.json({ subscriptions: sorted })
  } catch (error) {
    console.error('Get admin subscriptions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
