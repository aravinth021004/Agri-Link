import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// Optimized Feed: Use database-level sorting for base set, 
// then apply relationship scoring on a limited result set

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const categoryId = searchParams.get('categoryId')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const location = searchParams.get('location')

    const skip = (page - 1) * limit

    // Build where clause
    const where: Record<string, unknown> = {
      status: 'ACTIVE',
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) (where.price as Record<string, number>).gte = parseFloat(minPrice)
      if (maxPrice) (where.price as Record<string, number>).lte = parseFloat(maxPrice)
    }

    if (location) {
      where.farmer = {
        location: {
          contains: location,
          mode: 'insensitive',
        },
      }
    }

    // Get user's relationship data for scoring (only if authenticated)
    let followingIds: string[] = []
    let orderedFarmerIds: string[] = []
    let userLocation = ''

    if (session?.user) {
      const [following, orders, user] = await Promise.all([
        prisma.follow.findMany({
          where: { followerId: session.user.id },
          select: { farmerId: true },
        }),
        prisma.order.findMany({
          where: { customerId: session.user.id },
          select: { farmerId: true },
          distinct: ['farmerId'],
        }),
        prisma.user.findUnique({
          where: { id: session.user.id },
          select: { location: true },
        }),
      ])

      followingIds = following.map(f => f.farmerId)
      orderedFarmerIds = orders.map(o => o.farmerId)
      userLocation = user?.location || ''
    }

    // Fetch a larger window from DB sorted by engagement + recency,
    // then apply relationship scoring client-side on this limited set
    const fetchLimit = limit * 3 // Get 3x to have room for reranking
    const fetchSkip = Math.max(0, (page - 1) * limit)

    const [candidateProducts, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          farmer: {
            select: {
              id: true,
              fullName: true,
              profileImage: true,
              location: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
        orderBy: [
          { createdAt: 'desc' },
        ],
        skip: fetchSkip,
        take: fetchLimit,
      }),
      prisma.product.count({ where }),
    ])

    // Score and rank the candidates
    const now = new Date()
    const twoDaysMs = 48 * 60 * 60 * 1000

    const scoredProducts = candidateProducts.map(product => {
      const productAge = now.getTime() - new Date(product.createdAt).getTime()
      const recencyScore = productAge < twoDaysMs
        ? 100 - (productAge / twoDaysMs) * 100
        : Math.max(0, 50 - (productAge / twoDaysMs) * 10)

      const engagementRaw = 
        product._count.likes * 1 + 
        product._count.comments * 3 + 
        product.sharesCount * 5
      const engagementScore = Math.min(100, engagementRaw * 2)

      let relationshipScore = 0
      if (followingIds.includes(product.farmerId)) relationshipScore += 100
      if (orderedFarmerIds.includes(product.farmerId)) relationshipScore += 50
      if (userLocation && product.farmer.location?.toLowerCase().includes(userLocation.toLowerCase())) {
        relationshipScore += 25
      }
      relationshipScore = Math.min(100, relationshipScore)

      const feedScore = 
        0.4 * recencyScore + 
        0.3 * engagementScore + 
        0.3 * relationshipScore

      return { ...product, feedScore }
    })

    // Sort by score and take only the needed page
    scoredProducts.sort((a, b) => b.feedScore - a.feedScore)
    const paginatedProducts = scoredProducts.slice(0, limit)

    // Check like status
    let likedProductIds: string[] = []
    if (session?.user && paginatedProducts.length > 0) {
      const likes = await prisma.like.findMany({
        where: {
          userId: session.user.id,
          productId: { in: paginatedProducts.map(p => p.id) },
        },
        select: { productId: true },
      })
      likedProductIds = likes.map(l => l.productId)
    }

    const productsWithLikeStatus = paginatedProducts.map(product => ({
      ...product,
      isLiked: likedProductIds.includes(product.id),
    }))

    return NextResponse.json({
      products: productsWithLikeStatus,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      },
    })
  } catch (error) {
    console.error('Feed error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
