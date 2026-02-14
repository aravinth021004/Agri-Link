import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/wishlist - Get user's wishlist
export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  }

  try {
    const wishlistItems = await prisma.wishlistItem.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        product: {
          include: {
            farmer: {
              select: {
                id: true,
                fullName: true,
                profileImage: true,
                location: true,
              },
            },
            category: true,
            _count: {
              select: {
                likes: true,
                comments: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Also check which products the user has liked
    const productIds = wishlistItems.map(item => item.productId)
    const likes = await prisma.like.findMany({
      where: {
        userId: session.user.id,
        productId: { in: productIds },
      },
      select: { productId: true },
    })
    const likedIds = new Set(likes.map(l => l.productId))

    const products = wishlistItems.map((item) => ({
      id: item.product.id,
      title: item.product.title,
      description: item.product.description,
      price: item.product.price,
      quantity: item.product.quantity,
      unit: item.product.unit,
      mediaUrls: item.product.mediaUrls,
      likesCount: item.product._count.likes,
      commentsCount: item.product._count.comments,
      createdAt: item.product.createdAt,
      isLiked: likedIds.has(item.product.id),
      isWishlisted: true,
      farmer: item.product.farmer,
      category: item.product.category,
      addedAt: item.createdAt,
    }))

    return NextResponse.json({ products })
  } catch (error) {
    console.error('Failed to fetch wishlist:', error)
    return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 })
  }
}

// POST /api/wishlist - Toggle wishlist item
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { productId } = body

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId, status: 'ACTIVE' },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Toggle wishlist
    const existing = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId,
        },
      },
    })

    if (existing) {
      await prisma.wishlistItem.delete({
        where: { id: existing.id },
      })
      return NextResponse.json({ wishlisted: false })
    } else {
      await prisma.wishlistItem.create({
        data: {
          userId: session.user.id,
          productId,
        },
      })
      return NextResponse.json({ wishlisted: true })
    }
  } catch (error) {
    console.error('Toggle wishlist error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
