'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface FAQItem {
  id: string
  question: string
  answer: string
}

const faqs: { category: string; items: FAQItem[] }[] = [
  {
    category: 'Getting Started',
    items: [
      {
        id: 'create-account',
        question: 'How do I create an account?',
        answer: 'Click on "Sign Up" and enter your email or phone number. You will receive an OTP for verification. Once verified, set up your profile and you\'re ready to go!',
      },
      {
        id: 'find-products',
        question: 'How do I find products near me?',
        answer: 'Use the Search page and filter by location. You can also browse the Feed which shows products from farmers in your area. Each product listing shows the farmer\'s location.',
      },
      {
        id: 'place-order',
        question: 'How do I place an order?',
        answer: 'Browse products, add items to your cart, and proceed to checkout. Choose your delivery option (home delivery, farm pickup, or meetup point), enter your address if needed, and complete the payment.',
      },
    ],
  },
  {
    category: 'Payments & Orders',
    items: [
      {
        id: 'payment-methods',
        question: 'What payment methods are accepted?',
        answer: 'We accept UPI, credit/debit cards, net banking, and digital wallets through our secure Razorpay payment gateway. Cash on delivery is available for select areas.',
      },
      {
        id: 'delivery',
        question: 'How does delivery work?',
        answer: 'Farmers offer different delivery options: Home Delivery (to your doorstep), Farm Pickup (collect from the farm), or Meetup Point (a designated location). Delivery fees and radius vary by farmer.',
      },
      {
        id: 'cancel-order',
        question: 'Can I cancel my order?',
        answer: 'You can cancel an order before it\'s confirmed by the farmer. Once confirmed, contact the farmer directly through messages to request cancellation. Refunds are processed within 5-7 business days.',
      },
    ],
  },
  {
    category: 'Selling on AgriLink',
    items: [
      {
        id: 'become-seller',
        question: 'How do I become a seller?',
        answer: 'Sign up as a regular user, then subscribe to one of our farmer plans. Once subscribed, you can add products, manage orders, and start selling directly to consumers.',
      },
      {
        id: 'seller-payments',
        question: 'How do I receive payments as a seller?',
        answer: 'Payments are credited to your registered bank account within 2-3 business days after order delivery. You can track all transactions in your Farmer Dashboard.',
      },
      {
        id: 'product-listing',
        question: 'How do I list my products?',
        answer: 'Go to your Dashboard, click "Add Product", upload photos, fill in details like price, quantity, and description, set delivery options, and publish. Your product will be visible to all users.',
      },
    ],
  },
]

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<string[]>(['create-account'])

  const toggleItem = (id: string) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Frequently Asked Questions</h1>
        <p className="text-gray-600">Quick answers to common questions</p>
      </div>

      <div className="space-y-8">
        {faqs.map((section) => (
          <div key={section.category}>
            <h2 className="text-lg font-bold text-gray-900 mb-4">{section.category}</h2>
            <div className="space-y-3">
              {section.items.map((item) => (
                <div
                  key={item.id}
                  id={item.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  <button
                    onClick={() => toggleItem(item.id)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition"
                  >
                    <span className="font-medium text-gray-900">{item.question}</span>
                    {openItems.includes(item.id) ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  {openItems.includes(item.id) && (
                    <div className="px-4 pb-4">
                      <p className="text-gray-600">{item.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
