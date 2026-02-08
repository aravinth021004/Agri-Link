'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search as SearchIcon, Loader2, Filter, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ProductCard } from '@/components/product-card'
import { Button } from '@/components/ui/button'
import { useSession } from 'next-auth/react'

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

interface Category {
  id: string
  name: string
  slug: string
}

export default function SearchPage() {
  const t = useTranslations('search')
  const tCategories = useTranslations('categories')
  const tCommon = useTranslations('common')
  const { data: session } = useSession()
  const [query, setQuery] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    categoryId: '',
    minPrice: '',
    maxPrice: '',
    location: '',
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const handleSearch = useCallback(async () => {
    if (!query.trim() && !filters.categoryId) return
    
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (query) params.append('search', query)
      if (filters.categoryId) params.append('categoryId', filters.categoryId)
      if (filters.minPrice) params.append('minPrice', filters.minPrice)
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice)
      if (filters.location) params.append('location', filters.location)
      params.append('limit', '24')

      const response = await fetch(`/api/products?${params}`)
      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsLoading(false)
    }
  }, [query, filters])

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (query.trim()) {
        handleSearch()
      }
    }, 500)
    return () => clearTimeout(debounce)
  }, [query, handleSearch])

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

  const handleAddToCart = async (product: Product) => {
    if (!session) {
      window.location.href = '/login'
      return
    }
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

  const applyFilters = () => {
    handleSearch()
    setShowFilters(false)
  }

  const clearFilters = () => {
    setFilters({
      categoryId: '',
      minPrice: '',
      maxPrice: '',
      location: '',
    })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Search Header */}
      <div className="mb-6">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('placeholder')}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-lg focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none"
            autoFocus
          />
        </div>
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {products.length > 0 ? `${products.length} ${tCommon('items')}` : t('placeholder')}
        </p>
        <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="w-4 h-4 mr-2" />
          {t('filters')}
        </Button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 animate-fadeIn">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">{t('filters')}</h2>
            <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('category')}</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('priceRange')}</label>
              <input
                type="number"
                value={filters.minPrice}
                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                placeholder="₹0"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('priceRange')}</label>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                placeholder="₹1000"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('placeholder')}</label>
              <input
                type="text"
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                placeholder={t('placeholder')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={applyFilters}>{tCommon('save')}</Button>
            <Button variant="outline" onClick={clearFilters}>{t('clearAll')}</Button>
          </div>
        </div>
      )}

      {/* Category Quick Filters */}
      {!query && products.length === 0 && (
        <div className="mb-8">
          <h2 className="font-semibold text-gray-900 mb-4">{tCategories('title')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setFilters({ ...filters, categoryId: cat.id })
                  handleSearch()
                }}
                className="p-4 bg-green-50 rounded-xl text-center hover:bg-green-100 transition"
              >
                <span className="text-sm font-medium text-green-700">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
      ) : products.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onLike={() => handleLike(product.id)}
              onAddToCart={() => handleAddToCart(product)}
            />
          ))}
        </div>
      ) : query ? (
        <div className="text-center py-20">
          <SearchIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('noResults')} &quot;{query}&quot;</h2>
          <p className="text-gray-500">{t('tryDifferent')}</p>
        </div>
      ) : null}
    </div>
  )
}
