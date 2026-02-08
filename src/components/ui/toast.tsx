'use client'

import * as React from "react"
import { cn } from "@/lib/utils"

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info' | 'warning'
  isVisible: boolean
  onClose: () => void
}

export function Toast({ message, type = 'info', isVisible, onClose }: ToastProps) {
  React.useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 3000)
      return () => clearTimeout(timer)
    }
  }, [isVisible, onClose])

  if (!isVisible) return null

  const typeStyles = {
    success: 'bg-green-600 text-white',
    error: 'bg-red-600 text-white',
    warning: 'bg-yellow-500 text-white',
    info: 'bg-gray-800 text-white',
  }

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-slideUp">
      <div className={cn(
        "px-4 py-3 rounded-lg shadow-lg flex items-center gap-2",
        typeStyles[type]
      )}>
        <span>{message}</span>
        <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
          ×
        </button>
      </div>
    </div>
  )
}

// Toast hook for easy usage
interface ToastState {
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  isVisible: boolean
}

export function useToast() {
  const [toast, setToast] = React.useState<ToastState>({
    message: '',
    type: 'info',
    isVisible: false,
  })

  const showToast = React.useCallback((message: string, type: ToastState['type'] = 'info') => {
    setToast({ message, type, isVisible: true })
  }, [])

  const hideToast = React.useCallback(() => {
    setToast(prev => ({ ...prev, isVisible: false }))
  }, [])

  const ToastComponent = () => (
    <Toast {...toast} onClose={hideToast} />
  )

  return { showToast, ToastComponent }
}
