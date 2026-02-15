import { Resend } from 'resend'

type EmailPayload = {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: EmailPayload): Promise<boolean> {
  const mode = process.env.EMAIL_MODE || 'console'

  if (mode === 'console') {
    console.log('='.repeat(50))
    console.log(`📧 Email (console mode)`)
    console.log(`  To: ${to}`)
    console.log(`  Subject: ${subject}`)
    console.log(`  Body: ${html.replace(/<[^>]*>/g, '').substring(0, 200)}...`)
    console.log('='.repeat(50))
    return true
  }

  try {
    const apiKey = process.env.EMAIL_API_KEY
    const fromEmail = process.env.EMAIL_FROM || 'AgriLink <noreply@agrilink.com>'

    if (!apiKey) {
      console.warn('EMAIL_API_KEY not set, falling back to console mode')
      console.log(`📧 Email → ${to}: ${subject}`)
      return true
    }

    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
    })

    if (error) {
      console.error('Email send failed:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Email error:', error)
    return false
  }
}

// Pre-built email templates
export function orderConfirmationEmail(orderNumber: string, items: string[], total: string) {
  return {
    subject: `AgriLink - Order #${orderNumber} Confirmed`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #16a34a; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">🌾 AgriLink</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Order Confirmed! 🎉</h2>
          <p>Your order <strong>#${orderNumber}</strong> has been placed successfully.</p>
          <h3>Items:</h3>
          <ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>
          <p><strong>Total: ${total}</strong></p>
          <p>The farmer will confirm your order shortly.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/orders" 
             style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
            Track Your Order
          </a>
        </div>
        <div style="background: #f3f4f6; padding: 15px; text-align: center; color: #6b7280; font-size: 12px;">
          <p>Fresh from the farm, direct to you.</p>
        </div>
      </div>
    `,
  }
}

export function orderStatusEmail(orderNumber: string, status: string, orderId: string) {
  const statusLabels: Record<string, string> = {
    CONFIRMED: 'Confirmed by Farmer',
    PACKED: 'Packed & Ready',
    OUT_FOR_DELIVERY: 'Out for Delivery',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
  }

  return {
    subject: `AgriLink - Order #${orderNumber} ${statusLabels[status] || status}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #16a34a; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">🌾 AgriLink</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Order Update</h2>
          <p>Your order <strong>#${orderNumber}</strong> is now: <strong>${statusLabels[status] || status}</strong></p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderId}" 
             style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
            View Order Details
          </a>
        </div>
        <div style="background: #f3f4f6; padding: 15px; text-align: center; color: #6b7280; font-size: 12px;">
          <p>Fresh from the farm, direct to you.</p>
        </div>
      </div>
    `,
  }
}

export function subscriptionExpiryEmail(daysLeft: number) {
  return {
    subject: `AgriLink - Your subscription expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #16a34a; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">🌾 AgriLink</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Subscription Expiring Soon ⚠️</h2>
          <p>Your farmer subscription will expire in <strong>${daysLeft} day${daysLeft !== 1 ? 's' : ''}</strong>.</p>
          <p>Renew now to keep selling your products and maintain access to your dashboard.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/subscription" 
             style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
            Renew Subscription
          </a>
        </div>
        <div style="background: #f3f4f6; padding: 15px; text-align: center; color: #6b7280; font-size: 12px;">
          <p>Fresh from the farm, direct to you.</p>
        </div>
      </div>
    `,
  }
}

export function welcomeEmail(name: string) {
  return {
    subject: 'Welcome to AgriLink! 🌾',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #16a34a; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">🌾 AgriLink</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Welcome, ${name}! 👋</h2>
          <p>Thank you for joining AgriLink — the marketplace that connects you directly with local farmers.</p>
          <p>Here's what you can do:</p>
          <ul>
            <li>🛒 Browse fresh produce from local farmers</li>
            <li>💬 Connect with farmers directly</li>
            <li>📦 Track your orders in real-time</li>
            <li>🌾 Become a farmer seller with a subscription</li>
          </ul>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/feed" 
             style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
            Start Browsing
          </a>
        </div>
        <div style="background: #f3f4f6; padding: 15px; text-align: center; color: #6b7280; font-size: 12px;">
          <p>Fresh from the farm, direct to you.</p>
        </div>
      </div>
    `,
  }
}

export function otpEmail(code: string) {
  return {
    subject: `AgriLink - Your verification code: ${code}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #16a34a; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">🌾 AgriLink</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Password Reset Code</h2>
          <p>Use the following code to reset your password:</p>
          <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #16a34a;">${code}</span>
          </div>
          <p>This code expires in <strong>10 minutes</strong>. If you did not request this, please ignore this email.</p>
        </div>
        <div style="background: #f3f4f6; padding: 15px; text-align: center; color: #6b7280; font-size: 12px;">
          <p>Fresh from the farm, direct to you.</p>
        </div>
      </div>
    `,
  }
}
