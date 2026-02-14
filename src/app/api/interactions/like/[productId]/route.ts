import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { createNotification } from '@/lib/notifications'

interface Params {
  params: Promise<{ productId: string }>
}

// POST toggle like
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { productId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId,
        },
      },
    })

    if (existingLike) {
      // Unlike
      await prisma.like.delete({
        where: { id: existingLike.id },
      })

      const updated = await prisma.product.update({
        where: { id: productId },
        data: { likesCount: { decrement: 1 } },
      })

      return NextResponse.json({
        liked: false,
        likesCount: Math.max(0, updated.likesCount),
      })
    } else {
      // Like
      await prisma.like.create({
        data: {
          userId: session.user.id,
          productId,
        },
      })

      const updated = await prisma.product.update({
        where: { id: productId },
        data: { likesCount: { increment: 1 } },
      })

      // Notify product owner about the like
      if (product.farmerId !== session.user.id) {
        createNotification({
          userId: product.farmerId,
          type: 'NEW_LIKE',
          title: 'New like on your product',
          message: `${session.user.fullName} liked your product "${product.title}"`,
          link: `/products/${productId}`,
        })
      }

      return NextResponse.json({
        liked: true,
        likesCount: updated.likesCount,
      })
    }
  } catch (error) {
    console.error('Like error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
