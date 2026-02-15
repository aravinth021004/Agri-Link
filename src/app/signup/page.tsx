'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { Eye, EyeOff, CheckCircle, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const signupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^(\+91)?[6-9]\d{9}$/, 'Invalid phone number'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type SignupForm = z.infer<typeof signupSchema>

export default function SignupPage() {
  const t = useTranslations('auth')
  const tErrors = useTranslations('errors')
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<'signup' | 'verify'>('signup')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState('')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [totpSecret, setTotpSecret] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          phone: data.phone,
          password: data.password,
          fullName: data.fullName,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Signup failed')
        return
      }

      setEmail(data.email)
      setQrCodeUrl(result.qrCodeUrl)
      setTotpSecret(result.totpSecret)
      setStep('verify')
    } catch {
      setError(tErrors('somethingWrong'))
    } finally {
      setIsLoading(false)
    }
  }

  const verifyOtp = async () => {
    setIsLoading(true)
    setOtpError('')

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code: otp,
          purpose: 'VERIFY_EMAIL',
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setOtpError(result.error || 'Invalid code')
        return
      }

      router.push('/login?verified=true')
    } catch {
      setOtpError(tErrors('somethingWrong'))
    } finally {
      setIsLoading(false)
    }
  }

  if (step === 'verify') {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{t('otpTitle')}</h1>
              <p className="text-gray-600 mt-2">
                Scan this QR code with Google Authenticator
              </p>
            </div>

            {otpError && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
                {otpError}
              </div>
            )}

            <div className="space-y-4">
              {/* QR Code */}
              {qrCodeUrl && (
                <div className="flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrCodeUrl}
                    alt="Scan with Google Authenticator"
                    width={200}
                    height={200}
                    className="rounded-lg border border-gray-200"
                  />
                </div>
              )}

              {/* Manual secret */}
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <p className="text-xs text-gray-500 mb-1">
                  Or enter this key manually:
                </p>
                <code className="text-sm font-mono text-gray-800 break-all select-all">
                  {totpSecret}
                </code>
              </div>

              <Input
                label="Authenticator Code"
                placeholder={t('otpPlaceholder')}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
              />

              <Button onClick={verifyOtp} className="w-full" size="lg" isLoading={isLoading}>
                {isLoading ? t('verifying') : t('otpTitle')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
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
            <h1 className="text-2xl font-bold text-gray-900">{t('signupTitle')}</h1>
            <p className="text-gray-600 mt-2">{t('signupSubtitle')}</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label={t('fullName')}
              placeholder={t('fullName')}
              {...register('fullName')}
              error={errors.fullName?.message}
            />

            <Input
              label={t('email')}
              type="email"
              placeholder={t('email')}
              {...register('email')}
              error={errors.email?.message}
            />

            <Input
              label={t('phone')}
              placeholder={t('phone')}
              {...register('phone')}
              error={errors.phone?.message}
            />

            <div className="relative">
              <Input
                label={t('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder={t('password')}
                {...register('password')}
                error={errors.password?.message}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <Input
              label={t('confirmPassword')}
              type="password"
              placeholder={t('confirmPassword')}
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
            />

            <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
              {isLoading ? t('signingUp') : t('signupTitle')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {t('hasAccount')}{' '}
              <Link href="/login" className="text-green-600 hover:text-green-700 font-medium">
                {t('loginTitle')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
