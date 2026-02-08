import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { v4 as uuidv4 } from 'uuid'

// Mock Razorpay - Verify payment
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
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body

    // In production, this would verify the signature using Razorpay secret
    // For development, we mock the verification
    const isValid = true // Mock always succeeds

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      )
    }

    // Generate mock payment ID if not provided
    const paymentId = razorpay_payment_id || `pay_${uuidv4().replace(/-/g, '').substring(0, 14)}`

    console.log('='.repeat(50))
    console.log('✅ Mock Payment Verified:')
    console.log(`  Order ID: ${razorpay_order_id}`)
    console.log(`  Payment ID: ${paymentId}`)
    console.log('='.repeat(50))

    return NextResponse.json({
      verified: true,
      paymentId,
      orderId: razorpay_order_id,
    })
  } catch (error) {
    console.error('Verify payment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
