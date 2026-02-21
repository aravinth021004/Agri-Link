import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { createNotification } from '@/lib/notifications'

interface Params {
  params: Promise<{ id: string }>
}

// POST confirm UPI payment received (farmer only)
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: {
          select: { id: true, fullName: true },
        },
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    if (order.farmerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the farmer can confirm payment' },
        { status: 403 }
      )
    }

    if (order.paymentMethod !== 'UPI') {
      return NextResponse.json(
        { error: 'Payment confirmation is only for UPI orders' },
        { status: 400 }
      )
    }

    if (order.paymentStatus === 'CONFIRMED') {
      return NextResponse.json(
        { error: 'Payment already confirmed' },
        { status: 400 }
      )
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { paymentStatus: 'CONFIRMED' },
    })

    // Notify customer that payment was confirmed
    createNotification({
      userId: order.customerId,
      type: 'ORDER_UPDATE',
      title: `Payment confirmed for Order #${order.orderNumber}`,
      message: 'The farmer has confirmed receiving your UPI payment.',
      link: `/orders/${order.id}`,
    })

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error('Confirm payment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
