'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Camera, Edit2, MapPin, Mail, Phone, Calendar, Loader2, Save, Package, Users, Star, ShoppingBag, Settings } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface UserProfile {
  id: string
  email: string
  phone: string
  fullName: string
  role: string
  profileImage: string | null
  bio: string | null
  location: string | null
  language: string
  createdAt: string
  _count: {
    products: number
    followers: number
    following: number
    orders: number
  }
}

export default function ProfilePage() {
  const t = useTranslations('profile')
  const tNav = useTranslations('nav')
  const tCommon = useTranslations('common')
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [averageRating, setAverageRating] = useState<{ average: number; count: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editData, setEditData] = useState({
    fullName: '',
    bio: '',
    location: '',
  })

  const fetchProfile = useCallback(async () => {
    try {
      const response = await fetch('/api/users/profile')
      const data = await response.json()
      setProfile(data.user)
      setAverageRating(data.averageRating)
      setEditData({
        fullName: data.user.fullName,
        bio: data.user.bio || '',
        location: data.user.location || '',
      })
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchProfile()
    } else if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router, fetchProfile])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      })
      if (response.ok) {
        fetchProfile()
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    )
  }

  if (!profile) {
    return null
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="relative h-32 bg-gradient-to-r from-green-600 to-green-400">
          <div className="absolute -bottom-16 left-6">
            <div className="relative w-32 h-32 rounded-full overflow-hidden bg-white border-4 border-white shadow-lg">
              {profile.profileImage ? (
                <Image src={profile.profileImage} alt="" fill className="object-cover" />
              ) : (
                <div className="w-full h-full bg-green-100 flex items-center justify-center text-green-600 text-4xl font-bold">
                  {profile.fullName.charAt(0)}
                </div>
              )}
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center hover:bg-green-700">
                <Camera className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="pt-20 px-6 pb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              {isEditing ? (
                <Input
                  value={editData.fullName}
                  onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
                  className="text-2xl font-bold"
                />
              ) : (
                <h1 className="text-2xl font-bold text-gray-900">{profile.fullName}</h1>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  profile.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                  profile.role === 'FARMER' ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {profile.role}
                </span>
                {averageRating && averageRating.count > 0 && (
                  <span className="flex items-center gap-1 text-sm text-yellow-600">
                    <Star className="w-4 h-4 fill-current" />
                    {averageRating.average.toFixed(1)} ({averageRating.count})
                  </span>
                )}
              </div>
            </div>
            {isEditing ? (
              <div className="flex gap-2">
                <Button onClick={handleSave} isLoading={isSaving}>
                  <Save className="w-4 h-4 mr-1" />
                  {tCommon('save')}
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  {tCommon('cancel')}
                </Button>
              </div>
            ) : (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit2 className="w-4 h-4 mr-1" />
                {t('editProfile')}
              </Button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {profile.role === 'FARMER' && (
              <>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <Package className="w-6 h-6 text-green-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-gray-900">{profile._count.products}</p>
                  <p className="text-xs text-gray-500">{t('products')}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <Users className="w-6 h-6 text-green-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-gray-900">{profile._count.followers}</p>
                  <p className="text-xs text-gray-500">{t('followers')}</p>
                </div>
              </>
            )}
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <Users className="w-6 h-6 text-green-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-gray-900">{profile._count.following}</p>
              <p className="text-xs text-gray-500">{t('following')}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <ShoppingBag className="w-6 h-6 text-green-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-gray-900">{profile._count.orders}</p>
              <p className="text-xs text-gray-500">{t('orders')}</p>
            </div>
          </div>

          {/* Bio */}
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-700 mb-1 block">{t('bio')}</label>
            {isEditing ? (
              <textarea
                value={editData.bio}
                onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                placeholder={t('bio')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                rows={3}
              />
            ) : (
              <p className="text-gray-600">{profile.bio || t('bio')}</p>
            )}
          </div>

          {/* Contact Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-gray-600">
              <Mail className="w-5 h-5 text-gray-400" />
              <span>{profile.email}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <Phone className="w-5 h-5 text-gray-400" />
              <span>{profile.phone}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <MapPin className="w-5 h-5 text-gray-400" />
              {isEditing ? (
                <Input
                  value={editData.location}
                  onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                  placeholder={t('location')}
                  className="flex-1"
                />
              ) : (
                <span>{profile.location || t('location')}</span>
              )}
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <Calendar className="w-5 h-5 text-gray-400" />
              <span>{t('joined')} {formatDate(profile.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid sm:grid-cols-3 gap-4 mt-6">
        <Button variant="outline" onClick={() => router.push('/orders')} className="justify-start h-auto py-4">
          <ShoppingBag className="w-5 h-5 mr-3" />
          <div className="text-left">
            <p className="font-medium">{t('orders')}</p>
          </div>
        </Button>
        <Button variant="outline" onClick={() => router.push('/settings')} className="justify-start h-auto py-4">
          <Settings className="w-5 h-5 mr-3" />
          <div className="text-left">
            <p className="font-medium">{tNav('settings')}</p>
          </div>
        </Button>
        {profile.role === 'FARMER' && (
          <Button variant="outline" onClick={() => router.push('/dashboard')} className="justify-start h-auto py-4">
            <Package className="w-5 h-5 mr-3" />
            <div className="text-left">
              <p className="font-medium">{tNav('dashboard')}</p>
            </div>
          </Button>
        )}
      </div>
    </div>
  )
}
