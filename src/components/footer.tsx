'use client'

import Link from 'next/link'
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function Footer() {
  const t = useTranslations('footer')

  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 text-white">
              <span className="text-2xl">🌾</span>
              <span className="text-xl font-bold">AgriLink</span>
            </Link>
            <p className="mt-4 text-sm">
              Connecting farmers directly with consumers. Fresh produce, fair prices, sustainable farming.
            </p>
            <div className="flex gap-4 mt-6">
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-green-600 transition">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-green-600 transition">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-green-600 transition">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-green-600 transition">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/feed" className="hover:text-green-400 transition">Browse Products</Link></li>
              <li><Link href="/search" className="hover:text-green-400 transition">Search</Link></li>
              <li><Link href="/subscription" className="hover:text-green-400 transition">Become a Seller</Link></li>
              <li><Link href="/about" className="hover:text-green-400 transition">{t('about')}</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/help" className="hover:text-green-400 transition">{t('help')}</Link></li>
              <li><Link href="/faq" className="hover:text-green-400 transition">FAQs</Link></li>
              <li><Link href="/terms" className="hover:text-green-400 transition">{t('terms')}</Link></li>
              <li><Link href="/privacy" className="hover:text-green-400 transition">{t('privacy')}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t('contact')}</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-green-400" />
                <span>support@agrilink.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-green-400" />
                <span>+91 1800-123-4567</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-green-400 mt-0.5" />
                <span>Kochi, Kerala, India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm">© 2024 AgriLink. All rights reserved.</p>
          <div className="flex gap-6 text-sm">
            <Link href="/terms" className="hover:text-green-400 transition">{t('terms')}</Link>
            <Link href="/privacy" className="hover:text-green-400 transition">{t('privacy')}</Link>
            <Link href="/cookies" className="hover:text-green-400 transition">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
