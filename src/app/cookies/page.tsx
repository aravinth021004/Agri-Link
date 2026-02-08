export default function CookiesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Cookie Policy</h1>
      
      <div className="prose prose-green max-w-none">
        <p className="text-gray-600 mb-6">Last updated: February 2024</p>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">What Are Cookies?</h2>
          <p className="text-gray-600">
            Cookies are small text files stored on your device when you visit websites. They help us provide a better experience by remembering your preferences and understanding how you use our platform.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Types of Cookies We Use</h2>
          
          <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">Essential Cookies</h3>
          <p className="text-gray-600 mb-4">
            Required for the platform to function. They enable core features like authentication, shopping cart, and security. Cannot be disabled.
          </p>

          <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">Preference Cookies</h3>
          <p className="text-gray-600 mb-4">
            Remember your settings like language preference and display options to provide a personalized experience.
          </p>

          <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">Analytics Cookies</h3>
          <p className="text-gray-600 mb-4">
            Help us understand how visitors interact with our platform, which pages are popular, and identify areas for improvement.
          </p>

          <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">Marketing Cookies</h3>
          <p className="text-gray-600 mb-4">
            Used to show relevant products and content based on your interests and browsing behavior.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Managing Cookies</h2>
          <p className="text-gray-600 mb-4">
            You can control cookies through your browser settings:
          </p>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies</li>
            <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies</li>
            <li><strong>Safari:</strong> Preferences → Privacy → Cookies</li>
            <li><strong>Edge:</strong> Settings → Cookies and site permissions</li>
          </ul>
          <p className="text-gray-600 mt-4">
            Note: Disabling cookies may affect the functionality of our platform.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Third-Party Cookies</h2>
          <p className="text-gray-600">
            We may use third-party services that set their own cookies:
          </p>
          <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-2">
            <li>Razorpay for payment processing</li>
            <li>Google Analytics for usage analytics</li>
            <li>Cloudinary for image hosting</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Us</h2>
          <p className="text-gray-600">
            Questions about our cookie policy? Contact privacy@agrilink.com.
          </p>
        </section>
      </div>
    </div>
  )
}
