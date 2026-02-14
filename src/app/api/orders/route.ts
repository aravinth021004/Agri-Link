import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { createOrderSchema } from '@/lib/validations'
import { generateOrderNumber } from '@/lib/utils'
import { sendEmail, orderConfirmationEmail } from '@/lib/email'

// GET user's orders
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') || 'customer' // customer or farmer
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (role === 'farmer') {
      where.farmerId = session.user.id
    } else {
      where.customerId = session.user.id
    }

    if (status) {
      where.status = status
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              fullName: true,
              profileImage: true,
              phone: true,
            },
          },
          farmer: {
            select: {
              id: true,
              fullName: true,
              profileImage: true,
              phone: true,
              location: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  title: true,
                  mediaUrls: true,
                  unit: true,
                },
              },
            },
          },
          ratings: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ])

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get orders error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST create orders from cart (one order per farmer)
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
    
    const result = createOrderSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { deliveryAddress, notes } = result.data
    const paymentId = body.paymentId // Mock payment ID

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      )
    }

    // Get cart items
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: session.user.id },
      include: {
        product: true,
      },
    })

    if (cartItems.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      )
    }

    // Group by farmer
    const groupedByFarmer = cartItems.reduce((acc, item) => {
      const farmerId = item.product.farmerId
      if (!acc[farmerId]) {
        acc[farmerId] = []
      }
      acc[farmerId].push(item)
      return acc
    }, {} as Record<string, typeof cartItems>)

    // Create orders for each farmer
    const orders = await prisma.$transaction(async (tx) => {
      const createdOrders = []

      for (const [farmerId, items] of Object.entries(groupedByFarmer)) {
        const orderNumber = generateOrderNumber()
        
        // Calculate totals
        let subtotal = 0
        const orderItems = items.map(item => {
          const itemSubtotal = Number(item.product.price) * item.quantity
          subtotal += itemSubtotal
          return {
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.product.price,
            subtotal: itemSubtotal,
          }
        })

        // Get delivery option and fee from first item
        const deliveryOption = items[0].deliveryOption
        let deliveryFee = 0
        if (deliveryOption === 'HOME_DELIVERY') {
          deliveryFee = Number(items[0].product.deliveryFee || 0)
        }

        const totalAmount = subtotal + deliveryFee

        // Create order
        const order = await tx.order.create({
          data: {
            orderNumber,
            customerId: session.user.id,
            farmerId,
            subtotal,
            deliveryOption,
            deliveryFee,
            totalAmount,
            deliveryAddress: deliveryAddress || undefined,
            paymentId,
            notes,
            items: {
              create: orderItems,
            },
          },
          include: {
            items: {
              include: {
                product: true,
              },
            },
            farmer: {
              select: {
                id: true,
                fullName: true,
                phone: true,
              },
            },
          },
        })

        // Update product quantities
        for (const item of items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              quantity: {
                decrement: item.quantity,
              },
            },
          })
        }

        createdOrders.push(order)
      }

      // Clear cart
      await tx.cartItem.deleteMany({
        where: { userId: session.user.id },
      })

      return createdOrders
    })

    // Log order confirmation (development mode)
    console.log('='.repeat(50))
    console.log('📦 New Orders Created:')
    orders.forEach(order => {
      console.log(`  Order #${order.orderNumber} - ₹${order.totalAmount}`)
    })
    console.log('='.repeat(50))

    // Send order confirmation emails (fire-and-forget)
    if (session.user.email) {
      for (const order of orders) {
        const items = order.items.map(
          (i: { product: { title: string }; quantity: number; unitPrice: unknown }) =>
            `${i.product.title} x${i.quantity} - ₹${Number(i.unitPrice) * i.quantity}`
        )
        const email = orderConfirmationEmail(order.orderNumber, items, `₹${order.totalAmount}`)
        sendEmail({ to: session.user.email, ...email }).catch(() => {})
      }
    }

    return NextResponse.json({
      message: 'Orders created successfully',
      orders,
    }, { status: 201 })
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
