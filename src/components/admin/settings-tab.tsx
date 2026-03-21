'use client'

import { useState, useEffect } from 'react'
import { Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useGlobalToast } from '@/components/toast-provider'

interface Settings {
  upiId: string
  upiName: string
}

export function SettingsTab() {
  const [settings, setSettings] = useState<Settings>({ upiId: '', upiName: '' })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { showToast } = useGlobalToast()

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings')
        const data = await res.json()
        if (data.settings) {
          setSettings({
            upiId: data.settings.upiId || '',
            upiName: data.settings.upiName || ''
          })
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error)
        showToast('Failed to load platform settings', 'error')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchSettings()
  }, [showToast])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      
      const data = await res.json()
      
      if (res.ok) {
        showToast('Settings saved successfully', 'success')
      } else {
        showToast(data.error || 'Failed to save settings', 'error')
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      showToast('An error occurred while saving', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-4">Platform Settings</h2>
        
        <form onSubmit={handleSave} className="max-w-2xl space-y-6">
          <div className="bg-gray-50 border border-gray-100 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-4">Payment Configuration</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="upiId" className="block text-sm font-medium text-gray-700 mb-1">
                  Platform UPI ID
                </label>
                <Input
                  id="upiId"
                  value={settings.upiId}
                  onChange={(e) => setSettings({ ...settings, upiId: e.target.value })}
                  placeholder="e.g. yourbusiness@upi"
                  required
                  pattern="^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$"
                  title="Please enter a valid UPI ID (e.g., name@bank)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This UPI ID will be used to generate QR codes for farmer subscription payments.
                </p>
              </div>

              <div>
                <label htmlFor="upiName" className="block text-sm font-medium text-gray-700 mb-1">
                  Platform UPI Name (Payee Name)
                </label>
                <Input
                  id="upiName"
                  value={settings.upiName}
                  onChange={(e) => setSettings({ ...settings, upiName: e.target.value })}
                  placeholder="e.g. AgriLink Official"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  The business name shown to users when they scan the QR code.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button
              type="submit"
              disabled={isSaving || !settings.upiId || !settings.upiName}
              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
