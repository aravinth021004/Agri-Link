'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { Eye, EyeOff, ArrowLeft, Mail, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useGlobalToast } from '@/components/toast-provider'

const requestOtpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

const resetPasswordSchema = z.object({
  token: z.string().length(6, 'OTP must be exactly 6 digits'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type RequestOtpForm = z.infer<typeof requestOtpSchema>
type ResetPasswordForm = z.infer<typeof resetPasswordSchema>

export default function ForgotPasswordPage() {
  const t = useTranslations('auth')
  const router = useRouter()
  const { showToast } = useGlobalToast()
  
  const [step, setStep] = useState<'request' | 'verify'>('request')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Form for requesting OTP
  const { 
    register: registerRequest, 
    handleSubmit: handleRequestSubmit, 
    formState: { errors: requestErrors } 
  } = useForm<RequestOtpForm>({
    resolver: zodResolver(requestOtpSchema),
  })

  // Form for submitting new password
  const { 
    register: registerReset, 
    handleSubmit: handleResetSubmit, 
    formState: { errors: resetErrors } 
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const onRequestOtp = async (data: RequestOtpForm) => {
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      const resData = await res.json()
      
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to send reset link')
      }

      showToast('OTP sent successfully to your email', 'success')
      setStep('verify')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const onResetPassword = async (data: ResetPasswordForm) => {
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: data.token,
          password: data.password,
        }),
      })
      
      const resData = await res.json()
      
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to reset password')
      }

      showToast(t('resetSuccess') || 'Password reset successfully. You can now log in.', 'success')
      router.push('/login')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <Image
              src="/logo.png"
              alt="AgriLink"
              width={80}
              height={80}
              className="mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold text-gray-900">
              {step === 'request' ? (t('forgotPasswordTitle') || 'Reset your password') : t('resetPassword')}
            </h1>
            <p className="text-gray-600 mt-2">
              {step === 'request' 
                ? (t('forgotPasswordSubtitle') || "Enter your email address and we'll send you an OTP to reset your password")
                : "Enter the 6-digit code sent to your email and your new password"}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-6">
              {error}
            </div>
          )}

          {step === 'request' && (
            <form onSubmit={handleRequestSubmit(onRequestOtp)} className="space-y-6">
              <Input
                label={t('email')}
                placeholder={t('email')}
                {...registerRequest('email')}
                error={requestErrors.email?.message}
              />

              <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                {isLoading ? 'Sending...' : t('sendResetLink')}
              </Button>
            </form>
          )}

          {step === 'verify' && (
            <form onSubmit={handleResetSubmit(onResetPassword)} className="space-y-6">
              <Input
                label="OTP Code"
                placeholder={t('otpPlaceholder')}
                maxLength={6}
                {...registerReset('token')}
                error={resetErrors.token?.message}
                className="font-mono tracking-widest text-center"
              />

              <div className="relative">
                <Input
                  label={t('newPassword') || 'New Password'}
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('newPassword') || 'New Password'}
                  {...registerReset('password')}
                  error={resetErrors.password?.message}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <div className="relative">
                <Input
                  label={t('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder={t('confirmPassword')}
                  {...registerReset('confirmPassword')}
                  error={resetErrors.confirmPassword?.message}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                {isLoading ? 'Resetting...' : (t('setNewPassword') || 'Set New Password')}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link 
              href="/login" 
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-green-600 transition font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('backToLogin')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
