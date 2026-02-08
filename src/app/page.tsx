import Link from 'next/link'
import { ArrowRight, Leaf, Users, TrendingUp, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-hero py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Farm Fresh,{' '}
              <span className="text-green-600">Direct to You</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8">
              Connect directly with local farmers. No middlemen, no markups. 
              Get fresh produce at fair prices while supporting farming communities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/feed">
                <Button size="lg" className="w-full sm:w-auto">
                  Explore Products
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Become a Farmer
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose AgriLink?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<Leaf className="w-8 h-8 text-green-600" />}
              title="Fresh from Farm"
              description="Products go directly from farm to your doorstep, ensuring maximum freshness."
            />
            <FeatureCard
              icon={<Users className="w-8 h-8 text-green-600" />}
              title="Support Farmers"
              description="Farmers earn 100% of what you pay - no commissions or middlemen fees."
            />
            <FeatureCard
              icon={<TrendingUp className="w-8 h-8 text-green-600" />}
              title="Fair Prices"
              description="Pay fair prices for quality produce. No inflated retail markups."
            />
            <FeatureCard
              icon={<ShieldCheck className="w-8 h-8 text-green-600" />}
              title="Trusted Quality"
              description="Rate and review farmers. Buy from trusted sellers in your community."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              number="1"
              title="Browse & Discover"
              description="Explore products from local farmers. Like, comment, and follow your favorites."
            />
            <StepCard
              number="2"
              title="Order & Pay"
              description="Add to cart, choose delivery options, and pay securely online."
            />
            <StepCard
              number="3"
              title="Receive & Enjoy"
              description="Get fresh produce delivered to your door or pick up from the farm."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-green text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Join thousands of customers and farmers already using AgriLink 
            to buy and sell fresh produce.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                Create Account
              </Button>
            </Link>
            <Link href="/feed">
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent text-white border-white hover:bg-white/10">
                Browse as Guest
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">A</span>
                </div>
                <span className="text-xl font-bold text-white">AgriLink</span>
              </div>
              <p className="text-sm">
                Connecting farmers directly with consumers for fresh, fair, and sustainable food.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/feed" className="hover:text-green-400">Browse Products</Link></li>
                <li><Link href="/about" className="hover:text-green-400">About Us</Link></li>
                <li><Link href="/pricing" className="hover:text-green-400">Farmer Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/help" className="hover:text-green-400">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-green-400">Contact Us</Link></li>
                <li><Link href="/faq" className="hover:text-green-400">FAQs</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="hover:text-green-400">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-green-400">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>© 2024 AgriLink. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="text-center p-6 rounded-xl bg-gray-50 hover:bg-green-50 transition-colors">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  )
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-600 text-white font-bold text-xl mb-4">
        {number}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  )
}
