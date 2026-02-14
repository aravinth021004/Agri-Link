'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Crown, Check, Loader2, Calendar, AlertCircle } from 'lucide-react'
import { formatPrice, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useGlobalToast } from '@/components/toast-provider'

interface Plan {
  id: string
  name: string
  price: number
  duration: number
  features: string[]
  popular: boolean
}

interface Subscription {
  id: string
  planId: string
  startDate: string
  endDate: string
  status: string
  daysRemaining: number
}

export default function SubscriptionPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { showToast } = useGlobalToast()
  const [plans, setPlans] = useState<Plan[]>([])
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [subscribingPlan, setSubscribingPlan] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [plansRes, statusRes] = await Promise.all([
        fetch('/api/subscriptions/plans'),
        fetch('/api/subscriptions/status'),
      ])
      
      const plansData = await plansRes.json()
      const statusData = await statusRes.json()
      
      setPlans(plansData.plans || [])
      setCurrentSubscription(statusData.subscription || null)
    } catch (error) {
      console.error('Failed to fetch subscription data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData()
    } else if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router, fetchData])

  const handleSubscribe = async (planId: string) => {
    setSubscribingPlan(planId)
    try {
      // Create mock payment
      const plan = plans.find(p => p.id === planId)
      if (!plan) return

      const paymentRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: plan.price,
          type: 'subscription',
        }),
      })
      const paymentData = await paymentRes.json()

      // Verify mock payment
      await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: paymentData.orderId,
          razorpay_payment_id: `pay_mock_${Date.now()}`,
          razorpay_signature: 'mock_signature',
        }),
      })

      // Subscribe
      const subscribeRes = await fetch('/api/subscriptions/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          paymentId: paymentData.orderId,
        }),
      })

      if (subscribeRes.ok) {
        fetchData()
        showToast('Subscription activated! You can now sell products.', 'success')
      } else {
        const error = await subscribeRes.json()
        showToast(error.error || 'Subscription failed', 'error')
      }
    } catch (error) {
      console.error('Subscription failed:', error)
    } finally {
      setSubscribingPlan(null)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-10">
        <Crown className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Farmer Subscription</h1>
        <p className="text-gray-600 max-w-lg mx-auto">
          Subscribe to become a verified farmer and start selling your products on AgriLink
        </p>
      </div>

      {/* Current Subscription Status */}
      {currentSubscription && currentSubscription.status === 'ACTIVE' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-green-800">Active Subscription</h2>
              <p className="text-green-700 text-sm mt-1">
                Your subscription is active until {formatDate(currentSubscription.endDate)}
              </p>
              <p className="text-green-600 font-medium mt-2">
                {currentSubscription.daysRemaining} days remaining
              </p>
            </div>
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              Go to Dashboard
            </Button>
          </div>
        </div>
      )}

      {/* Plans */}
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white rounded-xl shadow-sm border-2 p-6 relative ${
              plan.popular ? 'border-green-500' : 'border-gray-100'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                Most Popular
              </div>
            )}
            
            <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-gray-900">{formatPrice(plan.price)}</span>
              <span className="text-gray-500">/ {plan.duration} days</span>
            </div>

            <ul className="mt-6 space-y-3">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              className="w-full mt-6"
              variant={plan.popular ? 'default' : 'outline'}
              onClick={() => handleSubscribe(plan.id)}
              isLoading={subscribingPlan === plan.id}
              disabled={currentSubscription?.status === 'ACTIVE'}
            >
              {currentSubscription?.status === 'ACTIVE' && currentSubscription.planId === plan.id
                ? 'Current Plan'
                : currentSubscription?.status === 'ACTIVE'
                ? 'Already Subscribed'
                : 'Subscribe Now'}
            </Button>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="mt-10 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-yellow-800">Development Mode</h3>
            <p className="text-yellow-700 text-sm mt-1">
              Payments are mocked in development. In production, you&apos;ll be redirected to Razorpay for secure payment processing.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
