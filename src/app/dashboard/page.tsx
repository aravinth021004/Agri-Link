'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Package, ShoppingBag, Users, Star, TrendingUp, Plus, Edit, Trash2, Eye, Loader2, Clock, CheckCircle, Truck } from 'lucide-react'
import { formatPrice, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'

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

  const fetchDashboardData = useCallback(async () => {
    try {
      const [productsRes, ordersRes, profileRes] = await Promise.all([
        fetch('/api/products?farmerId=me&limit=10'),
        fetch('/api/orders?limit=10'),
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
  }, [])

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
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      fetchDashboardData()
    } catch (error) {
      console.error('Failed to update order:', error)
    }
  }

  const deleteProduct = async (productId: string) => {
    if (!confirm('Delete this product?')) return
    try {
      await fetch(`/api/products/${productId}`, { method: 'DELETE' })
      fetchDashboardData()
    } catch (error) {
      console.error('Failed to delete product:', error)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    )
  }

  const statusActions: Record<string, string> = {
    PENDING: 'CONFIRMED',
    CONFIRMED: 'PACKED',
    PACKED: 'OUT_FOR_DELIVERY',
    OUT_FOR_DELIVERY: 'DELIVERED',
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Farmer Dashboard</h1>
        <Link href="/products/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <Package className="w-8 h-8 text-green-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
          <p className="text-sm text-gray-500">Products</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <ShoppingBag className="w-8 h-8 text-blue-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
          <p className="text-sm text-gray-500">Orders</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <TrendingUp className="w-8 h-8 text-purple-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{formatPrice(stats.totalRevenue)}</p>
          <p className="text-sm text-gray-500">Revenue</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <Users className="w-8 h-8 text-orange-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{stats.followers}</p>
          <p className="text-sm text-gray-500">Followers</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <Star className="w-8 h-8 text-yellow-500 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</p>
          <p className="text-sm text-gray-500">Rating</p>
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
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4">Recent Orders</h2>
            <div className="space-y-3">
              {orders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">#{order.orderNumber}</p>
                    <p className="text-xs text-gray-500">{order.customer.fullName}</p>
                  </div>
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
                </div>
              ))}
              {orders.length === 0 && (
                <p className="text-gray-500 text-center py-4">No orders yet</p>
              )}
            </div>
          </div>

          {/* Recent Products */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4">Your Products</h2>
            <div className="space-y-3">
              {products.slice(0, 5).map((product) => (
                <div key={product.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
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
                    <p className="text-xs text-gray-500">{product.quantity} {product.unit} available</p>
                  </div>
                  <span className="font-medium text-green-600">{formatPrice(product.price)}</span>
                </div>
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((product) => (
                <tr key={product.id}>
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
                  <td className="px-4 py-3 text-sm">{product.quantity}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      product.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link href={`/products/${product.id}`} className="text-gray-400 hover:text-gray-600">
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link href={`/products/${product.id}/edit`} className="text-gray-400 hover:text-blue-600">
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button onClick={() => deleteProduct(product.id)} className="text-gray-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-medium">Order #{order.orderNumber}</p>
                  <p className="text-sm text-gray-500">{order.customer.fullName} • {formatDate(order.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">{formatPrice(order.totalAmount)}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                    order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {order.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-3">
                {order.items.map((item, idx) => (
                  <span key={idx}>
                    {item.product.title} × {item.quantity}
                    {idx < order.items.length - 1 && ', '}
                  </span>
                ))}
              </div>
              {statusActions[order.status] && (
                <Button
                  size="sm"
                  onClick={() => updateOrderStatus(order.id, statusActions[order.status])}
                >
                  {order.status === 'PENDING' && <><CheckCircle className="w-4 h-4 mr-1" /> Confirm</>}
                  {order.status === 'CONFIRMED' && <><Package className="w-4 h-4 mr-1" /> Mark Packed</>}
                  {order.status === 'PACKED' && <><Truck className="w-4 h-4 mr-1" /> Out for Delivery</>}
                  {order.status === 'OUT_FOR_DELIVERY' && <><CheckCircle className="w-4 h-4 mr-1" /> Mark Delivered</>}
                </Button>
              )}
            </div>
          ))}
          {orders.length === 0 && (
            <div className="text-center py-12 text-gray-500">No orders yet</div>
          )}
        </div>
      )}
    </div>
  )
}
