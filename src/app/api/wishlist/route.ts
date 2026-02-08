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
    const wishlistItems = await prisma.like.findMany({
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
      isLiked: true,
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
