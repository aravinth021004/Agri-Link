'use client'

import { useState, useEffect, useCallback} from 'react'
import { useSession } from 'next-auth/react'
import { useInView } from 'react-intersection-observer'
import { useTranslations } from 'next-intl'
import { Loader2, Filter, X } from 'lucide-react'
import { ProductCard } from '@/components/product-card'
import { Button } from '@/components/ui/button'
import { useGlobalToast } from '@/components/toast-provider'

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
    id: string
    name: string
    slug: string
  }
}

interface Category {
  id: string
  name: string
  slug: string
}

export default function FeedPage() {
  const t = useTranslations('home')
  const tSearch = useTranslations('search')
  const tCommon = useTranslations('common')
  const tCategories = useTranslations('categories')
  const tProduct = useTranslations('product')
  const { data: session } = useSession()
  const { showToast } = useGlobalToast()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    categoryId: '',
    minPrice: '',
    maxPrice: '',
    location: '',
  })

  const { ref, inView } = useInView({
    threshold: 0,
  })

  const fetchProducts = useCallback(async (pageNum = 1, append = false) => {
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '20',
      })

      if (filters.categoryId) params.append('categoryId', filters.categoryId)
      if (filters.minPrice) params.append('minPrice', filters.minPrice)
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice)
      if (filters.location) params.append('location', filters.location)

      const response = await fetch(`/api/feed?${params}`)
      const data = await response.json()

      if (append) {
        setProducts(prev => [...prev, ...data.products])
      } else {
        setProducts(data.products)
      }
      
      setHasMore(data.pagination.hasMore)
      setIsLoading(false)
    } catch (error) {
      console.error('Failed to fetch products:', error)
      setIsLoading(false)
    }
  }, [filters])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      setCategories(data.categories)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [fetchProducts])

  useEffect(() => {
    if (inView && hasMore && !isLoading) {
      setPage(prev => prev + 1)
      fetchProducts(page + 1, true)
    }
  }, [inView, hasMore, isLoading, page, fetchProducts])

  const handleLike = async (productId: string) => {
    if (!session) {
      window.location.href = '/login'
      return
    }

    try {
      const response = await fetch(`/api/interactions/like/${productId}`, {
        method: 'POST',
      })
      const data = await response.json()

      setProducts(prev => prev.map(p => 
        p.id === productId 
          ? { ...p, isLiked: data.liked, likesCount: data.likesCount }
          : p
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

  const applyFilters = () => {
    setPage(1)
    setProducts([])
    setIsLoading(true)
    fetchProducts(1)
    setShowFilters(false)
  }

  const clearFilters = () => {
    setFilters({
      categoryId: '',
      minPrice: '',
      maxPrice: '',
      location: '',
    })
    setPage(1)
    setProducts([])
    setIsLoading(true)
    fetchProducts(1)
    setShowFilters(false)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('featuredProducts')}</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="w-4 h-4 mr-2" />
          {tSearch('filters')}
        </Button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 animate-fadeIn">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">{tSearch('filters')}</h2>
            <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{tSearch('category')}</label>
              <select
                value={filters.categoryId}
                onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500"
              >
                <option value="">{tCategories('all')}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{tSearch('priceRange')}</label>
              <input
                type="number"
                value={filters.minPrice}
                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                placeholder="₹0"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{tSearch('priceRange')}</label>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                placeholder="₹1000"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{tSearch('placeholder')}</label>
              <input
                type="text"
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                placeholder={tSearch('placeholder')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={applyFilters}>{tCommon('save')}</Button>
            <Button variant="outline" onClick={clearFilters}>{tSearch('clearAll')}</Button>
          </div>
        </div>
      )}

      {/* Products Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">{tCommon('noResults')}</p>
          <p className="text-gray-400 mt-2">{tSearch('tryDifferent')}</p>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onLike={() => handleLike(product.id)}
                onAddToCart={(qty) => handleAddToCart(product, qty)}
              />
            ))}
          </div>

          {/* Infinite scroll trigger */}
          {hasMore && (
            <div ref={ref} className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-green-600" />
            </div>
          )}
        </>
      )}
    </div>
  )
}
