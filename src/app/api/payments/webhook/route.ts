import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import crypto from 'crypto'

// POST - Razorpay webhook handler for payment events
// Razorpay sends POST requests with event data
export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('RAZORPAY_WEBHOOK_SECRET not configured')
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
    }

    const body = await request.text()
    const signature = request.headers.get('x-razorpay-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex')

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(body)
    const eventType = event.event as string

    switch (eventType) {
      case 'payment.captured': {
        const payment = event.payload?.payment?.entity
        if (payment) {
          // Update order with razorpay payment ID
          const orderId = payment.notes?.order_id
          if (orderId) {
            await prisma.order.updateMany({
              where: { id: orderId, paymentId: payment.order_id },
              data: { razorpayOrderId: payment.id },
            })
          }
        }
        break
      }

      case 'payment.failed': {
        const payment = event.payload?.payment?.entity
        if (payment) {
          console.error(`Payment failed: ${payment.id}, reason: ${payment.error_description}`)
        }
        break
      }

      case 'refund.created': {
        const refund = event.payload?.refund?.entity
        if (refund) {
          console.log(`Refund created: ${refund.id} for payment ${refund.payment_id}, amount: ${refund.amount / 100}`)
        }
        break
      }

      default:
        console.log(`Unhandled webhook event: ${eventType}`)
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    // Return 200 even on error to prevent Razorpay retries flooding
    return NextResponse.json({ received: true })
  }
}
