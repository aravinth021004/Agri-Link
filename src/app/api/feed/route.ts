import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// Feed algorithm:
// Feed Score = 0.4(Recency) + 0.3(Engagement) + 0.3(Relationship)
// Recency: Posts from last 48 hours prioritized
// Engagement: Likes×1 + Comments×3 + Shares×5
// Relationship: Following farmer=100pts, Past orders=50pts, Same location=25pts

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const categoryId = searchParams.get('categoryId')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const location = searchParams.get('location')

    const skip = (page - 1) * limit
    const now = new Date()
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000)

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

    // Get user's following list and order history for relationship scoring
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

    // Fetch products
    const products = await prisma.product.findMany({
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
    })

    // Calculate feed scores
    const scoredProducts = products.map(product => {
      // Recency score (0-100)
      const productAge = now.getTime() - new Date(product.createdAt).getTime()
      const twoDaysMs = 48 * 60 * 60 * 1000
      const recencyScore = product.createdAt >= twoDaysAgo 
        ? 100 - (productAge / twoDaysMs) * 100
        : Math.max(0, 50 - (productAge / twoDaysMs) * 10)

      // Engagement score (normalized to 0-100)
      const engagementRaw = 
        product._count.likes * 1 + 
        product._count.comments * 3 + 
        product.sharesCount * 5
      const engagementScore = Math.min(100, engagementRaw * 2)

      // Relationship score (0-100)
      let relationshipScore = 0
      if (followingIds.includes(product.farmerId)) {
        relationshipScore += 100
      }
      if (orderedFarmerIds.includes(product.farmerId)) {
        relationshipScore += 50
      }
      if (userLocation && product.farmer.location?.toLowerCase().includes(userLocation.toLowerCase())) {
        relationshipScore += 25
      }
      relationshipScore = Math.min(100, relationshipScore)

      // Final feed score
      const feedScore = 
        0.4 * recencyScore + 
        0.3 * engagementScore + 
        0.3 * relationshipScore

      return {
        ...product,
        feedScore,
      }
    })

    // Sort by feed score descending
    scoredProducts.sort((a, b) => b.feedScore - a.feedScore)

    // Paginate
    const paginatedProducts = scoredProducts.slice(skip, skip + limit)

    // Check if user liked each product
    let likedProductIds: string[] = []
    if (session?.user) {
      const likes = await prisma.like.findMany({
        where: {
          userId: session.user.id,
          productId: {
            in: paginatedProducts.map(p => p.id),
          },
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
        total: products.length,
        totalPages: Math.ceil(products.length / limit),
        hasMore: skip + limit < products.length,
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
