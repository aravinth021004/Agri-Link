'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Package, ChevronRight, Loader2, Clock, CheckCircle, Truck, XCircle } from 'lucide-react'
import { formatPrice, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface Order {
  id: string
  orderNumber: string
  status: string
  totalAmount: number
  deliveryOption: string
  createdAt: string
  farmer: {
    id: string
    fullName: string
  }
  items: Array<{
    id: string
    quantity: number
    unitPrice: number
    product: {
      title: string
    }
  }>
}

export default function OrdersPage() {
  const t = useTranslations('orders')
  const tCart = useTranslations('cart')
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('')

  const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
    PENDING: { icon: Clock, color: 'text-yellow-500', label: t('status.pending') },
    CONFIRMED: { icon: CheckCircle, color: 'text-blue-500', label: t('status.confirmed') },
    PACKED: { icon: Package, color: 'text-purple-500', label: t('status.packed') },
    OUT_FOR_DELIVERY: { icon: Truck, color: 'text-indigo-500', label: t('status.outForDelivery') },
    DELIVERED: { icon: CheckCircle, color: 'text-green-500', label: t('status.delivered') },
    CANCELLED: { icon: XCircle, color: 'text-red-500', label: t('status.cancelled') },
    DISPUTED: { icon: XCircle, color: 'text-orange-500', label: t('status.cancelled') },
  }

  const fetchOrders = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filter) params.append('status', filter)
      
      const response = await fetch(`/api/orders?${params}`)
      const data = await response.json()
      setOrders(data.orders || [])
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setIsLoading(false)
    }
  }, [filter])

  useEffect(() => {
    if (authStatus === 'authenticated') {
      fetchOrders()
    } else if (authStatus === 'unauthenticated') {
      router.push('/login')
    }
  }, [authStatus, router, fetchOrders])

  if (authStatus === 'loading' || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('title')}</h1>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
        {['', 'PENDING', 'CONFIRMED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
              filter === status
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status ? statusConfig[status]?.label || status : t('title')}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('empty')}</h2>
          <p className="text-gray-500 mb-6">{t('emptySubtitle')}</p>
          <Link href="/feed">
            <Button>{tCart('continueShopping')}</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const StatusIcon = statusConfig[order.status]?.icon || Clock
            const statusColor = statusConfig[order.status]?.color || 'text-gray-500'
            const statusLabel = statusConfig[order.status]?.label || order.status

            return (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-gray-900">{t('orderNumber')} #{order.orderNumber}</p>
                    <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className={`flex items-center gap-1.5 ${statusColor}`}>
                    <StatusIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">{statusLabel}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{order.farmer.fullName}</p>
                    <p className="text-sm text-gray-500">
                      {order.items.length} item{order.items.length > 1 ? 's' : ''} • {order.deliveryOption.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-green-600">{formatPrice(order.totalAmount)}</span>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
