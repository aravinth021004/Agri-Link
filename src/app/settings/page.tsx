'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Settings, Bell, Languages, LogOut, Loader2, ChevronRight, Save, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useLocale } from '@/hooks/use-locale'
import { type Locale } from '@/i18n/config'
import { useGlobalToast } from '@/components/toast-provider'

export default function SettingsPage() {
  const t = useTranslations('settings')
  const { data: session, status } = useSession()
  const router = useRouter()
  const { showToast } = useGlobalToast()
  const { locales, localeNames, setLocale, getLocale } = useLocale()
  
  const [currentLocale, setCurrentLocale] = useState<Locale>('en')
  const [settings, setSettings] = useState({
    notifications: true,
    emailNotifications: true,
    smsNotifications: false,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [logoutConfirm, setLogoutConfirm] = useState(false)

  useEffect(() => {
    setCurrentLocale(getLocale())
    setIsLoading(false)
  }, [getLocale])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  const handleLanguageChange = (newLocale: Locale) => {
    setCurrentLocale(newLocale)
    setLocale(newLocale)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: currentLocale }),
      })
      showToast(t('settingsSaved'), 'success')
    } catch (error) {
      console.error('Failed to save settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = async () => {
    setLogoutConfirm(false)
    await signOut({ callbackUrl: '/' })
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <ConfirmDialog
        isOpen={logoutConfirm}
        onClose={() => setLogoutConfirm(false)}
        onConfirm={handleLogout}
        title={t('logout')}
        message={t('logoutConfirm')}
        confirmLabel={t('logout')}
        variant="danger"
      />

      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('title')}</h1>

      <div className="space-y-6">
        {/* Language */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Languages className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{t('language')}</h2>
              <p className="text-sm text-gray-500">{t('selectLanguage')}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {locales.map((locale) => (
              <button
                key={locale}
                onClick={() => handleLanguageChange(locale)}
                className={`p-3 rounded-lg border-2 text-center transition ${
                  currentLocale === locale
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="font-medium">{localeNames[locale]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Bell className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{t('notifications')}</h2>
              <p className="text-sm text-gray-500">{t('notificationPrefs')}</p>
            </div>
          </div>
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-700">{t('pushNotifications')}</span>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, notifications: !settings.notifications })}
                className={`relative w-12 h-6 rounded-full transition ${
                  settings.notifications ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition ${
                  settings.notifications ? 'left-7' : 'left-1'
                }`} />
              </button>
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-700">{t('emailNotifications')}</span>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, emailNotifications: !settings.emailNotifications })}
                className={`relative w-12 h-6 rounded-full transition ${
                  settings.emailNotifications ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition ${
                  settings.emailNotifications ? 'left-7' : 'left-1'
                }`} />
              </button>
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-700">{t('smsNotifications')}</span>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, smsNotifications: !settings.smsNotifications })}
                className={`relative w-12 h-6 rounded-full transition ${
                  settings.smsNotifications ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition ${
                  settings.smsNotifications ? 'left-7' : 'left-1'
                }`} />
              </button>
            </label>
          </div>
        </div>

        {/* Account Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => router.push('/profile')}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition"
          >
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-gray-400" />
              <span className="text-gray-700">{t('editProfile')}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
          <button
            onClick={() => router.push('/change-password')}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition border-t border-gray-100"
          >
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-gray-400" />
              <span className="text-gray-700">{t('changePassword')}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
          <button
            onClick={() => setLogoutConfirm(true)}
            className="w-full flex items-center justify-between p-4 hover:bg-red-50 transition border-t border-gray-100"
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-5 h-5 text-red-500" />
              <span className="text-red-500">{t('logout')}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Save Button */}
        <Button onClick={handleSave} isLoading={isSaving} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          {t('saveSettings')}
        </Button>

        {/* App Info */}
        <div className="text-center text-sm text-gray-400 pt-4">
          <p>AgriLink v1.0.0</p>
          <p className="mt-1">Farm Fresh, Delivered Direct</p>
        </div>
      </div>
    </div>
  )
}
