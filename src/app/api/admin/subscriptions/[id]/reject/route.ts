import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// POST reject a pending subscription
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
        status: true,
      },
    })

    if (!pending) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    if (pending.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Only pending subscriptions can be rejected' },
        { status: 400 }
      )
    }

    const subscription = await prisma.subscription.update({
      where: { id: pending.id },
      data: {
        status: 'CANCELLED',
      },
    })

    return NextResponse.json({
      message: 'Subscription rejected',
      subscription,
    })
  } catch (error) {
    console.error('Reject subscription error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
