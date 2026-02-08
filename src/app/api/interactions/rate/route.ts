import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { ratingSchema } from '@/lib/validations'

// POST create rating (only after delivered order)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    const result = ratingSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { orderId, rating, review } = result.data

    // Check if order exists and is delivered
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    if (order.customerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    if (order.status !== 'DELIVERED') {
      return NextResponse.json(
        { error: 'Can only rate delivered orders' },
        { status: 400 }
      )
    }

    // Check if already rated
    const existingRating = await prisma.rating.findUnique({
      where: {
        customerId_orderId: {
          customerId: session.user.id,
          orderId,
        },
      },
    })

    if (existingRating) {
      return NextResponse.json(
        { error: 'Already rated this order' },
        { status: 400 }
      )
    }

    const newRating = await prisma.rating.create({
      data: {
        customerId: session.user.id,
        farmerId: order.farmerId,
        orderId,
        rating,
        review,
      },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            profileImage: true,
          },
        },
      },
    })

    return NextResponse.json(newRating, { status: 201 })
  } catch (error) {
    console.error('Create rating error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET farmer's ratings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const farmerId = searchParams.get('farmerId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!farmerId) {
      return NextResponse.json(
        { error: 'Farmer ID is required' },
        { status: 400 }
      )
    }

    const skip = (page - 1) * limit

    const [ratings, total, avgRating] = await Promise.all([
      prisma.rating.findMany({
        where: { farmerId },
        include: {
          customer: {
            select: {
              id: true,
              fullName: true,
              profileImage: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.rating.count({ where: { farmerId } }),
      prisma.rating.aggregate({
        where: { farmerId },
        _avg: { rating: true },
      }),
    ])

    return NextResponse.json({
      ratings,
      averageRating: avgRating._avg.rating || 0,
      totalRatings: total,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get ratings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
