'use client'

import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="w-12 h-12 animate-spin text-green-600" />
      <p className="text-gray-500 animate-pulse">Loading...</p>
    </div>
  )
}
