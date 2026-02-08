import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/notifications - Get user notifications
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '20')
  const unreadOnly = searchParams.get('unread') === 'true'

  try {
    // For now, we'll create notifications from messages, orders, and follows
    // In a real app, you'd have a dedicated Notification model
    
    const [unreadMessages, recentOrders] = await Promise.all([
      prisma.message.count({
        where: {
          receiverId: session.user.id,
          isRead: false,
        },
      }),
      prisma.order.findMany({
        where: {
          OR: [
            { customerId: session.user.id },
            { farmerId: session.user.id },
          ],
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          customer: { select: { fullName: true } },
          farmer: { select: { fullName: true } },
        },
      }),
    ])

    // Transform orders into notification-like objects
    const notifications = recentOrders.map((order) => {
      const isCustomer = order.customerId === session.user.id
      return {
        id: order.id,
        type: 'order',
        title: isCustomer
          ? `Order ${order.status.toLowerCase().replace(/_/g, ' ')}`
          : `New order from ${order.customer.fullName}`,
        message: `Order #${order.orderNumber}`,
        createdAt: order.createdAt,
        read: order.status !== 'PENDING',
        link: `/orders/${order.id}`,
      }
    })

    return NextResponse.json({
      notifications,
      unreadCount: unreadMessages,
    })
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

// PUT /api/notifications - Mark notifications as read
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  }

  try {
    // Mark all messages as read
    await prisma.message.updateMany({
      where: {
        receiverId: session.user.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to mark notifications:', error)
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
  }
}
