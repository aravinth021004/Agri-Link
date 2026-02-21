import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { cartItemSchema, updateCartItemSchema } from '@/lib/validations'

// GET cart items grouped by farmer
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: session.user.id },
      include: {
        product: {
          include: {
            farmer: {
              select: {
                id: true,
                fullName: true,
                profileImage: true,
                location: true,
                upiId: true,
              },
            },
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Group items by farmer
    const groupedByFarmer = cartItems.reduce((acc, item) => {
      const farmerId = item.product.farmerId
      if (!acc[farmerId]) {
        acc[farmerId] = {
          farmer: item.product.farmer,
          items: [],
          subtotal: 0,
          deliveryFee: 0,
        }
      }
      
      const itemTotal = Number(item.product.price) * item.quantity
      acc[farmerId].items.push({
        ...item,
        itemTotal,
      })
      acc[farmerId].subtotal += itemTotal
      
      // Use delivery fee from first item with home delivery
      if (item.deliveryOption === 'HOME_DELIVERY' && item.product.deliveryFee) {
        acc[farmerId].deliveryFee = Math.max(
          acc[farmerId].deliveryFee,
          Number(item.product.deliveryFee)
        )
      }
      
      return acc
    }, {} as Record<string, { farmer: typeof cartItems[0]['product']['farmer']; items: (typeof cartItems[0] & { itemTotal: number })[]; subtotal: number; deliveryFee: number }>)

    const farmerCarts = Object.values(groupedByFarmer).map(group => ({
      ...group,
      total: group.subtotal + group.deliveryFee,
    }))

    const grandTotal = farmerCarts.reduce((sum, cart) => sum + cart.total, 0)

    return NextResponse.json({
      farmerCarts,
      summary: {
        itemCount: cartItems.length,
        farmerCount: farmerCarts.length,
        grandTotal,
      },
    })
  } catch (error) {
    console.error('Get cart error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST add item to cart
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
    
    const result = cartItemSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { productId, quantity, deliveryOption } = result.data

    // Check if product exists and is available
    const product = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product || product.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Product not available' },
        { status: 404 }
      )
    }

    if (product.quantity < quantity) {
      return NextResponse.json(
        { error: 'Insufficient quantity available' },
        { status: 400 }
      )
    }

    // Check if delivery option is available for this product
    const deliveryOptions = product.deliveryOptions as string[]
    if (!deliveryOptions.includes(deliveryOption)) {
      return NextResponse.json(
        { error: 'Selected delivery option not available for this product' },
        { status: 400 }
      )
    }

    // Upsert cart item
    const cartItem = await prisma.cartItem.upsert({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId,
        },
      },
      update: {
        quantity,
        deliveryOption,
      },
      create: {
        userId: session.user.id,
        productId,
        quantity,
        deliveryOption,
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

    return NextResponse.json(cartItem, { status: 201 })
  } catch (error) {
    console.error('Add to cart error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE clear entire cart
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await prisma.cartItem.deleteMany({
      where: { userId: session.user.id },
    })

    return NextResponse.json({ message: 'Cart cleared' })
  } catch (error) {
    console.error('Clear cart error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
