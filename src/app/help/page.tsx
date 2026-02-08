import Link from 'next/link'
import { HelpCircle, MessageCircle, Phone, Mail, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function HelpPage() {
  const topics = [
    {
      title: 'Getting Started',
      description: 'Learn how to browse, buy, and sell on AgriLink',
      items: [
        { q: 'How do I create an account?', link: '/faq#create-account' },
        { q: 'How do I find products near me?', link: '/faq#find-products' },
        { q: 'How do I place an order?', link: '/faq#place-order' },
      ],
    },
    {
      title: 'Buying on AgriLink',
      description: 'Questions about ordering and payments',
      items: [
        { q: 'What payment methods are accepted?', link: '/faq#payment-methods' },
        { q: 'How does delivery work?', link: '/faq#delivery' },
        { q: 'Can I cancel my order?', link: '/faq#cancel-order' },
      ],
    },
    {
      title: 'Selling on AgriLink',
      description: 'For farmers wanting to sell their produce',
      items: [
        { q: 'How do I become a seller?', link: '/faq#become-seller' },
        { q: 'What are the subscription plans?', link: '/subscription' },
        { q: 'How do I receive payments?', link: '/faq#seller-payments' },
      ],
    },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <HelpCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Help Center</h1>
        <p className="text-gray-600">Find answers to common questions or contact our support team</p>
      </div>

      {/* Search */}
      <div className="relative mb-12">
        <input
          type="text"
          placeholder="Search for help..."
          className="w-full px-6 py-4 border border-gray-300 rounded-xl text-lg focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none"
        />
      </div>

      {/* Topics */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {topics.map((topic) => (
          <div key={topic.title} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-2">{topic.title}</h2>
            <p className="text-sm text-gray-500 mb-4">{topic.description}</p>
            <ul className="space-y-2">
              {topic.items.map((item) => (
                <li key={item.q}>
                  <Link 
                    href={item.link}
                    className="flex items-center text-sm text-green-600 hover:text-green-700"
                  >
                    <ChevronRight className="w-4 h-4 mr-1" />
                    {item.q}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Contact */}
      <div className="bg-green-50 rounded-xl p-8 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Still need help?</h2>
        <p className="text-gray-600 mb-6">Our support team is available 24/7</p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/messages">
            <Button>
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat with Us
            </Button>
          </Link>
          <Button variant="outline">
            <Phone className="w-4 h-4 mr-2" />
            1800-123-4567
          </Button>
          <Button variant="outline">
            <Mail className="w-4 h-4 mr-2" />
            support@agrilink.com
          </Button>
        </div>
      </div>
    </div>
  )
}
