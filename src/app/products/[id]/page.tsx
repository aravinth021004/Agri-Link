'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Heart, MessageCircle, Share2, MapPin, ShoppingCart, ChevronLeft, ChevronRight, Send, Loader2 } from 'lucide-react'
import { formatPrice, formatRelativeTime } from '@/lib/utils'
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
  deliveryOptions: string[]
  deliveryFee: number
  deliveryRadius: number
  farmer: {
    id: string
    fullName: string
    profileImage: string | null
    location: string | null
    bio: string | null
  }
  category: {
    name: string
  }
}

interface Comment {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    fullName: string
    profileImage: string | null
  }
  replies: Comment[]
}

export default function ProductDetailPage() {
  const params = useParams()
  const { data: session } = useSession()
  const { showToast } = useGlobalToast()
  const [product, setProduct] = useState<Product | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentImage, setCurrentImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [deliveryOption, setDeliveryOption] = useState('HOME_DELIVERY')
  const [newComment, setNewComment] = useState('')
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)

  useEffect(() => {
    fetchProduct()
    fetchComments()
  }, [params.id])

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${params.id}`)
      const data = await response.json()
      setProduct(data)
      if (data.deliveryOptions?.length) {
        setDeliveryOption(data.deliveryOptions[0])
      }
    } catch (error) {
      console.error('Failed to fetch product:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/interactions/comment?productId=${params.id}`)
      const data = await response.json()
      setComments(data.comments || [])
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    }
  }

  const handleLike = async () => {
    if (!session) {
      window.location.href = '/login'
      return
    }
    try {
      const response = await fetch(`/api/interactions/like/${params.id}`, { method: 'POST' })
      const data = await response.json()
      setProduct(prev => prev ? { ...prev, isLiked: data.liked, likesCount: data.likesCount } : null)
    } catch (error) {
      console.error('Failed to like:', error)
    }
  }

  const handleAddToCart = async () => {
    if (!session) {
      window.location.href = '/login'
      return
    }
    setIsAddingToCart(true)
    try {
      await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: params.id,
          quantity,
          deliveryOption,
        }),
      })
      showToast('Added to cart!', 'success')
    } catch (error) {
      console.error('Failed to add to cart:', error)
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session || !newComment.trim()) return
    
    setIsSubmittingComment(true)
    try {
      await fetch('/api/interactions/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: params.id,
          content: newComment,
        }),
      })
      setNewComment('')
      fetchComments()
    } catch (error) {
      console.error('Failed to add comment:', error)
    } finally {
      setIsSubmittingComment(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Product not found</h1>
        <Link href="/feed" className="text-green-600 hover:underline mt-4 inline-block">
          Back to Feed
        </Link>
      </div>
    )
  }

  const images = product.mediaUrls?.length ? product.mediaUrls : ['/placeholder.jpg']
  const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden">
            <Image
              src={images[currentImage]}
              alt={product.title}
              fill
              className="object-cover"
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImage(prev => prev === 0 ? images.length - 1 : prev - 1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center hover:bg-white"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() => setCurrentImage(prev => prev === images.length - 1 ? 0 : prev + 1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center hover:bg-white"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImage(idx)}
                  className={`relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 ${
                    currentImage === idx ? 'border-green-500' : 'border-transparent'
                  }`}
                >
                  <Image src={img} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <span className="text-sm text-green-600 font-medium">{product.category.name}</span>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">{product.title}</h1>
          </div>

          {/* Farmer Info */}
          <Link href={`/farmers/${product.farmer.id}`} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-green-100">
              {product.farmer.profileImage ? (
                <Image src={product.farmer.profileImage} alt={product.farmer.fullName} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-green-600 font-bold text-lg">
                  {product.farmer.fullName.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{product.farmer.fullName}</p>
              {product.farmer.location && (
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {product.farmer.location}
                </p>
              )}
            </div>
          </Link>

          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-green-600">{formatPrice(price)}</span>
            <span className="text-gray-500">/ {product.unit}</span>
          </div>

          {/* Description */}
          <p className="text-gray-600 leading-relaxed">{product.description}</p>

          {/* Stock */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Available:</span>
            <span className={`font-medium ${product.quantity > 5 ? 'text-green-600' : 'text-yellow-600'}`}>
              {product.quantity} {product.unit}
            </span>
          </div>

          {/* Delivery Options */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Delivery Option</label>
            <div className="flex flex-wrap gap-2">
              {(product.deliveryOptions || ['HOME_DELIVERY']).map((option: string) => (
                <button
                  key={option}
                  onClick={() => setDeliveryOption(option)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    deliveryOption === option
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
            {product.deliveryFee && (
              <p className="text-sm text-gray-500">Delivery fee: {formatPrice(product.deliveryFee)}</p>
            )}
          </div>

          {/* Quantity & Add to Cart */}
          <div className="flex items-center gap-4">
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-4 py-2 text-gray-600 hover:bg-gray-50"
              >
                -
              </button>
              <span className="px-4 py-2 font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                className="px-4 py-2 text-gray-600 hover:bg-gray-50"
              >
                +
              </button>
            </div>
            <Button
              size="lg"
              className="flex-1"
              onClick={handleAddToCart}
              isLoading={isAddingToCart}
              disabled={product.quantity === 0}
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Add to Cart
            </Button>
          </div>

          {/* Social Actions */}
          <div className="flex items-center gap-6 pt-4 border-t border-gray-100">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 ${product.isLiked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'}`}
            >
              <Heart className={`w-6 h-6 ${product.isLiked ? 'fill-current' : ''}`} />
              <span>{product.likesCount} likes</span>
            </button>
            <span className="flex items-center gap-2 text-gray-600">
              <MessageCircle className="w-6 h-6" />
              <span>{product.commentsCount} comments</span>
            </span>
            <button className="flex items-center gap-2 text-gray-600 hover:text-green-600">
              <Share2 className="w-6 h-6" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div id="comments" className="mt-12 border-t border-gray-200 pt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Comments ({comments.length})</h2>
        
        {/* Add Comment */}
        {session ? (
          <form onSubmit={handleSubmitComment} className="flex gap-3 mb-8">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-1 focus:ring-green-500"
            />
            <Button type="submit" isLoading={isSubmittingComment} disabled={!newComment.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        ) : (
          <div className="bg-gray-50 p-4 rounded-lg mb-8 text-center">
            <Link href="/login" className="text-green-600 hover:underline">Login</Link> to add a comment
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-6">
          {comments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No comments yet. Be the first to comment!</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-green-100 flex-shrink-0">
                  {comment.user.profileImage ? (
                    <Image src={comment.user.profileImage} alt="" width={40} height={40} className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-green-600 font-medium">
                      {comment.user.fullName.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="bg-gray-50 rounded-lg px-4 py-3">
                    <p className="font-medium text-sm text-gray-900">{comment.user.fullName}</p>
                    <p className="text-gray-700">{comment.content}</p>
                  </div>
                  <span className="text-xs text-gray-400 ml-4">{formatRelativeTime(comment.createdAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
