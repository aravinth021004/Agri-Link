'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Package, MapPin, Phone, Star, Loader2, CheckCircle, Clock, Truck, XCircle } from 'lucide-react'
import { formatPrice, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useGlobalToast } from '@/components/toast-provider'

interface OrderDetail {
  id: string
  orderNumber: string
  status: string
  subtotal: number
  deliveryFee: number
  totalAmount: number
  deliveryOption: string
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
  farmer: {
    id: string
    fullName: string
    phone: string
    profileImage: string | null
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
      showToast('Thanks for your feedback!', 'success')
    } catch (error) {
      console.error('Failed to submit rating:', error)
    } finally {
      setIsSubmittingRating(false)
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
        <h1 className="text-2xl font-bold text-gray-900">Order not found</h1>
        <Link href="/orders" className="text-green-600 hover:underline mt-4 inline-block">
          Back to Orders
        </Link>
      </div>
    )
  }

  const currentStepIndex = statusSteps.indexOf(order.status)
  const isCancelled = order.status === 'CANCELLED' || order.status === 'DISPUTED'

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-5 h-5" />
        Back
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
              <p className="text-sm text-gray-500 mt-1">Placed on {formatDate(order.createdAt)}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
              isCancelled ? 'bg-red-100 text-red-700' :
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
                    <span className={`text-xs mt-2 ${isCurrent ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                      {step.replace(/_/g, ' ')}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Farmer Info */}
        <div className="p-6 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-3">Seller</h2>
          <Link href={`/farmers/${order.farmer.id}`} className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-green-100">
              {order.farmer.profileImage ? (
                <Image src={order.farmer.profileImage} alt="" fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-green-600 font-bold">
                  {order.farmer.fullName.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900">{order.farmer.fullName}</p>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {order.farmer.phone}
              </p>
            </div>
          </Link>
        </div>

        {/* Items */}
        <div className="p-6 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-3">Items</h2>
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
                  <p className="font-medium text-gray-900 truncate">{item.product.title}</p>
                  <p className="text-sm text-gray-500">
                    {formatPrice(item.unitPrice)} × {item.quantity} {item.product.unit}
                  </p>
                </div>
                <span className="font-medium text-gray-900">{formatPrice(item.subtotal)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Address */}
        {order.deliveryAddress && (
          <div className="p-6 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-600" />
              Delivery Address
            </h2>
            <p className="text-gray-600">
              {order.deliveryAddress.street}<br />
              {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}
              {order.deliveryAddress.landmark && <><br />Near: {order.deliveryAddress.landmark}</>}
            </p>
          </div>
        )}

        {/* Summary */}
        <div className="p-6">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Delivery ({order.deliveryOption.replace(/_/g, ' ')})</span>
              <span>{formatPrice(order.deliveryFee)}</span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-green-600">{formatPrice(order.totalAmount)}</span>
            </div>
          </div>

          {/* Rate Order Button */}
          {order.status === 'DELIVERED' && !showRating && (
            <Button onClick={() => setShowRating(true)} className="w-full mt-6" variant="outline">
              <Star className="w-4 h-4 mr-2" />
              Rate this Order
            </Button>
          )}

          {/* Rating Form */}
          {showRating && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">Rate your experience</h3>
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
                placeholder="Share your experience (optional)"
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
