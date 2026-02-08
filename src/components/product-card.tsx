'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Heart, MessageCircle, Share2, MapPin } from 'lucide-react'
import { formatPrice, formatRelativeTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface ProductCardProps {
  product: {
    id: string
    title: string
    description: string
    price: number | string
    quantity: number
    unit: string
    mediaUrls: string[]
    likesCount: number
    commentsCount: number
    createdAt: string
    isLiked?: boolean
    farmer: {
      id: string
      fullName: string
      profileImage?: string | null
      location?: string | null
    }
    category: {
      name: string
    }
  }
  onLike?: () => void
  onAddToCart?: () => void
}

export function ProductCard({ product, onLike, onAddToCart }: ProductCardProps) {
  const mainImage = product.mediaUrls?.[0] || '/placeholder.jpg'
  const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      {/* Header - Farmer info */}
      <div className="flex items-center gap-3 p-3 border-b border-gray-50">
        <Link href={`/farmers/${product.farmer.id}`}>
          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100">
            {product.farmer.profileImage ? (
              <Image
                src={product.farmer.profileImage}
                alt={product.farmer.fullName}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-green-100 text-green-600 font-semibold">
                {product.farmer.fullName.charAt(0)}
              </div>
            )}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={`/farmers/${product.farmer.id}`}>
            <p className="font-medium text-sm text-gray-900 truncate hover:text-green-600">
              {product.farmer.fullName}
            </p>
          </Link>
          {product.farmer.location && (
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {product.farmer.location}
            </p>
          )}
        </div>
        <span className="text-xs text-gray-400">
          {formatRelativeTime(product.createdAt)}
        </span>
      </div>

      {/* Image */}
      <Link href={`/products/${product.id}`}>
        <div className="relative aspect-square bg-gray-100">
          <Image
            src={mainImage}
            alt={product.title}
            fill
            className="object-cover"
          />
          {product.quantity <= 5 && product.quantity > 0 && (
            <span className="absolute top-2 right-2 bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-medium">
              Only {product.quantity} left!
            </span>
          )}
          {product.quantity === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-red-500 text-white px-3 py-1 rounded-full font-medium">
                Sold Out
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Actions */}
      <div className="flex items-center gap-4 px-3 py-2 border-b border-gray-50">
        <button
          onClick={onLike}
          className={`flex items-center gap-1 text-sm ${
            product.isLiked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
          }`}
        >
          <Heart className={`w-5 h-5 ${product.isLiked ? 'fill-current' : ''}`} />
          <span>{product.likesCount}</span>
        </button>
        <Link href={`/products/${product.id}#comments`} className="flex items-center gap-1 text-sm text-gray-600 hover:text-green-600">
          <MessageCircle className="w-5 h-5" />
          <span>{product.commentsCount}</span>
        </Link>
        <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-green-600">
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-3">
        <Link href={`/products/${product.id}`}>
          <h3 className="font-semibold text-gray-900 truncate hover:text-green-600">
            {product.title}
          </h3>
        </Link>
        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
          {product.description}
        </p>
        <div className="flex items-center justify-between mt-3">
          <div>
            <span className="text-lg font-bold text-green-600">
              {formatPrice(price)}
            </span>
            <span className="text-sm text-gray-500 ml-1">/ {product.unit}</span>
          </div>
          <Button
            size="sm"
            onClick={onAddToCart}
            disabled={product.quantity === 0}
          >
            Add to Cart
          </Button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Category: {product.category.name}
        </p>
      </div>
    </div>
  )
}
