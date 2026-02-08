import Image from 'next/image'
import Link from 'next/link'
import { Users, Leaf, TrendingUp, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AboutPage() {
  const stats = [
    { label: 'Farmers', value: '5,000+' },
    { label: 'Products', value: '50,000+' },
    { label: 'Happy Customers', value: '100,000+' },
    { label: 'Cities', value: '50+' },
  ]

  const values = [
    {
      icon: Users,
      title: 'Direct Connection',
      description: 'We eliminate middlemen, ensuring farmers get fair prices and consumers get fresh produce.',
    },
    {
      icon: Leaf,
      title: 'Sustainability',
      description: 'Supporting local agriculture reduces carbon footprint and promotes sustainable farming.',
    },
    {
      icon: TrendingUp,
      title: 'Farmer Empowerment',
      description: 'We provide tools and reach to help farmers grow their business independently.',
    },
    {
      icon: Heart,
      title: 'Community First',
      description: 'Building lasting relationships between farmers and consumers through trust and quality.',
    },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero */}
      <section className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Connecting Farms to <span className="text-green-600">Families</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          AgriLink is on a mission to revolutionize how fresh produce reaches your table, directly from the farmers who grow it.
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
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Story</h2>
          <p className="text-gray-600 mb-4">
            AgriLink was born from a simple observation: farmers work incredibly hard to grow quality produce, yet receive only a fraction of the final price. Meanwhile, consumers pay premium prices for produce that travels through multiple middlemen, losing freshness along the way.
          </p>
          <p className="text-gray-600 mb-4">
            We built AgriLink to solve this problem. Our platform connects farmers directly with consumers, cutting out unnecessary intermediaries. Farmers set their own prices and keep more of their earnings. Consumers get fresher produce at better prices, knowing exactly where their food comes from.
          </p>
          <p className="text-gray-600">
            Today, thousands of farmers across India use AgriLink to reach customers they never could before, building sustainable businesses and feeding communities with fresh, local produce.
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
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Values</h2>
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
        <h2 className="text-3xl font-bold mb-4">Join the AgriLink Community</h2>
        <p className="text-green-100 mb-8 max-w-xl mx-auto">
          Whether you're a farmer looking to expand your reach or a consumer seeking fresh, local produce, we'd love to have you.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/signup">
            <Button variant="outline" className="bg-white text-green-600 border-white hover:bg-green-50">
              Start Shopping
            </Button>
          </Link>
          <Link href="/subscription">
            <Button className="bg-green-700 border-green-700 hover:bg-green-800">
              Become a Seller
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
