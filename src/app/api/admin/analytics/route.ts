import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// GET platform analytics (admin only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const now = new Date()

    const [
      totalUsers,
      activeSubscriptions,
      totalOrders,
      revenueData,
      usersByRole,
      recentOrders,
    ] = await Promise.all([
      // Total users count
      prisma.user.count(),
      
      // Active subscriptions
      prisma.subscription.count({
        where: {
          status: 'ACTIVE',
          endDate: { gt: now },
        },
      }),
      
      // Total orders
      prisma.order.count(),
      
      // Total revenue (sum of all order amounts)
      prisma.order.aggregate({
        _sum: { totalAmount: true },
      }),
      
      // Users grouped by role
      prisma.user.groupBy({
        by: ['role'],
        _count: { role: true },
      }),
      
      // Recent orders
      prisma.order.findMany({
        select: {
          id: true,
          orderNumber: true,
          totalAmount: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ])

    return NextResponse.json({
      totalUsers,
      activeSubscriptions,
      totalOrders,
      totalRevenue: revenueData._sum.totalAmount || 0,
      usersByRole: usersByRole.map(item => ({
        role: item.role,
        _count: item._count.role,
      })),
      recentOrders,
    })
  } catch (error) {
    console.error('Get analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
