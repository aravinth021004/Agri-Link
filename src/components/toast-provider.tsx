'use client'

import * as React from 'react'
import { Toast } from '@/components/ui/toast'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

export function useGlobalToast() {
  const ctx = React.useContext(ToastContext)
  if (!ctx) throw new Error('useGlobalToast must be used within ToastProvider')
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = React.useState({
    message: '',
    type: 'info' as ToastType,
    isVisible: false,
  })

  const showToast = React.useCallback((message: string, type: ToastType = 'info') => {
    setToast({ message, type, isVisible: true })
  }, [])

  const hideToast = React.useCallback(() => {
    setToast(prev => ({ ...prev, isVisible: false }))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={hideToast} />
    </ToastContext.Provider>
  )
}
