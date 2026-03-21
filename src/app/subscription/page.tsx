'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Crown, Check, Loader2, AlertCircle, Clock3, QrCode } from 'lucide-react'
import { formatPrice, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import QRCode from 'qrcode'
import { useGlobalToast } from '@/components/toast-provider'
import { useTranslations } from 'next-intl'

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
  startDate: string | null
  endDate: string | null
  status: string
  daysRemaining: number
}

export default function SubscriptionPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { showToast } = useGlobalToast()
  const t = useTranslations('subscription')
  const [plans, setPlans] = useState<Plan[]>([])
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Payment Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [upiRefId, setUpiRefId] = useState('')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [platformUpi, setPlatformUpi] = useState({ id: '', name: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [plansRes, statusRes, settingsRes] = await Promise.all([
        fetch('/api/subscriptions/plans'),
        fetch('/api/subscriptions/status'),
        fetch('/api/admin/settings'),
      ])
      
      const plansData = await plansRes.json()
      const statusData = await statusRes.json()
      const settingsData = await settingsRes.json()
      
      setPlans(plansData.plans || [])
      setCurrentSubscription(statusData.subscription || null)
      
      if (settingsData.settings) {
        setPlatformUpi({
          id: settingsData.settings.upiId,
          name: settingsData.settings.upiName
        })
      }
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

  useEffect(() => {
    const generateQR = async () => {
      if (selectedPlan && platformUpi.id) {
        const upiUrl = `upi://pay?pa=${encodeURIComponent(platformUpi.id)}&pn=${encodeURIComponent(platformUpi.name)}&am=${selectedPlan.price.toFixed(2)}&cu=INR`
        try {
          const url = await QRCode.toDataURL(upiUrl, { width: 250, margin: 2 })
          setQrCodeUrl(url)
        } catch (err) {
          console.error('Failed to generate QR code', err)
        }
      }
    }
    
    if (isModalOpen) {
      generateQR()
    } else {
      setUpiRefId('') // reset on close
      setQrCodeUrl('')
    }
  }, [selectedPlan, platformUpi, isModalOpen])

  const openPaymentModal = (plan: Plan) => {
    setSelectedPlan(plan)
    setIsModalOpen(true)
  }

  const handleSubscribe = async () => {
    if (!selectedPlan) return

    if (!/^\d{12}$/.test(upiRefId)) {
      showToast('Please enter a valid 12-digit UPI reference ID', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      const subscribeRes = await fetch('/api/subscriptions/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlan.id,
          upiRefId,
        }),
      })

      if (subscribeRes.ok) {
        setIsModalOpen(false)
        fetchData()
        showToast('Subscription request submitted for admin approval', 'success')
      } else {
        const error = await subscribeRes.json()
        showToast(error.error || t('subscriptionFailed'), 'error')
      }
    } catch (error) {
      console.error('Subscription failed:', error)
      showToast('Something went wrong. Please try again.', 'error')
    } finally {
      setIsSubmitting(false)
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('title')}</h1>
        <p className="text-gray-600 max-w-lg mx-auto">
          {t('subtitle')}
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
              <h2 className="font-bold text-green-800">{t('activeSubscription')}</h2>
              <p className="text-green-700 text-sm mt-1">
                {t('activeUntil', { date: formatDate(currentSubscription.endDate || new Date()) })}
              </p>
              <p className="text-green-600 font-medium mt-2">
                {t('daysRemaining', { count: currentSubscription.daysRemaining })}
              </p>
            </div>
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              {t('goToDashboard')}
            </Button>
          </div>
        </div>
      )}

      {currentSubscription && currentSubscription.status === 'PENDING' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <Clock3 className="w-6 h-6 text-yellow-700" />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-yellow-800">Pending Approval</h2>
              <p className="text-yellow-700 text-sm mt-1">
                Your payment reference was submitted. An admin will verify it and activate your farmer subscription.
              </p>
            </div>
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
                {t('mostPopular')}
              </div>
            )}
            
            <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-gray-900">{formatPrice(plan.price)}</span>
              <span className="text-gray-500">/ {plan.duration} {t('days')}</span>
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
              onClick={() => openPaymentModal(plan)}
              disabled={currentSubscription?.status === 'ACTIVE' || currentSubscription?.status === 'PENDING'}
            >
              {currentSubscription?.status === 'ACTIVE' && currentSubscription.planId === plan.id
                ? t('currentPlan')
                : currentSubscription?.status === 'ACTIVE'
                ? t('alreadySubscribed')
                : currentSubscription?.status === 'PENDING'
                ? 'Pending Approval'
                : t('subscribeNow')}
            </Button>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="mt-10 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-yellow-800">{t('developerMode')}</h3>
            <p className="text-yellow-700 text-sm mt-1">
              Pay using the platform UPI details, then submit your 12-digit transaction reference ID to request approval.
            </p>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title="Complete Payment"
        size="md"
      >
        {selectedPlan && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Selected Plan</p>
                <p className="font-semibold text-gray-900">{selectedPlan.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Amount</p>
                <p className="font-bold text-green-600">{formatPrice(selectedPlan.price)}</p>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-xl">
              {qrCodeUrl ? (
                <>
                  <img
                    src={qrCodeUrl}
                    alt="UPI Payment QR Code"
                    className="w-48 h-48 rounded-lg"
                  />
                  <p className="text-sm font-medium text-gray-600 mt-4 text-center">
                    Scan with any UPI App<br/>
                    <span className="text-xs text-gray-400 font-normal">({platformUpi.name})</span>
                  </p>
                </>
              ) : (
                <div className="w-48 h-48 flex items-center justify-center bg-gray-50 rounded-lg">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              )}
            </div>

            <div>
              <label htmlFor="upiRef" className="block text-sm font-medium text-gray-700 mb-1">
                UPI Reference ID (12-digits)
              </label>
              <Input
                id="upiRef"
                value={upiRefId}
                onChange={(e) => setUpiRefId(e.target.value.replace(/\D/g, '').slice(0, 12))}
                placeholder="Enter 12-digit transaction ID"
                maxLength={12}
                disabled={isSubmitting}
                className="font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">
                You can find this in your UPI app's transaction history after successful payment.
              </p>
            </div>

            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              onClick={handleSubscribe}
              disabled={upiRefId.length !== 12 || isSubmitting}
              isLoading={isSubmitting}
            >
              Confirm and Request Approval
            </Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
