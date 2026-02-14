'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Loader2, Grid, List } from 'lucide-react'
import { ProductCard } from '@/components/product-card'
import { Button } from '@/components/ui/button'
import { useGlobalToast } from '@/components/toast-provider'
import { useTranslations } from 'next-intl'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
}

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

export default function CategoryPage() {
  const params = useParams()
  const { data: session } = useSession()
  const { showToast } = useGlobalToast()
  const tProduct = useTranslations('product')
  const [category, setCategory] = useState<Category | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState('newest')

  const fetchData = useCallback(async () => {
    try {
      const [catRes, productsRes] = await Promise.all([
        fetch(`/api/categories?slug=${params.slug}`),
        fetch(`/api/products?categorySlug=${params.slug}&sort=${sortBy}&limit=24`),
      ])
      
      const catData = await catRes.json()
      const productsData = await productsRes.json()
      
      if (catData.categories?.length > 0) {
        setCategory(catData.categories.find((c: Category) => c.slug === params.slug) || null)
      }
      setProducts(productsData.products || [])
    } catch (error) {
      console.error('Failed to fetch category:', error)
    } finally {
      setIsLoading(false)
    }
  }, [params.slug, sortBy])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleLike = async (productId: string) => {
    if (!session) {
      window.location.href = '/login'
      return
    }
    try {
      const response = await fetch(`/api/interactions/like/${productId}`, { method: 'POST' })
      const data = await response.json()
      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, isLiked: data.liked, likesCount: data.likesCount } : p
      ))
    } catch (error) {
      console.error('Failed to like:', error)
    }
  }

  const handleAddToCart = async (product: Product, quantity: number) => {
    if (!session) {
      window.location.href = '/login'
      return
    }
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          quantity,
          deliveryOption: 'HOME_DELIVERY',
        }),
      })
      if (response.ok) {
        showToast(tProduct('addedToCart'), 'success')
      }
    } catch (error) {
      console.error('Failed to add to cart:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    )
  }

  if (!category) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Category not found</h1>
        <Link href="/search" className="text-green-600 hover:underline mt-4 inline-block">
          Browse all products
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-6">
        <Link href="/search" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4" />
          All Categories
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
        {category.description && (
          <p className="text-gray-600 mt-2">{category.description}</p>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">{products.length} products</p>
        <div className="flex items-center gap-4">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-green-500"
          >
            <option value="newest">Newest</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="popular">Most Popular</option>
          </select>
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-green-600 text-white' : 'bg-white text-gray-600'}`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-green-600 text-white' : 'bg-white text-gray-600'}`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Products */}
      {products.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500">No products in this category yet</p>
        </div>
      ) : (
        <div className={
          viewMode === 'grid'
            ? 'grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
        }>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onLike={() => handleLike(product.id)}
              onAddToCart={(qty) => handleAddToCart(product, qty)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
