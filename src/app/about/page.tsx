import Image from 'next/image'
import Link from 'next/link'
import { Users, Leaf, TrendingUp, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'

export default function AboutPage() {
  const t = useTranslations('about')

  const stats = [
    { label: t('farmers'), value: '5,000+' },
    { label: t('products'), value: '50,000+' },
    { label: t('happyCustomers'), value: '100,000+' },
    { label: t('cities'), value: '50+' },
  ]

  const values = [
    {
      icon: Users,
      title: t('directConnectionTitle'),
      description: t('directConnectionDesc'),
    },
    {
      icon: Leaf,
      title: t('sustainabilityTitle'),
      description: t('sustainabilityDesc'),
    },
    {
      icon: TrendingUp,
      title: t('farmerEmpowermentTitle'),
      description: t('farmerEmpowermentDesc'),
    },
    {
      icon: Heart,
      title: t('communityFirstTitle'),
      description: t('communityFirstDesc'),
    },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero */}
      <section className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {t('heroTitle')} <span className="text-green-600">{t('heroHighlight')}</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          {t('heroDescription')}
        </p>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center p-6 bg-green-50 rounded-xl">
            <p className="text-3xl font-bold text-green-600">{stat.value}</p>
            <p className="text-gray-600">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* Story */}
      <section className="grid md:grid-cols-2 gap-12 items-center mb-16">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('ourStory')}</h2>
          <p className="text-gray-600 mb-4">
            {t('storyP1')}
          </p>
          <p className="text-gray-600 mb-4">
            {t('storyP2')}
          </p>
          <p className="text-gray-600">
            {t('storyP3')}
          </p>
        </div>
        <div className="relative h-80 rounded-xl overflow-hidden bg-green-100">
          <div className="absolute inset-0 flex items-center justify-center text-6xl">
            🌾
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">{t('ourValues')}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((value) => (
            <div key={value.title} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <value.icon className="w-12 h-12 text-green-600 mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">{value.title}</h3>
              <p className="text-gray-600 text-sm">{value.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center bg-gradient-to-r from-green-600 to-green-500 rounded-2xl p-12 text-white">
        <h2 className="text-3xl font-bold mb-4">{t('ctaTitle')}</h2>
        <p className="text-green-100 mb-8 max-w-xl mx-auto">
          {t('ctaDescription')}
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/signup">
            <Button variant="outline" className="bg-white text-green-600 border-white hover:bg-green-50">
              {t('startShopping')}
            </Button>
          </Link>
          <Link href="/subscription">
            <Button className="bg-green-700 border-green-700 hover:bg-green-800">
              {t('becomeSeller')}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
