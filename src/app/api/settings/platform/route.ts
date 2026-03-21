import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET public platform payment settings
export async function GET() {
  try {
    const settings = await prisma.platformSettings.findUnique({
      where: { id: 1 },
      select: {
        upiId: true,
        upiName: true,
      },
    })

    if (!settings) {
      return NextResponse.json({
        upiId: 'agrilink@upi',
        upiName: 'AgriLink',
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Get public platform settings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
