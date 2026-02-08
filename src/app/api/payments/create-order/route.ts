import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { v4 as uuidv4 } from 'uuid'

// Mock Razorpay - Create order
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
    const { amount, type } = body // type: 'order' or 'subscription'

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    // Generate mock Razorpay order ID
    const orderId = `order_${uuidv4().replace(/-/g, '').substring(0, 14)}`
    
    // In production, this would call Razorpay API
    console.log('='.repeat(50))
    console.log('💳 Mock Payment Order Created:')
    console.log(`  Order ID: ${orderId}`)
    console.log(`  Amount: ₹${amount}`)
    console.log(`  Type: ${type}`)
    console.log('='.repeat(50))

    return NextResponse.json({
      orderId,
      amount,
      currency: 'INR',
      key: process.env.RAZORPAY_KEY_ID,
      // Mock - in production these would come from Razorpay
      prefill: {
        name: session.user.fullName,
        email: session.user.email,
        contact: session.user.phone,
      },
    })
  } catch (error) {
    console.error('Create payment order error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
