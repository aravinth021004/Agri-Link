import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { profileSchema } from '@/lib/validations'

// GET user profile
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
    const userId = searchParams.get('userId') || session.user.id

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        fullName: true,
        role: true,
        profileImage: true,
        bio: true,
        location: true,
        language: true,
        status: true,
        emailVerified: true,
        phoneVerified: true,
        upiId: true,
        createdAt: true,
        _count: {
          select: {
            products: true,
            followers: true,
            following: true,
            orders: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get average rating for farmers
    let averageRating = null
    if (user.role === 'FARMER') {
      const rating = await prisma.rating.aggregate({
        where: { farmerId: userId },
        _avg: { rating: true },
        _count: { rating: true },
      })
      averageRating = {
        average: rating._avg.rating || 0,
        count: rating._count.rating,
      }
    }

    // Check if current user follows this user (for farmer profiles)
    let isFollowing = false
    if (session.user.id !== userId && user.role === 'FARMER') {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_farmerId: {
            followerId: session.user.id,
            farmerId: userId,
          },
        },
      })
      isFollowing = !!follow
    }

    return NextResponse.json({
      user,
      averageRating,
      isFollowing,
    })
  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT update profile
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    const result = profileSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = { ...result.data }

    // Handle profile image update
    if (body.profileImage) {
      updateData.profileImage = body.profileImage
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        phone: true,
        fullName: true,
        role: true,
        profileImage: true,
        bio: true,
        location: true,
        language: true,
        upiId: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
