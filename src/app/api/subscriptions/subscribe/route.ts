import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { subscribeSchema } from '@/lib/validations'
import { SUBSCRIPTION_PLANS } from '../plans/route'

// POST subscribe to a plan
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
    
    const result = subscribeSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { planId, upiRefId } = result.data

    // Find plan
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId)
    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      )
    }

    // Check for existing active or pending subscription
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        OR: [
          {
            status: 'ACTIVE',
            endDate: {
              gt: new Date(),
            },
          },
          {
            status: 'PENDING',
          },
        ],
      },
    })

    if (existingSubscription) {
      return NextResponse.json(
        { error: 'You already have an active or pending subscription' },
        { status: 409 }
      )
    }

    const paymentId = `upi_ref_${upiRefId}`

    // Create a pending subscription for admin verification.
    const subscription = await prisma.subscription.create({
      data: {
        userId: session.user.id,
        planId,
        amount: plan.price,
        paymentId,
        upiRefId,
        status: 'PENDING',
      },
    })

    // Log subscription (development mode)
    console.log('='.repeat(50))
    console.log(`🌾 New Subscription:`)
    console.log(`  User: ${session.user.fullName}`)
    console.log(`  Plan: ${plan.name}`)
    console.log(`  Status: PENDING_APPROVAL`)
    console.log(`  UPI Ref: ${upiRefId}`)
    console.log('='.repeat(50))

    return NextResponse.json({
      message: 'Subscription request submitted. Awaiting admin approval.',
      subscription,
    }, { status: 201 })
  } catch (error) {
    console.error('Subscribe error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
