'use client'

import { useState } from 'react'
import { Flag, X, Loader2 } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'

interface ReportButtonProps {
  type: 'product' | 'user' | 'comment'
  targetId: string
}

const reportReasons = {
  product: [
    'Misleading description',
    'Fake product',
    'Inappropriate content',
    'Spam or scam',
    'Overpricing',
    'Other',
  ],
  user: [
    'Spam or fake account',
    'Harassment',
    'Fraud or scam',
    'Inappropriate content',
    'Other',
  ],
  comment: [
    'Spam',
    'Harassment',
    'Inappropriate language',
    'Misleading information',
    'Other',
  ],
}

export function ReportButton({ type, targetId }: ReportButtonProps) {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedReason, setSelectedReason] = useState('')
  const [details, setDetails] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async () => {
    if (!selectedReason) return
    
    setIsSubmitting(true)
    try {
      // In production, this would call an API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000))
      console.log('Report submitted:', { type, targetId, reason: selectedReason, details })
      setIsSubmitted(true)
      setTimeout(() => {
        setIsOpen(false)
        setIsSubmitted(false)
        setSelectedReason('')
        setDetails('')
      }, 2000)
    } catch (error) {
      console.error('Failed to submit report:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!session) return null

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1 text-sm text-gray-400 hover:text-red-500 transition"
      >
        <Flag className="w-4 h-4" />
        Report
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => !isSubmitting && setIsOpen(false)}
          />
          
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Report {type}</h2>
              <button
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isSubmitted ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Flag className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Report Submitted</h3>
                <p className="text-gray-500">Thank you for helping keep AgriLink safe.</p>
              </div>
            ) : (
              <div className="p-4">
                <p className="text-sm text-gray-500 mb-4">
                  Why are you reporting this {type}?
                </p>
                
                <div className="space-y-2 mb-4">
                  {reportReasons[type].map((reason) => (
                    <label
                      key={reason}
                      className={`flex items-center p-3 rounded-lg border cursor-pointer transition ${
                        selectedReason === reason
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={reason}
                        checked={selectedReason === reason}
                        onChange={(e) => setSelectedReason(e.target.value)}
                        className="sr-only"
                      />
                      <span className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                        selectedReason === reason
                          ? 'border-green-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedReason === reason && (
                          <span className="w-2 h-2 bg-green-500 rounded-full" />
                        )}
                      </span>
                      <span className="text-gray-700">{reason}</span>
                    </label>
                  ))}
                </div>

                {selectedReason && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Additional details (optional)
                    </label>
                    <textarea
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      placeholder="Provide more context..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                    />
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!selectedReason || isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Submit Report'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
