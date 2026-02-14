'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Heart, Loader2 } from 'lucide-react'
import { ProductCard } from '@/components/product-card'
import { useTranslations } from 'next-intl'

interface Product {
  id: string
  title: string
  description: string
  price: number
  quantity: number
  unit: string
  mediaUrls: string[]
  likesCount: number
  commentsCount: number
  createdAt: string
  isLiked: boolean
  farmer: {
    id: string
    fullName: string
    profileImage: string | null
    location: string | null
  }
  category: {
    name: string
  }
}

export default function WishlistPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const t = useTranslations('wishlist')
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchWishlist = useCallback(async () => {
    try {
      const response = await fetch('/api/wishlist')
      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error('Failed to fetch wishlist:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchWishlist()
    } else if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router, fetchWishlist])

  const handleUnlike = async (productId: string) => {
    try {
      await fetch(`/api/interactions/like/${productId}`, { method: 'POST' })
      setProducts(prev => prev.filter(p => p.id !== productId))
    } catch (error) {
      console.error('Failed to unlike:', error)
    }
  }

  const handleAddToCart = async (product: Product) => {
    try {
      await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          quantity: 1,
          deliveryOption: 'HOME_DELIVERY',
        }),
      })
    } catch (error) {
      console.error('Failed to add to cart:', error)
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('title')}</h1>

      {products.length === 0 ? (
        <div className="text-center py-16">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('empty')}</h2>
          <p className="text-gray-500 mb-6">{t('emptySubtitle')}</p>
          <button
            onClick={() => router.push('/feed')}
            className="text-green-600 font-medium hover:text-green-700"
          >
            {t('browseProducts')}
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onLike={() => handleUnlike(product.id)}
              onAddToCart={() => handleAddToCart(product)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
