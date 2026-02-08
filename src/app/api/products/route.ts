import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { authOptions, canCreateProducts } from '@/lib/auth'
import { productSchema } from '@/lib/validations'

// GET all products or filtered products
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const categoryId = searchParams.get('categoryId')
    const farmerId = searchParams.get('farmerId')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const location = searchParams.get('location')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // Build where clause
    const where: Record<string, unknown> = {
      status: 'ACTIVE',
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (farmerId) {
      where.farmerId = farmerId
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

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [products, total] = await Promise.all([
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
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ])

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get products error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST create new product (farmers only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user can create products (farmer with active subscription)
    const canCreate = await canCreateProducts(session.user.id)
    if (!canCreate) {
      return NextResponse.json(
        { error: 'You must be a farmer with an active subscription to create products' },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    const result = productSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { title, description, price, quantity, unit, categoryId, deliveryOptions, deliveryRadius, deliveryFee } = result.data

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        farmerId: session.user.id,
        title,
        description,
        price,
        quantity,
        unit,
        categoryId,
        mediaUrls: body.mediaUrls || [],
        deliveryOptions,
        deliveryRadius,
        deliveryFee,
      },
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
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Create product error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
