'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Loader2 } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface CartItem {
  id: string
  quantity: number
  deliveryOption: string
  product: {
    id: string
    title: string
    price: number
    unit: string
    quantity: number
    mediaUrls: string[]
    farmer: {
      id: string
      fullName: string
    }
  }
}

interface CartGroup {
  farmer: {
    id: string
    fullName: string
  }
  items: CartItem[]
  subtotal: number
  deliveryFee: number
}

export default function CartPage() {
  const t = useTranslations('cart')
  const { data: session, status } = useSession()
  const router = useRouter()
  const [cartGroups, setCartGroups] = useState<CartGroup[]>([])
  const [grandTotal, setGrandTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set())

  const fetchCart = useCallback(async () => {
    try {
      const response = await fetch('/api/cart')
      const data = await response.json()
      setCartGroups(data.farmerGroups || [])
      setGrandTotal(data.grandTotal || 0)
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

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return
    
    setUpdatingItems(prev => new Set(prev).add(itemId))
    try {
      await fetch(`/api/cart/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQuantity }),
      })
      fetchCart()
    } catch (error) {
      console.error('Failed to update quantity:', error)
    } finally {
      setUpdatingItems(prev => {
        const next = new Set(prev)
        next.delete(itemId)
        return next
      })
    }
  }

  const removeItem = async (itemId: string) => {
    setUpdatingItems(prev => new Set(prev).add(itemId))
    try {
      await fetch(`/api/cart/${itemId}`, { method: 'DELETE' })
      fetchCart()
    } catch (error) {
      console.error('Failed to remove item:', error)
    } finally {
      setUpdatingItems(prev => {
        const next = new Set(prev)
        next.delete(itemId)
        return next
      })
    }
  }

  const clearCart = async () => {
    if (!confirm('Clear all items from cart?')) return
    try {
      await fetch('/api/cart', { method: 'DELETE' })
      fetchCart()
    } catch (error) {
      console.error('Failed to clear cart:', error)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    )
  }

  const totalItems = cartGroups.reduce((sum, group) => 
    sum + group.items.reduce((s, item) => s + item.quantity, 0), 0
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        {cartGroups.length > 0 && (
          <button onClick={clearCart} className="text-sm text-red-500 hover:text-red-600">
            Clear Cart
          </button>
        )}
      </div>

      {cartGroups.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('empty')}</h2>
          <p className="text-gray-500 mb-6">{t('emptySubtitle')}</p>
          <Link href="/feed">
            <Button>{t('continueShopping')}</Button>
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {cartGroups.map((group) => (
              <div key={group.farmer.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-green-50 px-4 py-3 border-b border-green-100">
                  <Link href={`/farmers/${group.farmer.id}`} className="font-medium text-green-700 hover:text-green-800">
                    {group.farmer.fullName}&apos;s Products
                  </Link>
                </div>
                <div className="divide-y divide-gray-100">
                  {group.items.map((item) => (
                    <div key={item.id} className="p-4 flex gap-4">
                      <Link href={`/products/${item.product.id}`} className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <Image
                          src={item.product.mediaUrls?.[0] || '/placeholder.jpg'}
                          alt={item.product.title}
                          fill
                          className="object-cover"
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link href={`/products/${item.product.id}`} className="font-medium text-gray-900 hover:text-green-600 line-clamp-1">
                          {item.product.title}
                        </Link>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatPrice(item.product.price)} / {item.product.unit}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {item.deliveryOption.replace(/_/g, ' ')}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center border border-gray-200 rounded-lg">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={updatingItems.has(item.id) || item.quantity <= 1}
                            className="p-1.5 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="px-3 text-sm font-medium">
                            {updatingItems.has(item.id) ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              item.quantity
                            )}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={updatingItems.has(item.id) || item.quantity >= item.product.quantity}
                            className="p-1.5 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <span className="font-semibold text-green-600">
                          {formatPrice(item.product.price * item.quantity)}
                        </span>
                        <button
                          onClick={() => removeItem(item.id)}
                          disabled={updatingItems.has(item.id)}
                          className="text-red-500 hover:text-red-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-gray-50 px-4 py-3 flex justify-between text-sm">
                  <span className="text-gray-600">{t('subtotal')} + {t('deliveryFee')} ({formatPrice(group.deliveryFee)})</span>
                  <span className="font-semibold">{formatPrice(group.subtotal + group.deliveryFee)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Items ({totalItems})</span>
                  <span>{formatPrice(cartGroups.reduce((s, g) => s + g.subtotal, 0))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('deliveryFee')}</span>
                  <span>{formatPrice(cartGroups.reduce((s, g) => s + g.deliveryFee, 0))}</span>
                </div>
                <hr />
                <div className="flex justify-between text-lg font-bold">
                  <span>{t('total')}</span>
                  <span className="text-green-600">{formatPrice(grandTotal)}</span>
                </div>
              </div>
              <Link href="/checkout" className="block mt-6">
                <Button className="w-full" size="lg">
                  {t('checkout')}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <p className="text-xs text-gray-400 text-center mt-4">
                Orders will be placed separately per farmer
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
