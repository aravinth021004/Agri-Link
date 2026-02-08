import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// Subscription plans
export const SUBSCRIPTION_PLANS = [
  {
    id: 'farmer_monthly',
    name: 'Farmer Monthly',
    description: 'Access to all farmer features for 1 month',
    price: 199,
    duration: 30, // days
    features: [
      'Create unlimited product posts',
      'Access to analytics dashboard',
      'Priority customer support',
      'Direct messaging with customers',
    ],
  },
  {
    id: 'farmer_quarterly',
    name: 'Farmer Quarterly',
    description: 'Access to all farmer features for 3 months',
    price: 499,
    duration: 90,
    features: [
      'All monthly plan features',
      '16% discount',
      'Featured profile badge',
    ],
  },
  {
    id: 'farmer_yearly',
    name: 'Farmer Yearly',
    description: 'Access to all farmer features for 1 year',
    price: 1499,
    duration: 365,
    features: [
      'All quarterly plan features',
      '37% discount',
      'Priority listing in search',
      'Verified farmer badge',
    ],
  },
]

// GET subscription plans
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    let currentSubscription = null
    if (session?.user) {
      currentSubscription = await prisma.subscription.findFirst({
        where: {
          userId: session.user.id,
          status: 'ACTIVE',
          endDate: {
            gt: new Date(),
          },
        },
        orderBy: { endDate: 'desc' },
      })
    }

    return NextResponse.json({
      plans: SUBSCRIPTION_PLANS,
      currentSubscription,
    })
  } catch (error) {
    console.error('Get plans error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
