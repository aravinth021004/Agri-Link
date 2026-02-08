import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

interface Params {
  params: Promise<{ farmerId: string }>
}

// POST toggle follow
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { farmerId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (session.user.id === farmerId) {
      return NextResponse.json(
        { error: 'Cannot follow yourself' },
        { status: 400 }
      )
    }

    // Check if farmer exists and is actually a farmer
    const farmer = await prisma.user.findUnique({
      where: { id: farmerId },
      select: { id: true, role: true },
    })

    if (!farmer || farmer.role !== 'FARMER') {
      return NextResponse.json(
        { error: 'Farmer not found' },
        { status: 404 }
      )
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_farmerId: {
          followerId: session.user.id,
          farmerId,
        },
      },
    })

    if (existingFollow) {
      // Unfollow
      await prisma.follow.delete({
        where: { id: existingFollow.id },
      })

      const followerCount = await prisma.follow.count({
        where: { farmerId },
      })

      return NextResponse.json({
        following: false,
        followerCount,
      })
    } else {
      // Follow
      await prisma.follow.create({
        data: {
          followerId: session.user.id,
          farmerId,
        },
      })

      const followerCount = await prisma.follow.count({
        where: { farmerId },
      })

      return NextResponse.json({
        following: true,
        followerCount,
      })
    }
  } catch (error) {
    console.error('Follow error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET check if following
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { farmerId } = await params
    const session = await getServerSession(authOptions)

    const followerCount = await prisma.follow.count({
      where: { farmerId },
    })

    let isFollowing = false
    if (session?.user) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_farmerId: {
            followerId: session.user.id,
            farmerId,
          },
        },
      })
      isFollowing = !!follow
    }

    return NextResponse.json({
      following: isFollowing,
      followerCount,
    })
  } catch (error) {
    console.error('Get follow status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
