'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { MapPin, Users, Star, Package, MessageCircle, Loader2 } from 'lucide-react'
import { ProductCard } from '@/components/product-card'
import { Button } from '@/components/ui/button'
import { TranslateButton } from '@/components/translate-button'
import { useTranslations } from 'next-intl'

interface Farmer {
  id: string
  fullName: string
  profileImage: string | null
  bio: string | null
  location: string | null
  createdAt: string
  _count: {
    products: number
    followers: number
  }
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

export default function FarmerProfilePage() {
  const params = useParams()
  const { data: session } = useSession()
  const [farmer, setFarmer] = useState<Farmer | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [averageRating, setAverageRating] = useState<{ average: number; count: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isFollowLoading, setIsFollowLoading] = useState(false)
  const [translatedBio, setTranslatedBio] = useState<string | null>(null)
  const t = useTranslations('farmer')

  useEffect(() => {
    fetchFarmerData()
  }, [params.id])

  const fetchFarmerData = async () => {
    try {
      const [profileRes, productsRes, followRes] = await Promise.all([
        fetch(`/api/users/profile?userId=${params.id}`),
        fetch(`/api/products?farmerId=${params.id}&limit=12`),
        session ? fetch(`/api/interactions/follow/${params.id}`) : Promise.resolve(null),
      ])

      const profileData = await profileRes.json()
      const productsData = await productsRes.json()
      
      setFarmer(profileData.user)
      setAverageRating(profileData.averageRating)
      setProducts(productsData.products || [])
      
      if (followRes) {
        const followData = await followRes.json()
        setIsFollowing(followData.isFollowing)
      }
    } catch (error) {
      console.error('Failed to fetch farmer:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFollow = async () => {
    if (!session) {
      window.location.href = '/login'
      return
    }
    
    setIsFollowLoading(true)
    try {
      const response = await fetch(`/api/interactions/follow/${params.id}`, { method: 'POST' })
      const data = await response.json()
      setIsFollowing(data.following)
      if (farmer) {
        setFarmer({
          ...farmer,
          _count: {
            ...farmer._count,
            followers: data.followersCount,
          },
        })
      }
    } catch (error) {
      console.error('Failed to follow:', error)
    } finally {
      setIsFollowLoading(false)
    }
  }

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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    )
  }

  if (!farmer) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900">{t('farmerNotFound')}</h1>
        <Link href="/feed" className="text-green-600 hover:underline mt-4 inline-block">
          {t('backToFeed')}
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Farmer Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="h-32 bg-gradient-to-r from-green-600 to-green-400" />
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
            <div className="relative w-24 h-24 rounded-full overflow-hidden bg-white border-4 border-white shadow-lg">
              {farmer.profileImage ? (
                <Image src={farmer.profileImage} alt="" fill className="object-cover" />
              ) : (
                <div className="w-full h-full bg-green-100 flex items-center justify-center text-green-600 text-3xl font-bold">
                  {farmer.fullName.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-1 pt-4 sm:pt-0">
              <h1 className="text-2xl font-bold text-gray-900">{farmer.fullName}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                {farmer.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {farmer.location}
                  </span>
                )}
                {averageRating && averageRating.count > 0 && (
                  <span className="flex items-center gap-1 text-yellow-600">
                    <Star className="w-4 h-4 fill-current" />
                    {averageRating.average.toFixed(1)} ({averageRating.count} {t('ratings')})
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {session?.user?.id !== farmer.id && (
                <>
                  <Button
                    onClick={handleFollow}
                    isLoading={isFollowLoading}
                    variant={isFollowing ? 'outline' : 'default'}
                  >
                    {isFollowing ? t('following') : t('follow')}
                  </Button>
                  <Link href={`/messages?to=${farmer.id}`}>
                    <Button variant="outline">
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6 mt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{farmer._count.products}</p>
              <p className="text-sm text-gray-500">{t('products')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{farmer._count.followers}</p>
              <p className="text-sm text-gray-500">{t('followers')}</p>
            </div>
          </div>

          {/* Bio */}
          {farmer.bio && (
            <div className="mt-4">
              <p className="text-gray-600">{translatedBio ?? farmer.bio}</p>
              <TranslateButton
                texts={[farmer.bio]}
                onTranslated={([bio]) => setTranslatedBio(bio)}
                onShowOriginal={() => setTranslatedBio(null)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Products */}
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Package className="w-5 h-5 text-green-600" />
        {t('productsBy', { name: farmer.fullName })}
      </h2>

      {products.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{t('noProducts')}</p>
        </div>
      ) : (
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
      )}
    </div>
  )
}
