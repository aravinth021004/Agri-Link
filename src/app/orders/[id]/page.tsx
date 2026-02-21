'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Package, MapPin, Phone, Star, Loader2, CheckCircle, Clock, Truck, XCircle, User, CreditCard, Banknote, QrCode } from 'lucide-react'
import { formatPrice, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useGlobalToast } from '@/components/toast-provider'
import { TranslateButton } from '@/components/translate-button'
import { useTranslations } from 'next-intl'

interface OrderDetail {
  id: string
  orderNumber: string
  status: string
  subtotal: number
  deliveryFee: number
  totalAmount: number
  deliveryOption: string
  paymentMethod: string
  paymentStatus: string
  upiRefId: string | null
  deliveryAddress: {
    street: string
    city: string
    state: string
    pincode: string
    landmark?: string
  } | null
  notes: string | null
  createdAt: string
  updatedAt: string
  customerId: string
  farmerId: string
  farmer: {
    id: string
    fullName: string
    phone: string
    profileImage: string | null
    location?: string | null
  }
  customer: {
    id: string
    fullName: string
    phone: string
    profileImage: string | null
    email?: string | null
  }
  items: Array<{
    id: string
    quantity: number
    unitPrice: number
    subtotal: number
    product: {
      id: string
      title: string
      unit: string
      mediaUrls: string[]
    }
  }>
}

