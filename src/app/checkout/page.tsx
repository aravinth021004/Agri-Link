'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, CheckCircle, MapPin, CreditCard, Banknote, QrCode } from 'lucide-react'
import { useGlobalToast } from '@/components/toast-provider'
import { useTranslations } from 'next-intl'
import QRCode from 'qrcode'

interface CartGroup {
  farmer: {
    id: string
    fullName: string
    upiId: string | null
  }
  items: Array<{
    id: string
    quantity: number
    deliveryOption: string
    product: {
      title: string
      price: number
      unit: string
    }
  }>
  subtotal: number
  deliveryFee: number
  total: number
}

export default function CheckoutPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { showToast } = useGlobalToast()
  const t = useTranslations('checkout')
  const tCart = useTranslations('cart')
  const [cartGroups, setCartGroups] = useState<CartGroup[]>([])
  const [grandTotal, setGrandTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderIds, setOrderIds] = useState<string[]>([])
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'COD'>('COD')
  const [upiRefId, setUpiRefId] = useState('')
  const [qrDataUrls, setQrDataUrls] = useState<Record<string, string>>({})
  
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
  })

  const fetchCart = useCallback(async () => {
    try {
      const response = await fetch('/api/cart')
      const data = await response.json()
      setCartGroups(data.farmerCarts || [])
      setGrandTotal(data.summary?.grandTotal || 0)
    } catch (error) {
      console.error('Failed to fetch cart:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchCart()
    } else if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router, fetchCart])

  // Generate QR codes when UPI is selected
  useEffect(() => {
    if (paymentMethod !== 'UPI') return
    
    const generateQrCodes = async () => {
      const urls: Record<string, string> = {}
      for (const group of cartGroups) {
        if (group.farmer.upiId) {
          const upiUrl = `upi://pay?pa=${encodeURIComponent(group.farmer.upiId)}&pn=${encodeURIComponent(group.farmer.fullName)}&am=${group.total.toFixed(2)}&cu=INR`
          try {
            urls[group.farmer.id] = await QRCode.toDataURL(upiUrl, { width: 200, margin: 2 })
          } catch {
            // skip
          }
        }
      }
      setQrDataUrls(urls)
    }
    
    generateQrCodes()
  }, [paymentMethod, cartGroups])

  const allFarmersHaveUpi = cartGroups.every(g => g.farmer.upiId)

  const handlePlaceOrder = async () => {
    const hasHomeDelivery = cartGroups.some(g => 
      g.items.some(i => i.deliveryOption === 'HOME_DELIVERY')
    )
    
    if (hasHomeDelivery && (!address.street || !address.city || !address.state || !address.pincode)) {
      showToast(t('fillAddress'), 'warning')
      return
    }

    if (paymentMethod === 'UPI') {
      if (!upiRefId || !/^\d{12}$/.test(upiRefId)) {
        showToast(t('enterValidUpiRef'), 'warning')
        return
      }
    }

    setIsProcessing(true)
    
    try {
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(hasHomeDelivery ? { deliveryAddress: address } : {}),
          paymentMethod,
          ...(paymentMethod === 'UPI' ? { upiRefId } : {}),
        }),
      })

      const orderData = await orderResponse.json()

      if (orderResponse.ok) {
        setOrderIds(orderData.orders.map((o: { id: string }) => o.id))
        setOrderPlaced(true)
      } else {
        showToast(orderData.error || 'Failed to place order', 'error')
      }
    } catch (error) {
      console.error('Checkout failed:', error)
      showToast('Checkout failed. Please try again.', 'error')
    } finally {
      setIsProcessing(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    )
  }

  if (orderPlaced) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('orderPlaced')}</h1>
        <p className="text-gray-600 mb-2">
          {orderIds.length > 1 
            ? t('ordersCreated', { count: orderIds.length })
            : t('orderSentToFarmer')}
        </p>
        {paymentMethod === 'UPI' && (
          <p className="text-sm text-amber-600 mb-4">{t('upiPaymentPending')}</p>
        )}
        {paymentMethod === 'COD' && (
          <p className="text-sm text-gray-500 mb-4">{t('codNote')}</p>
        )}
        <div className="space-y-3">
          <Button onClick={() => router.push('/orders')} className="w-full">
            {t('viewMyOrders')}
          </Button>
          <Button onClick={() => router.push('/feed')} variant="outline" className="w-full">
            {t('continueShopping')}
          </Button>
        </div>
      </div>
    )
  }

  if (cartGroups.length === 0) {
    router.push('/cart')
    return null
  }

  const hasHomeDelivery = cartGroups.some(g => 
    g.items.some(i => i.deliveryOption === 'HOME_DELIVERY')
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('title')}</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Delivery Address */}
          {hasHomeDelivery && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-green-600" />
                {t('deliveryAddress')}
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Input
                    label={t('street')}
                    placeholder={t('streetPlaceholder')}
                    value={address.street}
                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                  />
                </div>
                <Input
                  label={t('city')}
                  placeholder={t('city')}
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                />
                <Input
                  label={t('state')}
                  placeholder={t('state')}
                  value={address.state}
                  onChange={(e) => setAddress({ ...address, state: e.target.value })}
                />
                <Input
                  label={t('pincode')}
                  placeholder={t('pincodePlaceholder')}
                  value={address.pincode}
                  onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                  maxLength={6}
                />
                <Input
                  label={t('landmark')}
                  placeholder={t('landmarkPlaceholder')}
                  value={address.landmark}
                  onChange={(e) => setAddress({ ...address, landmark: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Payment Method */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-green-600" />
              {t('paymentMethod')}
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentMethod('COD')}
                className={`p-4 rounded-lg border-2 text-left transition ${
                  paymentMethod === 'COD'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Banknote className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">{t('cod')}</p>
                    <p className="text-xs text-gray-500">{t('codDesc')}</p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => allFarmersHaveUpi ? setPaymentMethod('UPI') : showToast(t('farmerNoUpi'), 'warning')}
                className={`p-4 rounded-lg border-2 text-left transition ${
                  paymentMethod === 'UPI'
                    ? 'border-green-500 bg-green-50'
                    : allFarmersHaveUpi
                      ? 'border-gray-200 hover:border-gray-300'
                      : 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-3">
                  <QrCode className="w-6 h-6 text-purple-600" />
                  <div>
                    <p className="font-medium text-gray-900">{t('upi')}</p>
                    <p className="text-xs text-gray-500">
                      {allFarmersHaveUpi ? t('upiDesc') : t('farmerNoUpi')}
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* UPI Payment Details */}
          {paymentMethod === 'UPI' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-purple-600" />
                {t('upiPayment')}
              </h2>
              <p className="text-sm text-gray-600 mb-4">{t('upiInstructions')}</p>
              
              <div className="space-y-6">
                {cartGroups.map((group) => (
                  <div key={group.farmer.id} className="border border-gray-100 rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      {qrDataUrls[group.farmer.id] && (
                        <div className="flex-shrink-0">
                          <img
                            src={qrDataUrls[group.farmer.id]}
                            alt={`UPI QR for ${group.farmer.fullName}`}
                            className="w-40 h-40 rounded-lg border border-gray-200"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{group.farmer.fullName}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          UPI: <span className="font-mono text-gray-700">{group.farmer.upiId}</span>
                        </p>
                        <p className="text-lg font-bold text-green-600 mt-2">
                          {formatPrice(group.total)}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">{t('scanOrCopy')}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <Input
                  label={t('upiRefLabel')}
                  placeholder={t('upiRefPlaceholder')}
                  value={upiRefId}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 12)
                    setUpiRefId(val)
                  }}
                  maxLength={12}
                />
                <p className="text-xs text-gray-400 mt-1">{t('upiRefHelp')}</p>
              </div>
            </div>
          )}

          {/* Order Review */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">{t('orderReview')}</h2>
            <div className="space-y-4">
              {cartGroups.map((group) => (
                <div key={group.farmer.id} className="border border-gray-100 rounded-lg p-4">
                  <p className="font-medium text-green-700 mb-2">{group.farmer.fullName}</p>
                  <div className="space-y-2 text-sm">
                    {group.items.map((item) => (
                      <div key={item.id} className="flex justify-between">
                        <span className="text-gray-600">
                          {item.product.title} × {item.quantity}
                        </span>
                        <span>{formatPrice(item.product.price * item.quantity)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-gray-500 pt-2 border-t border-gray-100">
                      <span>{t('delivery')}</span>
                      <span>{formatPrice(group.deliveryFee)}</span>
                    </div>
                    <div className="flex justify-between font-medium pt-1">
                      <span>{tCart('subtotal')}</span>
                      <span>{formatPrice(group.subtotal + group.deliveryFee)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 mb-4">{t('paymentSummary')}</h2>
            <div className="space-y-3 text-sm">
              {cartGroups.map((group) => (
                <div key={group.farmer.id} className="flex justify-between">
                  <span className="text-gray-600">{group.farmer.fullName}</span>
                  <span>{formatPrice(group.subtotal + group.deliveryFee)}</span>
                </div>
              ))}
              <hr />
              <div className="flex justify-between items-center">
                <span className="text-gray-600">{t('paymentMethod')}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  paymentMethod === 'UPI' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                }`}>
                  {paymentMethod === 'UPI' ? t('upi') : t('cod')}
                </span>
              </div>
              <hr />
              <div className="flex justify-between text-lg font-bold">
                <span>{t('total')}</span>
                <span className="text-green-600">{formatPrice(grandTotal)}</span>
              </div>
            </div>
            
            <Button
              className="w-full mt-6"
              size="lg"
              onClick={handlePlaceOrder}
              isLoading={isProcessing}
            >
              {isProcessing ? t('processing') : t('placeOrder')}
            </Button>
            
            {paymentMethod === 'COD' && (
              <p className="text-xs text-gray-400 text-center mt-4">
                {t('codNote')}
              </p>
            )}
            {paymentMethod === 'UPI' && (
              <p className="text-xs text-amber-500 text-center mt-4">
                {t('upiNote')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
