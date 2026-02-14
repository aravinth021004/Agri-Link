'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Upload, X, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useGlobalToast } from '@/components/toast-provider'

interface Category {
  id: string
  name: string
  slug: string
}

export default function CreateProductPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { showToast } = useGlobalToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    quantity: '',
    unit: 'kg',
    categoryId: '',
    deliveryOptions: ['HOME_DELIVERY'],
    deliveryRadius: '10',
    deliveryFee: '0',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user?.role !== 'FARMER' && session?.user?.role !== 'ADMIN') {
        router.push('/profile')
        return
      }
      fetchCategories()
    } else if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, session, router])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    
    setIsUploading(true)
    try {
      const formData = new FormData()
      Array.from(files).forEach((file) => {
        formData.append('files', file)
      })

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()

      if (!response.ok) {
        showToast(data.error || 'Upload failed', 'error')
        return
      }

      if (data.uploads?.length) {
        const urls = data.uploads.map((u: { url: string }) => u.url)
        setImages((prev) => [...prev, ...urls].slice(0, 5))
      }
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const toggleDeliveryOption = (option: string) => {
    setFormData((prev) => ({
      ...prev,
      deliveryOptions: prev.deliveryOptions.includes(option)
        ? prev.deliveryOptions.filter((o) => o !== option)
        : [...prev.deliveryOptions, option],
    }))
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.title.trim()) newErrors.title = 'Title is required'
    if (!formData.description.trim()) newErrors.description = 'Description is required'
    if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = 'Valid price is required'
    if (!formData.quantity || parseInt(formData.quantity) <= 0) newErrors.quantity = 'Valid quantity is required'
    if (!formData.categoryId) newErrors.categoryId = 'Category is required'
    if (images.length === 0) newErrors.images = 'At least one image is required'
    if (formData.deliveryOptions.length === 0) newErrors.deliveryOptions = 'At least one delivery option is required'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          quantity: parseInt(formData.quantity),
          deliveryRadius: parseInt(formData.deliveryRadius),
          deliveryFee: parseFloat(formData.deliveryFee),
          mediaUrls: images,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/products/${data.id}`)
      } else {
        const error = await response.json()
        showToast(error.error || 'Failed to create product', 'error')
      }
    } catch (error) {
      console.error('Failed to create product:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Product</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Images <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {images.map((url, idx) => (
              <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                <Image src={url} alt="" fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {images.length < 5 && (
              <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-green-500 transition">
                {isUploading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-gray-400 mb-1" />
                    <span className="text-xs text-gray-500">Upload</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            )}
          </div>
          {errors.images && <p className="text-sm text-red-500 mt-1">{errors.images}</p>}
        </div>

        {/* Title */}
        <Input
          label="Product Title"
          placeholder="e.g., Fresh Organic Tomatoes"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          error={errors.title}
          required
        />

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe your product, quality, freshness, etc."
            rows={4}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 resize-none ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
        </div>

        {/* Price and Quantity */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Input
            label="Price (₹)"
            type="number"
            placeholder="100"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            error={errors.price}
            required
          />
          <Input
            label="Quantity"
            type="number"
            placeholder="50"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            error={errors.quantity}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
            <select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
            >
              <option value="kg">Kilogram (kg)</option>
              <option value="g">Gram (g)</option>
              <option value="piece">Piece</option>
              <option value="dozen">Dozen</option>
              <option value="litre">Litre</option>
              <option value="bundle">Bundle</option>
            </select>
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.categoryId}
            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 ${
              errors.categoryId ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          {errors.categoryId && <p className="text-sm text-red-500 mt-1">{errors.categoryId}</p>}
        </div>

        {/* Delivery Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Delivery Options <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap gap-3">
            {['HOME_DELIVERY', 'FARM_PICKUP', 'MEETUP_POINT'].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => toggleDeliveryOption(option)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  formData.deliveryOptions.includes(option)
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
          {errors.deliveryOptions && <p className="text-sm text-red-500 mt-1">{errors.deliveryOptions}</p>}
        </div>

        {/* Delivery Details */}
        {formData.deliveryOptions.includes('HOME_DELIVERY') && (
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Delivery Radius (km)"
              type="number"
              placeholder="10"
              value={formData.deliveryRadius}
              onChange={(e) => setFormData({ ...formData, deliveryRadius: e.target.value })}
            />
            <Input
              label="Delivery Fee (₹)"
              type="number"
              placeholder="50"
              value={formData.deliveryFee}
              onChange={(e) => setFormData({ ...formData, deliveryFee: e.target.value })}
            />
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-4 pt-4">
          <Button type="submit" isLoading={isLoading} className="flex-1">
            <Plus className="w-4 h-4 mr-2" />
            Create Product
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
