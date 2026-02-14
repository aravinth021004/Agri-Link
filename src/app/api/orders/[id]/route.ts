import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { updateOrderStatusSchema } from '@/lib/validations'
import { createNotification } from '@/lib/notifications'
import { sendEmail, orderStatusEmail } from '@/lib/email'

interface Params {
  params: Promise<{ id: string }>
}

// GET single order
export async function GET(request: NextRequest, { params }: Params) {
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
          select: {
            id: true,
            fullName: true,
            profileImage: true,
            phone: true,
            email: true,
          },
        },
        farmer: {
          select: {
            id: true,
            fullName: true,
            profileImage: true,
            phone: true,
            location: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                mediaUrls: true,
                unit: true,
              },
            },
          },
        },
        ratings: true,
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Check access
    if (
      order.customerId !== session.user.id && 
      order.farmerId !== session.user.id &&
      session.user.role !== 'ADMIN'
    ) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Get order error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT update order status (farmer only)
export async function PUT(request: NextRequest, { params }: Params) {
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
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Only farmer, admin, or the customer (for cancellation) can update
    const isFarmer = order.farmerId === session.user.id
    const isCustomer = order.customerId === session.user.id
    const isAdmin = session.user.role === 'ADMIN'

    if (!isFarmer && !isCustomer && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    const result = updateOrderStatusSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { status } = result.data

    // Customers can only cancel PENDING orders
    if (isCustomer && !isFarmer && !isAdmin) {
      if (status !== 'CANCELLED' || order.status !== 'PENDING') {
        return NextResponse.json(
          { error: 'You can only cancel orders that are still pending' },
          { status: 400 }
        )
      }
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PACKED', 'CANCELLED'],
      PACKED: ['OUT_FOR_DELIVERY', 'CANCELLED'],
      OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
      DELIVERED: [], // Cannot change from delivered
      CANCELLED: [], // Cannot change from cancelled
    }

    if (!validTransitions[order.status]?.includes(status)) {
      return NextResponse.json(
        { error: `Cannot transition from ${order.status} to ${status}` },
        { status: 400 }
      )
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { 
        status,
        deliveryProof: body.deliveryProof || order.deliveryProof,
      },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    })

    const statusMessages: Record<string, string> = {
      CONFIRMED: 'Your order has been confirmed by the farmer',
      PACKED: 'Your order has been packed and is ready for dispatch',
      OUT_FOR_DELIVERY: 'Your order is out for delivery',
      DELIVERED: 'Your order has been delivered',
      CANCELLED: 'Your order has been cancelled',
    }

    // Notify the customer about status change
    createNotification({
      userId: order.customerId,
      type: 'ORDER_UPDATE',
      title: `Order #${order.orderNumber} ${status.toLowerCase().replace('_', ' ')}`,
      message: statusMessages[status] || `Order status changed to ${status}`,
      link: `/orders/${order.id}`,
    })

    // Send status email to customer (fire-and-forget)
    if (updatedOrder.customer.email) {
      const email = orderStatusEmail(order.orderNumber, status, order.id)
      sendEmail({ to: updatedOrder.customer.email, ...email }).catch(() => {})
    }

    // If customer cancelled, also notify the farmer
    if (status === 'CANCELLED' && isCustomer) {
      createNotification({
        userId: order.farmerId,
        type: 'ORDER_UPDATE',
        title: `Order #${order.orderNumber} cancelled`,
        message: 'The customer has cancelled this order',
        link: `/orders/${order.id}`,
      })
    }

    // Restore product quantities on cancellation
    if (status === 'CANCELLED') {
      const orderItems = await prisma.orderItem.findMany({
        where: { orderId: order.id },
      })
      for (const item of orderItems) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { quantity: { increment: item.quantity } },
        })
      }
    }

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error('Update order error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
