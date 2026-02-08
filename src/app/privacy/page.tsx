export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
      
      <div className="prose prose-green max-w-none">
        <p className="text-gray-600 mb-6">Last updated: February 2024</p>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
          <p className="text-gray-600 mb-4">We collect information you provide directly:</p>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li><strong>Account Information:</strong> Name, email, phone number, profile photo</li>
            <li><strong>Transaction Data:</strong> Orders, payments, delivery addresses</li>
            <li><strong>Usage Data:</strong> How you interact with our platform</li>
            <li><strong>Device Information:</strong> Browser type, IP address, device identifiers</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li>To provide and improve our services</li>
            <li>To process transactions and send related information</li>
            <li>To send notifications about your orders and account</li>
            <li>To respond to your comments and questions</li>
            <li>To detect, prevent, and address fraud and abuse</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">3. Information Sharing</h2>
          <p className="text-gray-600 mb-4">We share information:</p>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li>With farmers when you place an order (name, delivery address)</li>
            <li>With payment processors to complete transactions</li>
            <li>With service providers who help operate our platform</li>
            <li>When required by law or to protect rights</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">4. Data Security</h2>
          <p className="text-gray-600">
            We implement appropriate security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">5. Your Rights</h2>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li>Access your personal information</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your account</li>
            <li>Opt out of marketing communications</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">6. Cookies</h2>
          <p className="text-gray-600">
            We use cookies and similar technologies to improve your experience, remember preferences, and analyze traffic. You can control cookies through your browser settings.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">7. Contact Us</h2>
          <p className="text-gray-600">
            For privacy-related inquiries, contact us at privacy@agrilink.com.
          </p>
        </section>
      </div>
    </div>
  )
}
