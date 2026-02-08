export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
      
      <div className="prose prose-green max-w-none">
        <p className="text-gray-600 mb-6">Last updated: February 2024</p>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
          <p className="text-gray-600">
            By accessing or using AgriLink, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
          <p className="text-gray-600">
            AgriLink is a social commerce platform connecting farmers directly with consumers. We provide a marketplace for agricultural products, facilitating transactions between buyers and sellers.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">3. User Accounts</h2>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li>You must provide accurate information when creating an account</li>
            <li>You are responsible for maintaining the security of your account</li>
            <li>One person may not maintain multiple accounts</li>
            <li>Accounts are non-transferable</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">4. For Buyers</h2>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li>All purchases are subject to product availability</li>
            <li>Prices are set by individual farmers and may vary</li>
            <li>Delivery times and methods depend on the farmer</li>
            <li>Quality concerns should be reported within 24 hours of delivery</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">5. For Sellers</h2>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li>Sellers must maintain valid subscriptions to list products</li>
            <li>Products must be accurately described and photographed</li>
            <li>Sellers must fulfill orders in a timely manner</li>
            <li>Fraudulent listings will result in account termination</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">6. Payments</h2>
          <p className="text-gray-600">
            All payments are processed securely through our payment partners. AgriLink is not responsible for payment disputes between buyers and sellers beyond facilitating communication.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">7. Limitation of Liability</h2>
          <p className="text-gray-600">
            AgriLink serves as a platform connecting buyers and sellers. We do not guarantee product quality, delivery, or seller reliability. Use of our platform is at your own risk.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">8. Contact</h2>
          <p className="text-gray-600">
            For questions about these terms, contact us at legal@agrilink.com.
          </p>
        </section>
      </div>
    </div>
  )
}
