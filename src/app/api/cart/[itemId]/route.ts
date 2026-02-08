import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { updateCartItemSchema } from '@/lib/validations'

interface Params {
  params: Promise<{ itemId: string }>
}

// PUT update cart item
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { itemId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { product: true },
    })

    if (!cartItem || cartItem.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    
    const result = updateCartItemSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { quantity, deliveryOption } = result.data

    // Validate quantity
    if (quantity && cartItem.product.quantity < quantity) {
      return NextResponse.json(
        { error: 'Insufficient quantity available' },
        { status: 400 }
      )
    }

    // Validate delivery option
    if (deliveryOption) {
      const deliveryOptions = cartItem.product.deliveryOptions as string[]
      if (!deliveryOptions.includes(deliveryOption)) {
        return NextResponse.json(
          { error: 'Selected delivery option not available' },
          { status: 400 }
        )
      }
    }

    const updatedItem = await prisma.cartItem.update({
      where: { id: itemId },
      data: {
        quantity: quantity || cartItem.quantity,
        deliveryOption: deliveryOption || cartItem.deliveryOption,
      },
      include: {
        product: {
          include: {
            farmer: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(updatedItem)
  } catch (error) {
    console.error('Update cart error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE remove cart item
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { itemId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
    })

    if (!cartItem || cartItem.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      )
    }

    await prisma.cartItem.delete({
      where: { id: itemId },
    })

    return NextResponse.json({ message: 'Item removed from cart' })
  } catch (error) {
    console.error('Remove cart item error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
