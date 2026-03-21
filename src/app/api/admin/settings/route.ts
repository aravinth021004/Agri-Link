import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// GET platform settings (all authenticated users, so they can pay)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await prisma.platformSettings.upsert({
      where: { id: 1 },
      update: {},
      create: {
        upiId: 'agrilink@upi',
        upiName: 'AgriLink',
      },
    })

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Get platform settings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT platform settings (admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const upiId = typeof body.upiId === 'string' ? body.upiId.trim() : ''
    const upiName = typeof body.upiName === 'string' ? body.upiName.trim() : ''

    if (!upiId || !upiName) {
      return NextResponse.json(
        { error: 'UPI ID and UPI name are required' },
        { status: 400 }
      )
    }

    if (!/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upiId)) {
      return NextResponse.json(
        { error: 'Invalid UPI ID format' },
        { status: 400 }
      )
    }

    const settings = await prisma.platformSettings.upsert({
      where: { id: 1 },
      update: { upiId, upiName },
      create: { id: 1, upiId, upiName },
    })

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Update platform settings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
