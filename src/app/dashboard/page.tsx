'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Package, ShoppingBag, Users, Star, TrendingUp, Plus, Edit, Trash2, Eye, Loader2, Clock, CheckCircle, Truck, XCircle, ChevronRight, Banknote, QrCode } from 'lucide-react'
import { formatPrice, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useGlobalToast } from '@/components/toast-provider'
import { useTranslations } from 'next-intl'

interface Product {
  id: string
  title: string
  price: number
  quantity: number
  unit: string
  status: string
  mediaUrls: string[]
  likesCount: number
  commentsCount: number
  createdAt: string
}

interface Order {
  id: string
  orderNumber: string
  status: string
  totalAmount: number
  paymentMethod: string
  paymentStatus: string
  upiRefId: string | null
  createdAt: string
  customer: {
    id: string
    fullName: string
  }
  items: Array<{
    quantity: number
    product: { title: string }
  }>
}

interface Stats {
  totalProducts: number
  totalOrders: number
  totalRevenue: number
  followers: number
  averageRating: number
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { showToast } = useGlobalToast()
  const t = useTranslations('dashboard')
  const tOrders = useTranslations('orders')
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    followers: 0,
    averageRating: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders'>('overview')
  const [orderFilter, setOrderFilter] = useState('')

  // Confirm dialog states
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; productId: string; productTitle: string }>({
    isOpen: false, productId: '', productTitle: '',
  })
  const [cancelConfirm, setCancelConfirm] = useState<{ isOpen: boolean; orderId: string; orderNumber: string }>({
    isOpen: false, orderId: '', orderNumber: '',
  })
  const [statusConfirm, setStatusConfirm] = useState<{ isOpen: boolean; orderId: string; orderNumber: string; newStatus: string; label: string }>({
    isOpen: false, orderId: '', orderNumber: '', newStatus: '', label: '',
  })
  const [isActionLoading, setIsActionLoading] = useState(false)

  const fetchDashboardData = useCallback(async () => {
    try {
      const orderParams = new URLSearchParams({ role: 'farmer', limit: '50' })
      if (orderFilter) orderParams.append('status', orderFilter)

      const [productsRes, ordersRes, profileRes] = await Promise.all([
        fetch(`/api/products?farmerId=${session?.user?.id}&limit=50`),
        fetch(`/api/orders?${orderParams}`),
        fetch('/api/users/profile'),
      ])

      const productsData = await productsRes.json()
      const ordersData = await ordersRes.json()
      const profileData = await profileRes.json()

      setProducts(productsData.products || [])
      setOrders(ordersData.orders || [])
      
      const totalRevenue = (ordersData.orders || [])
        .filter((o: Order) => o.status === 'DELIVERED')
        .reduce((sum: number, o: Order) => sum + o.totalAmount, 0)

      setStats({
        totalProducts: productsData.pagination?.total || productsData.products?.length || 0,
        totalOrders: ordersData.pagination?.total || ordersData.orders?.length || 0,
        totalRevenue,
        followers: profileData.user?._count?.followers || 0,
        averageRating: profileData.averageRating?.average || 0,
      })
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.id, orderFilter])

  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user?.role !== 'FARMER' && session?.user?.role !== 'ADMIN') {
        router.push('/profile')
        return
      }
      fetchDashboardData()
    } else if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, session, router, fetchDashboardData])

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setIsActionLoading(true)
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        showToast(newStatus === 'CANCELLED' ? tOrders('orderCancelledSuccess') : tOrders('orderUpdatedSuccess'), 'success')
      } else {
        const data = await res.json()
        showToast(data.error || 'Failed to update order', 'error')
      }
      fetchDashboardData()
    } catch (error) {
      console.error('Failed to update order:', error)
      showToast('Failed to update order', 'error')
    } finally {
      setIsActionLoading(false)
      setStatusConfirm({ isOpen: false, orderId: '', orderNumber: '', newStatus: '', label: '' })
      setCancelConfirm({ isOpen: false, orderId: '', orderNumber: '' })
    }
  }

  const deleteProduct = async (productId: string) => {
    setIsActionLoading(true)
    try {
      const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' })
      if (res.ok) {
        showToast('Product deleted successfully', 'success')
      } else {
        showToast('Failed to delete product', 'error')
      }
      fetchDashboardData()
    } catch (error) {
      console.error('Failed to delete product:', error)
      showToast('Failed to delete product', 'error')
    } finally {
      setIsActionLoading(false)
      setDeleteConfirm({ isOpen: false, productId: '', productTitle: '' })
    }
  }

  const confirmPayment = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/confirm-payment`, {
        method: 'POST',
      })
      if (res.ok) {
        showToast(tOrders('paymentConfirmedSuccess'), 'success')
        fetchDashboardData()
      } else {
        const data = await res.json()
        showToast(data.error || 'Failed to confirm payment', 'error')
      }
    } catch (error) {
      console.error('Failed to confirm payment:', error)
      showToast('Failed to confirm payment', 'error')
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    )
  }

  const statusActions: Record<string, { next: string; label: string }> = {
    PENDING: { next: 'CONFIRMED', label: 'confirmOrder' },
    CONFIRMED: { next: 'PACKED', label: 'markPacked' },
    PACKED: { next: 'OUT_FOR_DELIVERY', label: 'outForDeliveryAction' },
    OUT_FOR_DELIVERY: { next: 'DELIVERED', label: 'markDelivered' },
  }

  const statusIcon: Record<string, React.ElementType> = {
    PENDING: Clock,
    CONFIRMED: CheckCircle,
    PACKED: Package,
    OUT_FOR_DELIVERY: Truck,
    DELIVERED: CheckCircle,
    CANCELLED: XCircle,
  }

  const canCancel = (orderStatus: string) =>
    ['PENDING', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY'].includes(orderStatus)

  const orderFilterOptions = [
    { value: '', label: t('allOrders') },
    { value: 'PENDING', label: t('pending') },
    { value: 'CONFIRMED', label: t('confirmed') },
    { value: 'PACKED', label: t('packed') },
    { value: 'OUT_FOR_DELIVERY', label: t('outForDelivery') },
    { value: 'DELIVERED', label: t('delivered') },
    { value: 'CANCELLED', label: t('cancelled') },
  ]

  const tabLabels: Record<string, string> = { overview: t('overview'), products: t('myProducts'), orders: t('orders') }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Delete Product Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, productId: '', productTitle: '' })}
        onConfirm={() => deleteProduct(deleteConfirm.productId)}
        title={t('deleteProduct')}
        message={t('deleteConfirmMessage')}
        confirmLabel="Delete"
        variant="danger"
        isLoading={isActionLoading}
      />

      {/* Cancel Order Confirmation */}
      <ConfirmDialog
        isOpen={cancelConfirm.isOpen}
        onClose={() => setCancelConfirm({ isOpen: false, orderId: '', orderNumber: '' })}
        onConfirm={() => updateOrderStatus(cancelConfirm.orderId, 'CANCELLED')}
        title={t('cancelOrder')}
        message={t('cancelConfirmMessage')}
        confirmLabel={t('cancelOrder')}
        variant="danger"
        isLoading={isActionLoading}
      />

      {/* Status Update Confirmation */}
      <ConfirmDialog
        isOpen={statusConfirm.isOpen}
        onClose={() => setStatusConfirm({ isOpen: false, orderId: '', orderNumber: '', newStatus: '', label: '' })}
        onConfirm={() => updateOrderStatus(statusConfirm.orderId, statusConfirm.newStatus)}
        title={t('updateOrderStatus')}
        message={`${tOrders('orderNumber')} #${statusConfirm.orderNumber} → ${statusConfirm.label ? tOrders(statusConfirm.label) : ''}`}
        confirmLabel={statusConfirm.label ? tOrders(statusConfirm.label) : ''}
        isLoading={isActionLoading}
      />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <Link href="/products/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            {t('addProduct')}
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <Package className="w-8 h-8 text-green-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
          <p className="text-sm text-gray-500">{t('products')}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <ShoppingBag className="w-8 h-8 text-blue-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
          <p className="text-sm text-gray-500">{t('orders')}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <TrendingUp className="w-8 h-8 text-purple-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{formatPrice(stats.totalRevenue)}</p>
          <p className="text-sm text-gray-500">{t('revenue')}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <Users className="w-8 h-8 text-orange-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{stats.followers}</p>
          <p className="text-sm text-gray-500">{t('followers')}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <Star className="w-8 h-8 text-yellow-500 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</p>
          <p className="text-sm text-gray-500">{t('rating')}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['overview', 'products', 'orders'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === tab
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">{t('recentOrders')}</h2>
              <button onClick={() => setActiveTab('orders')} className="text-sm text-green-600 hover:underline">
                {t('viewAll')}
              </button>
            </div>
            <div className="space-y-3">
              {orders.slice(0, 5).map((order) => (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div>
                    <p className="font-medium text-sm">#{order.orderNumber}</p>
                    <p className="text-xs text-gray-500">{order.customer.fullName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="font-medium text-green-600">{formatPrice(order.totalAmount)}</p>
                      <span className={`text-xs ${
                        order.status === 'DELIVERED' ? 'text-green-600' :
                        order.status === 'CANCELLED' ? 'text-red-600' :
                        'text-yellow-600'
                      }`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </Link>
              ))}
              {orders.length === 0 && (
                <p className="text-gray-500 text-center py-4">{t('noOrders')}</p>
              )}
            </div>
          </div>

          {/* Recent Products */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">{t('yourProducts')}</h2>
              <button onClick={() => setActiveTab('products')} className="text-sm text-green-600 hover:underline">
                {t('viewAll')}
              </button>
            </div>
            <div className="space-y-3">
              {products.slice(0, 5).map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src={product.mediaUrls?.[0] || '/placeholder.jpg'}
                      alt=""
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{product.title}</p>
                    <p className="text-xs text-gray-500">{product.quantity} {product.unit} {t('available')}</p>
                  </div>
                  <span className="font-medium text-green-600">{formatPrice(product.price)}</span>
                </Link>
              ))}
              {products.length === 0 && (
                <p className="text-gray-500 text-center py-4">No products yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <>
          {products.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('noProducts')}</h2>
              <p className="text-gray-500 mb-6">{t('startSelling')}</p>
              <Link href="/products/create">
                <Button><Plus className="w-4 h-4 mr-2" /> Add Product</Button>
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Mobile: Cards / Desktop: Table */}
              <div className="hidden md:block">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('product')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('price')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('stock')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('status')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 rounded overflow-hidden bg-gray-100">
                              <Image
                                src={product.mediaUrls?.[0] || '/placeholder.jpg'}
                                alt=""
                                fill
                                className="object-cover"
                              />
                            </div>
                            <span className="font-medium text-sm">{product.title}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">{formatPrice(product.price)}/{product.unit}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={product.quantity <= 5 ? 'text-red-600 font-medium' : ''}>
                            {product.quantity}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            product.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                            product.status === 'SOLD_OUT' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {product.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <Link href={`/products/${product.id}`} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100" title="View">
                              <Eye className="w-4 h-4" />
                            </Link>
                            <Link href={`/products/${product.id}/edit`} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50" title="Edit">
                              <Edit className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => setDeleteConfirm({ isOpen: true, productId: product.id, productTitle: product.title })}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile product cards */}
              <div className="md:hidden divide-y divide-gray-100">
                {products.map((product) => (
                  <div key={product.id} className="p-4 flex items-center gap-3">
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <Image src={product.mediaUrls?.[0] || '/placeholder.jpg'} alt="" fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{product.title}</p>
                      <p className="text-xs text-gray-500">{formatPrice(product.price)}/{product.unit} • {product.quantity} {t('inStock')}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${
                        product.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                        product.status === 'SOLD_OUT' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>{product.status}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Link href={`/products/${product.id}/edit`} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50">
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => setDeleteConfirm({ isOpen: true, productId: product.id, productTitle: product.title })}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div>
          {/* Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-4">
            {orderFilterOptions.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setOrderFilter(value)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                  orderFilter === value
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
              <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('noOrdersFound')}</h2>
              <p className="text-gray-500">{orderFilter ? t('tryDifferentFilter') : t('ordersFromCustomers')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const StatusIcon = statusIcon[order.status] || Clock
                const action = statusActions[order.status]

                return (
                  <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
                    <Link href={`/orders/${order.id}`} className="block p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-gray-900">{tOrders('orderNumber')} #{order.orderNumber}</p>
                          <p className="text-sm text-gray-500">{order.customer.fullName} • {formatDate(order.createdAt)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="font-bold text-green-600">{formatPrice(order.totalAmount)}</p>
                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                              order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                              order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                              order.status === 'OUT_FOR_DELIVERY' ? 'bg-indigo-100 text-indigo-700' :
                              order.status === 'PACKED' ? 'bg-purple-100 text-purple-700' :
                              order.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              <StatusIcon className="w-3 h-3" />
                              {order.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                          order.paymentMethod === 'UPI' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {order.paymentMethod === 'UPI' ? <QrCode className="w-3 h-3" /> : <Banknote className="w-3 h-3" />}
                          {order.paymentMethod}
                        </span>
                        {order.paymentMethod === 'UPI' && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            order.paymentStatus === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {order.paymentStatus === 'CONFIRMED' ? tOrders('paymentConfirmed') : tOrders('paymentPending')}
                          </span>
                        )}
                        {order.upiRefId && (
                          <span className="text-xs text-gray-400">Ref: {order.upiRefId}</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {order.items.map((item, idx) => (
                          <span key={idx}>
                            {item.product.title} × {item.quantity}
                            {idx < order.items.length - 1 && ', '}
                          </span>
                        ))}
                      </div>
                    </Link>

                    {/* Action Buttons */}
                    {(action || canCancel(order.status) || (order.paymentMethod === 'UPI' && order.paymentStatus === 'PENDING')) && (
                      <div className="px-4 pb-4 flex gap-2 flex-wrap">
                        {order.paymentMethod === 'UPI' && order.paymentStatus === 'PENDING' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.preventDefault()
                              confirmPayment(order.id)
                            }}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            {tOrders('confirmPayment')}
                          </Button>
                        )}
                        {action && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault()
                              setStatusConfirm({
                                isOpen: true,
                                orderId: order.id,
                                orderNumber: order.orderNumber,
                                newStatus: action.next,
                                label: action.label,
                              })
                            }}
                          >
                            {order.status === 'PENDING' && <CheckCircle className="w-4 h-4 mr-1" />}
                            {order.status === 'CONFIRMED' && <Package className="w-4 h-4 mr-1" />}
                            {order.status === 'PACKED' && <Truck className="w-4 h-4 mr-1" />}
                            {order.status === 'OUT_FOR_DELIVERY' && <CheckCircle className="w-4 h-4 mr-1" />}
                            {tOrders(action.label)}
                          </Button>
                        )}
                        {canCancel(order.status) && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(e) => {
                              e.preventDefault()
                              setCancelConfirm({ isOpen: true, orderId: order.id, orderNumber: order.orderNumber })
                            }}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