const statusSteps = ['PENDING', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED']

const statusActions: Record<string, { next: string; label: string }> = {
  PENDING: { next: 'CONFIRMED', label: 'confirmOrder' },
  CONFIRMED: { next: 'PACKED', label: 'markPacked' },
  PACKED: { next: 'OUT_FOR_DELIVERY', label: 'outForDeliveryAction' },
  OUT_FOR_DELIVERY: { next: 'DELIVERED', label: 'markDelivered' },
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status: authStatus } = useSession()
  const { showToast } = useGlobalToast()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showRating, setShowRating] = useState(false)
  const [rating, setRating] = useState(5)
  const [review, setReview] = useState('')
  const [isSubmittingRating, setIsSubmittingRating] = useState(false)
  const [translatedItems, setTranslatedItems] = useState<Record<string, string>>({})

  // Dialog states
  const [cancelConfirm, setCancelConfirm] = useState(false)
  const [statusConfirm, setStatusConfirm] = useState<{ isOpen: boolean; newStatus: string; label: string }>({
    isOpen: false, newStatus: '', label: '',
  })
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false)
  const t = useTranslations('orders')

  useEffect(() => {
    if (authStatus === 'authenticated') {
      fetchOrder()
    } else if (authStatus === 'unauthenticated') {
      router.push('/login')
    }
  }, [authStatus, params.id])

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${params.id}`)
      const data = await response.json()
      setOrder(data)
    } catch (error) {
      console.error('Failed to fetch order:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateOrderStatus = async (newStatus: string) => {
    if (!order) return
    setIsActionLoading(true)
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        showToast(newStatus === 'CANCELLED' ? t('orderCancelledSuccess') : t('orderUpdatedSuccess'), 'success')
        fetchOrder()
      } else {
        const data = await res.json()
        showToast(data.error || 'Failed to update order', 'error')
      }
    } catch (error) {
      console.error('Failed to update order:', error)
      showToast('Failed to update order', 'error')
    } finally {
      setIsActionLoading(false)
      setCancelConfirm(false)
      setStatusConfirm({ isOpen: false, newStatus: '', label: '' })
    }
  }

  const submitRating = async () => {
    if (!order) return
    setIsSubmittingRating(true)
    try {
      await fetch('/api/interactions/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          farmerId: order.farmer.id,
          rating,
          review,
        }),
      })
      setShowRating(false)
      showToast(t('thanks'), 'success')
    } catch (error) {
      console.error('Failed to submit rating:', error)
    } finally {
      setIsSubmittingRating(false)
    }
  }

  const confirmPayment = async () => {
    if (!order) return
    setIsConfirmingPayment(true)
    try {
      const res = await fetch(`/api/orders/${order.id}/confirm-payment`, {
        method: 'POST',
      })
      if (res.ok) {
        showToast(t('paymentConfirmedSuccess'), 'success')
        fetchOrder()
      } else {
        const data = await res.json()
        showToast(data.error || 'Failed to confirm payment', 'error')
      }
    } catch (error) {
      console.error('Failed to confirm payment:', error)
      showToast('Failed to confirm payment', 'error')
    } finally {
      setIsConfirmingPayment(false)
    }
  }

  if (authStatus === 'loading' || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900">{t('orderNotFound')}</h1>
        <Link href="/orders" className="text-green-600 hover:underline mt-4 inline-block">
          {t('backToOrders')}
        </Link>
      </div>
    )
  }

  const currentStepIndex = statusSteps.indexOf(order.status)
  const isCancelled = order.status === 'CANCELLED' || order.status === 'DISPUTED'
  const isFarmer = session?.user?.id === order.farmerId
  const isCustomer = session?.user?.id === order.customerId
  const farmerAction = isFarmer ? statusActions[order.status] : null
  const canFarmerCancel = isFarmer && ['PENDING', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY'].includes(order.status)
  const canCustomerCancel = isCustomer && order.status === 'PENDING'

  // Determine which person's info to display (show the other party)
  const contactPerson = isFarmer ? {
    label: t('customer'),
    id: order.customer.id,
    name: order.customer.fullName,
    phone: order.customer.phone,
    image: order.customer.profileImage,
    link: null, // no public profile for customers
  } : {
    label: t('seller'),
    id: order.farmer.id,
    name: order.farmer.fullName,
    phone: order.farmer.phone,
    image: order.farmer.profileImage,
    link: `/farmers/${order.farmer.id}`,
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Cancel Confirmation */}
      <ConfirmDialog
        isOpen={cancelConfirm}
        onClose={() => setCancelConfirm(false)}
        onConfirm={() => updateOrderStatus('CANCELLED')}
        title={t('cancelOrder')}
        message={`${t('cancelOrder')} #${order.orderNumber}?${isFarmer ? ' ' + t('stockRestoredNote') : ' ' + t('thisCannotBeUndone')}`}
        confirmLabel={t('cancelOrder')}
        variant="danger"
        isLoading={isActionLoading}
      />

      {/* Status Update Confirmation */}
      <ConfirmDialog
        isOpen={statusConfirm.isOpen}
        onClose={() => setStatusConfirm({ isOpen: false, newStatus: '', label: '' })}
        onConfirm={() => updateOrderStatus(statusConfirm.newStatus)}
        title={t('updateOrderStatus')}
        message={`${t('orderNumber')} #${order.orderNumber} → ${statusConfirm.label ? t(statusConfirm.label) : ''}`}
        confirmLabel={statusConfirm.label ? t(statusConfirm.label) : ''}
        isLoading={isActionLoading}
      />

      <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-5 h-5" />
        Back
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{t('orderNumber')} #{order.orderNumber}</h1>
              <p className="text-sm text-gray-500 mt-1">{t('placedOn')} {formatDate(order.createdAt)}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
              isCancelled ? 'bg-red-100 text-red-700' :
              order.status === 'OUT_FOR_DELIVERY' ? 'bg-indigo-100 text-indigo-700' :
              order.status === 'PACKED' ? 'bg-purple-100 text-purple-700' :
              order.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {order.status.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {/* Status Timeline */}
        {!isCancelled && (
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
            <div className="flex justify-between relative">
              <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200" />
              <div 
                className="absolute top-4 left-0 h-0.5 bg-green-500 transition-all"
                style={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}
              />
              {statusSteps.map((step, idx) => {
                const isCompleted = idx <= currentStepIndex
                const isCurrent = idx === currentStepIndex
                return (
                  <div key={step} className="flex flex-col items-center relative z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
                    }`}>
                      {isCompleted ? <CheckCircle className="w-5 h-5" /> : 
                       step === 'OUT_FOR_DELIVERY' ? <Truck className="w-4 h-4" /> :
                       <Clock className="w-4 h-4" />}
                    </div>
                    <span className={`text-xs mt-2 hidden sm:block ${isCurrent ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                      {step.replace(/_/g, ' ')}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Farmer Actions */}
        {isFarmer && (farmerAction || canFarmerCancel) && (
          <div className="px-6 py-4 bg-green-50 border-b border-gray-100 flex gap-3 flex-wrap">
            {farmerAction && (
              <Button
                onClick={() => setStatusConfirm({ isOpen: true, newStatus: farmerAction.next, label: farmerAction.label })}
              >
                {order.status === 'PENDING' && <CheckCircle className="w-4 h-4 mr-1" />}
                {order.status === 'CONFIRMED' && <Package className="w-4 h-4 mr-1" />}
                {order.status === 'PACKED' && <Truck className="w-4 h-4 mr-1" />}
                {order.status === 'OUT_FOR_DELIVERY' && <CheckCircle className="w-4 h-4 mr-1" />}
                {t(farmerAction.label)}
              </Button>
            )}
            {canFarmerCancel && (
              <Button variant="destructive" onClick={() => setCancelConfirm(true)}>
                <XCircle className="w-4 h-4 mr-1" />
                {t('cancelOrder')}
              </Button>
            )}
          </div>
        )}

        {/* Customer Cancel Action */}
        {canCustomerCancel && (
          <div className="px-6 py-4 bg-red-50 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">{t('cancelPendingNote')}</p>
              <Button variant="destructive" size="sm" onClick={() => setCancelConfirm(true)}>
                <XCircle className="w-4 h-4 mr-1" />
                {t('cancelOrder')}
              </Button>
            </div>
          </div>
        )}

        {/* Contact Person Info (shows the other party) */}
        <div className="p-6 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-3">{contactPerson.label}</h2>
          {contactPerson.link ? (
            <Link href={contactPerson.link} className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-full overflow-hidden bg-green-100">
                {contactPerson.image ? (
                  <Image src={contactPerson.image} alt="" fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-green-600 font-bold">
                    {contactPerson.name.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">{contactPerson.name}</p>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {contactPerson.phone}
                </p>
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-full overflow-hidden bg-blue-100">
                {contactPerson.image ? (
                  <Image src={contactPerson.image} alt="" fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-blue-600 font-bold">
                    {contactPerson.name.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">{contactPerson.name}</p>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {contactPerson.phone}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Payment Info */}
        <div className="p-6 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            {order.paymentMethod === 'UPI' ? <QrCode className="w-5 h-5 text-purple-600" /> : <Banknote className="w-5 h-5 text-green-600" />}
            {t('paymentInfo')}
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">{t('paymentMethodLabel')}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                order.paymentMethod === 'UPI' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
              }`}>
                {order.paymentMethod === 'UPI' ? t('upi') : t('cod')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('paymentStatusLabel')}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                order.paymentStatus === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                order.paymentStatus === 'PAID' ? 'bg-blue-100 text-blue-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {order.paymentStatus === 'CONFIRMED' ? t('paymentConfirmed') : 
                 order.paymentStatus === 'PAID' ? t('paymentPaid') : t('paymentPending')}
              </span>
            </div>
            {order.upiRefId && (
              <div className="flex justify-between">
                <span className="text-gray-600">{t('upiRefId')}</span>
                <span className="font-mono text-gray-800">{order.upiRefId}</span>
              </div>
            )}
          </div>
          
          {/* Farmer: Confirm Payment Button */}
          {isFarmer && order.paymentMethod === 'UPI' && order.paymentStatus === 'PENDING' && (
            <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-700 mb-2">{t('confirmPaymentNote')}</p>
              <Button
                size="sm"
                onClick={confirmPayment}
                isLoading={isConfirmingPayment}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                {t('confirmPayment')}
              </Button>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="p-6 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-3">{t('items')}</h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  <Image
                    src={item.product.mediaUrls?.[0] || '/placeholder.jpg'}
                    alt=""
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{translatedItems[item.id] ?? item.product.title}</p>
                  <p className="text-sm text-gray-500">
                    {formatPrice(item.unitPrice)} × {item.quantity} {item.product.unit}
                  </p>
                </div>
                <span className="font-medium text-gray-900">{formatPrice(item.subtotal)}</span>
              </div>
            ))}
          </div>
          <TranslateButton
            texts={order.items.map(item => item.product.title)}
            onTranslated={(translations) => {
              const map: Record<string, string> = {}
              order.items.forEach((item, i) => { map[item.id] = translations[i] })
              setTranslatedItems(map)
            }}
            onShowOriginal={() => setTranslatedItems({})}
          />
        </div>

        {/* Delivery Address */}
        {order.deliveryAddress && (
          <div className="p-6 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-600" />
              {t('deliveryAddress')}
            </h2>
            <p className="text-gray-600">
              {order.deliveryAddress.street}<br />
              {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}
              {order.deliveryAddress.landmark && <><br />Near: {order.deliveryAddress.landmark}</>}
            </p>
          </div>
        )}

        {/* Notes */}
        {order.notes && (
          <div className="p-6 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 mb-2">{t('notes')}</h2>
            <p className="text-sm text-gray-600">{order.notes}</p>
          </div>
        )}

        {/* Summary */}
        <div className="p-6">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">{t('subtotal')}</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('delivery')} ({order.deliveryOption.replace(/_/g, ' ')})</span>
              <span>{formatPrice(order.deliveryFee)}</span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between text-lg font-bold">
              <span>{t('total')}</span>
              <span className="text-green-600">{formatPrice(order.totalAmount)}</span>
            </div>
          </div>

          {/* Rate Order Button (customer only, delivered orders) */}
          {isCustomer && order.status === 'DELIVERED' && !showRating && (
            <Button onClick={() => setShowRating(true)} className="w-full mt-6" variant="outline">
              <Star className="w-4 h-4 mr-2" />
              {t('rateThisOrder')}
            </Button>
          )}

          {/* Rating Form */}
          {showRating && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">{t('rateExperience')}</h3>
              <div className="flex gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`w-10 h-10 rounded-full ${
                      star <= rating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  >
                    <Star className="w-8 h-8 fill-current" />
                  </button>
                ))}
              </div>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder={t('shareExperience')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                rows={3}
              />
              <div className="flex gap-2 mt-3">
                <Button onClick={submitRating} isLoading={isSubmittingRating}>Submit</Button>
                <Button onClick={() => setShowRating(false)} variant="outline">Cancel</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
