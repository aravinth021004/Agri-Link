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

    const { planId, paymentId } = result.data

    // Find plan
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId)
    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      )
    }

    // Check for existing active subscription
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: 'ACTIVE',
        endDate: {
          gt: new Date(),
        },
      },
    })

    // Calculate dates
    const startDate = existingSubscription 
      ? new Date(existingSubscription.endDate) 
      : new Date()
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + plan.duration)

    // Create subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId: session.user.id,
        planId,
        startDate,
        endDate,
        amount: plan.price,
        paymentId,
        status: 'ACTIVE',
      },
    })

    // Upgrade user to FARMER role if not already
    await prisma.user.update({
      where: { id: session.user.id },
      data: { role: 'FARMER' },
    })

    // Log subscription (development mode)
    console.log('='.repeat(50))
    console.log(`🌾 New Subscription:`)
    console.log(`  User: ${session.user.fullName}`)
    console.log(`  Plan: ${plan.name}`)
    console.log(`  Expires: ${endDate.toLocaleDateString()}`)
    console.log('='.repeat(50))

    return NextResponse.json({
      message: 'Subscription activated',
      subscription,
      user: {
        role: 'FARMER',
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Subscribe error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
