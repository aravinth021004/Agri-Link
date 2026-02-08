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
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [
      totalUsers,
      totalFarmers,
      totalCustomers,
      activeSubscriptions,
      totalProducts,
      totalOrders,
      revenueData,
      newUsersThisMonth,
      ordersThisWeek,
      topFarmers,
    ] = await Promise.all([
      // User counts
      prisma.user.count(),
      prisma.user.count({ where: { role: 'FARMER' } }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      
      // Active subscriptions
      prisma.subscription.count({
        where: {
          status: 'ACTIVE',
          endDate: { gt: now },
        },
      }),
      
      // Products
      prisma.product.count({ where: { status: 'ACTIVE' } }),
      
      // Orders
      prisma.order.count(),
      
      // Revenue (sum of subscription amounts)
      prisma.subscription.aggregate({
        _sum: { amount: true },
        where: { status: 'ACTIVE' },
      }),
      
      // New users this month
      prisma.user.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      
      // Orders this week
      prisma.order.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
      
      // Top farmers by orders
      prisma.user.findMany({
        where: { role: 'FARMER' },
        select: {
          id: true,
          fullName: true,
          profileImage: true,
          _count: {
            select: { farmerOrders: true },
          },
        },
        orderBy: {
          farmerOrders: { _count: 'desc' },
        },
        take: 5,
      }),
    ])

    // Order status distribution
    const orderStatusDistribution = await prisma.order.groupBy({
      by: ['status'],
      _count: { status: true },
    })

    return NextResponse.json({
      users: {
        total: totalUsers,
        farmers: totalFarmers,
        customers: totalCustomers,
        newThisMonth: newUsersThisMonth,
      },
      subscriptions: {
        active: activeSubscriptions,
        revenue: revenueData._sum.amount || 0,
      },
      products: {
        active: totalProducts,
      },
      orders: {
        total: totalOrders,
        thisWeek: ordersThisWeek,
        statusDistribution: orderStatusDistribution.reduce((acc, item) => {
          acc[item.status] = item._count.status
          return acc
        }, {} as Record<string, number>),
      },
      topFarmers: topFarmers.map(f => ({
        ...f,
        orderCount: f._count.farmerOrders,
      })),
    })
  } catch (error) {
    console.error('Get analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
