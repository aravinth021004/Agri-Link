'use client'

import { useState, useEffect, useCallback } from 'react'
import { Package, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useGlobalToast } from '@/components/toast-provider'

interface Subscription {
  id: string
  userId: string
  planId: string
  amount: number
  status: string
  upiRefId: string | null
  createdAt: string
  startDate: string | null
  endDate: string | null
  user: {
    email: string
    fullName: string
  }
}

export function ApprovalsTab() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { showToast } = useGlobalToast()

  const fetchSubscriptions = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/subscriptions')
      const data = await res.json()
      // Only keep PENDING subscriptions for approvals tab
      const pending = (data.subscriptions || []).filter((sub: Subscription) => sub.status === 'PENDING')
      setSubscriptions(pending)
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error)
      showToast('Failed to load pending approvals', 'error')
    } finally {
      setIsLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    fetchSubscriptions()
  }, [fetchSubscriptions])

  const handleApproval = async (id: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch(`/api/admin/subscriptions/${id}/${action}`, {
        method: 'POST',
      })
      if (res.ok) {
        showToast(`Subscription ${action}d successfully`, 'success')
        fetchSubscriptions()
      } else {
        const data = await res.json()
        showToast(data.error || `Failed to ${action} subscription`, 'error')
      }
    } catch (error) {
      console.error(`Failed to ${action} subscription:`, error)
      showToast(`An error occurred while trying to ${action}`, 'error')
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
        <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-4">Pending Approvals</h2>
        <div className="space-y-4">
          {subscriptions.length > 0 ? (
            subscriptions.map((sub) => (
              <div key={sub.id} className="p-5 border border-gray-200 rounded-xl hover:border-green-200 transition bg-gray-50/50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900">{sub.user.fullName}</p>
                      <span className="px-2.5 py-0.5 text-xs rounded-full font-medium bg-yellow-100 text-yellow-800">
                        {sub.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{sub.user.email}</p>
                    <div className="text-sm text-gray-500 flex flex-wrap gap-x-4 gap-y-1 mt-2">
                       <p>Plan: <span className="font-medium text-gray-700">{sub.planId.replace('farmer_', '').toUpperCase()}</span></p>
                       <p>Amount: <span className="font-medium text-gray-700">₹{sub.amount}</span></p>
                       <p>UPI Ref: <span className="font-mono text-gray-700 font-medium">{sub.upiRefId}</span></p>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Requested on: {formatDate(sub.createdAt)}</p>
                  </div>
                  
                  <div className="flex items-center gap-3 md:flex-col md:items-end">
                    <Button
                      onClick={() => handleApproval(sub.id, 'approve')}
                      className="w-full md:w-32 bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleApproval(sub.id, 'reject')}
                      className="w-full md:w-32 text-red-600 border-red-200 hover:bg-red-50 flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No pending approvals</p>
              <p className="text-sm text-gray-400 mt-1">All subscription requests have been resolved.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
