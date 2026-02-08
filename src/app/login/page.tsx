'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const loginSchema = z.object({
  emailOrPhone: z.string().min(1, 'Email or phone is required'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const t = useTranslations('auth')
  const tErrors = useTranslations('errors')
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        emailOrPhone: data.emailOrPhone,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        setError(t('invalidCredentials'))
      } else {
        router.push('/feed')
        router.refresh()
      }
    } catch {
      setError(tErrors('somethingWrong'))
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
            <h1 className="text-2xl font-bold text-gray-900">{t('loginTitle')}</h1>
            <p className="text-gray-600 mt-2">{t('loginSubtitle')}</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label={t('email')}
              placeholder={t('email')}
              {...register('emailOrPhone')}
              error={errors.emailOrPhone?.message}
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

            <div className="flex items-center justify-end">
              <Link href="/forgot-password" className="text-sm text-green-600 hover:text-green-700">
                {t('forgotPassword')}
              </Link>
            </div>

            <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
              {isLoading ? t('signingIn') : t('loginTitle')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {t('noAccount')}{' '}
              <Link href="/signup" className="text-green-600 hover:text-green-700 font-medium">
                {t('signupTitle')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
