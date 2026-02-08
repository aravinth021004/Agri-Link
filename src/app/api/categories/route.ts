import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { authOptions, canCreateProducts } from '@/lib/auth'
import { categorySchema } from '@/lib/validations'
import { slugify } from '@/lib/utils'

// GET categories
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const farmerId = searchParams.get('farmerId')

    const where: Record<string, unknown> = {}

    if (farmerId) {
      // Get farmer's custom categories + global categories
      where.OR = [
        { isGlobal: true },
        { farmerId },
      ]
    } else {
      // Get only global categories
      where.isGlobal = true
    }

    const categories = await prisma.category.findMany({
      where,
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Get categories error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST create category (farmer or admin)
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
    
    const result = categorySchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { name, nameHi, nameTa, description } = result.data
    const slug = slugify(name)

    // Check if farmer can create (has active subscription)
    const isFarmer = session.user.role === 'FARMER'
    const isAdmin = session.user.role === 'ADMIN'

    if (!isFarmer && !isAdmin) {
      return NextResponse.json(
        { error: 'Only farmers and admins can create categories' },
        { status: 403 }
      )
    }

    if (isFarmer) {
      const canCreate = await canCreateProducts(session.user.id)
      if (!canCreate) {
        return NextResponse.json(
          { error: 'Active subscription required' },
          { status: 403 }
        )
      }
    }

    // Check for existing slug
    const existing = await prisma.category.findUnique({
      where: { slug },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Category with this name already exists' },
        { status: 409 }
      )
    }

    const category = await prisma.category.create({
      data: {
        name,
        nameHi,
        nameTa,
        description,
        slug,
        isGlobal: isAdmin, // Admin-created categories are global
        farmerId: isFarmer ? session.user.id : null,
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Create category error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
