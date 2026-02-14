# 🌾 AgriLink

**Farm Fresh, Direct to You** — A modern social commerce platform connecting farmers directly with consumers for fresh produce at fair prices.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css)

## ✨ Features

### For Customers
- 🛒 Browse and purchase fresh produce directly from farmers
- 🔍 Advanced search with filters (category, price, location)
- 💬 Direct messaging with farmers
- 📦 Order tracking, history, and customer-initiated cancellation
- ❤️ Wishlist for favorite products
- ⭐ Rate and review products
- 👍 Like & comment on the social feed
- 🔔 Real-time in-app notifications (orders, likes, comments, follows)
- 📧 Email notifications (order confirmation, status updates, welcome)
- 🌐 Multi-language support (English, Hindi, Tamil)

### For Farmers
- 📊 Comprehensive dashboard with analytics
- 📝 Easy product management (create, edit, delete) with Cloudinary image uploads
- 💰 Subscription plans for selling (auto-downgrade on expiry)
- 📈 Sales tracking and earnings overview
- 👥 Follower management
- 🔔 Notifications for new orders, cancellations, likes, and follows

### For Admins
- 👤 User management (suspend, activate, role changes)
- 📊 Platform analytics (revenue, users, orders)
- 🛡️ Content moderation and report handling

### Platform
- 🔐 Route-level authentication and role-based authorization
- 🛡️ Security headers on all API responses
- 💳 Razorpay payment integration with webhook verification
- ⏰ Automated subscription management via cron jobs
- 📧 Email service (console mode for dev, Resend API for production)
- 📱 PWA-ready with manifest.json

## 🚀 Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS + shadcn/ui |
| Database | PostgreSQL 15+ (Supabase) |
| ORM | Prisma 5 |
| Auth | NextAuth.js (JWT strategy) |
| State | Zustand + React Query |
| Payments | Razorpay |
| Media | Cloudinary |
| Email | Resend (prod) / Console (dev) |
| i18n | next-intl (EN, HI, TA) |
| Deployment | Vercel |

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL 15+
- npm or yarn
- Cloudinary account (for image uploads)
- Razorpay account (for payments)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/aravinth021004/Agri-Link.git
   cd Agri-Link/agrilink
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your database URL, API keys, and secrets. See [Environment Variables](#-environment-variables) below.

4. **Set up the database**
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   ```
   http://localhost:3000
   ```

## 📁 Project Structure

```
agrilink/
├── prisma/              # Database schema, migrations, and seed
├── public/              # Static assets (logo, manifest, uploads)
├── messages/            # i18n translation files (en, hi, ta)
├── src/
│   ├── app/             # Next.js App Router pages & API routes
│   │   ├── api/
│   │   │   ├── auth/        # Signup, login, password reset, OTP
│   │   │   ├── cart/        # Cart CRUD
│   │   │   ├── categories/  # Category listing
│   │   │   ├── cron/        # Scheduled jobs (subscription expiry)
│   │   │   ├── feed/        # Social feed
│   │   │   ├── interactions/ # Like, comment, follow, rate
│   │   │   ├── messages/    # Direct messaging
│   │   │   ├── notifications/ # In-app notifications
│   │   │   ├── orders/      # Order CRUD + cancellation
│   │   │   ├── payments/    # Razorpay create-order, verify, webhook
│   │   │   ├── products/    # Product CRUD
│   │   │   ├── subscriptions/ # Plans, subscribe, status
│   │   │   ├── upload/      # Cloudinary file uploads
│   │   │   ├── users/       # User profile
│   │   │   ├── wishlist/    # Wishlist management
│   │   │   └── admin/       # Admin analytics & user management
│   │   ├── feed/        # Social product feed
│   │   ├── cart/        # Shopping cart
│   │   ├── checkout/    # Checkout flow
│   │   ├── orders/      # Order history & detail
│   │   ├── dashboard/   # Farmer dashboard
│   │   ├── admin/       # Admin panel
│   │   ├── messages/    # Direct messaging
│   │   ├── notifications/ # Notification center
│   │   └── ...          # Other pages
│   ├── components/      # Reusable UI components
│   │   └── ui/          # Base components (button, input, modal, toast)
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utilities (auth, prisma, storage, email, notifications, validations)
│   ├── stores/          # Zustand stores (cart, user)
│   └── i18n/            # Internationalization config
├── vercel.json          # Vercel cron & deployment config
└── package.json
```

## 🔑 Environment Variables

See `.env.example` for the full list.

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/agrilink"
DIRECT_URL="postgresql://user:password@host:5432/agrilink"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-random-secret"
JWT_SECRET="generate-a-different-secret"

# Cloudinary (Media Uploads)
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
STORAGE_MODE="cloudinary"       # "local" or "cloudinary"

# Razorpay (Payments)
RAZORPAY_KEY_ID=""
RAZORPAY_KEY_SECRET=""
RAZORPAY_WEBHOOK_SECRET=""

# Cron Jobs
CRON_SECRET="generate-a-random-secret-for-cron"

# Email
EMAIL_MODE="console"            # "console" for dev, "resend" for production
EMAIL_API_KEY=""                 # Resend API key (production only)
EMAIL_FROM="AgriLink <noreply@yourdomain.com>"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## 🔌 API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/signup` | POST | User registration + welcome email |
| `/api/auth/[...nextauth]` | * | NextAuth login/session |
| `/api/auth/change-password` | POST | Change password |
| `/api/auth/reset-password` | POST | Password reset |
| `/api/auth/verify-otp` | POST | OTP verification |
| `/api/feed` | GET | Social product feed |
| `/api/products` | GET/POST | List & create products |
| `/api/products/[id]` | GET/PUT/DELETE | Product CRUD |
| `/api/categories` | GET | Category listing |
| `/api/cart` | GET/POST | Cart operations |
| `/api/cart/[itemId]` | PUT/DELETE | Update/remove cart item |
| `/api/orders` | GET/POST | Order listing & creation + email |
| `/api/orders/[id]` | GET/PUT | Order detail & status update (cancel) |
| `/api/payments/create-order` | POST | Create Razorpay order |
| `/api/payments/verify` | POST | Verify payment signature |
| `/api/payments/webhook` | POST | Razorpay webhook (HMAC verified) |
| `/api/interactions/like` | POST | Like/unlike a product |
| `/api/interactions/comment` | POST | Comment on a product |
| `/api/interactions/follow` | POST | Follow/unfollow a farmer |
| `/api/interactions/rate` | POST | Rate a product |
| `/api/messages` | GET/POST | Direct messaging |
| `/api/notifications` | GET/PUT | Notifications |
| `/api/wishlist` | GET/POST/DELETE | Wishlist management |
| `/api/upload` | POST | Cloudinary file upload |
| `/api/subscriptions/plans` | GET | Available plans |
| `/api/subscriptions/subscribe` | POST | Subscribe to a plan |
| `/api/subscriptions/status` | GET | Subscription status |
| `/api/cron/subscriptions` | POST | Subscription expiry cron (secured) |
| `/api/admin/analytics` | GET | Platform analytics |
| `/api/admin/users` | GET/PUT | User management |

## 📱 Pages & Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/feed` | Social product feed |
| `/search` | Search products |
| `/categories/[slug]` | Browse by category |
| `/products/[id]` | Product detail |
| `/products/create` | Create product (farmers) |
| `/cart` | Shopping cart |
| `/checkout` | Checkout flow |
| `/orders` | Order history |
| `/orders/[id]` | Order detail |
| `/profile` | User profile |
| `/farmers/[id]` | Farmer profile |
| `/settings` | App settings |
| `/dashboard` | Farmer dashboard |
| `/subscription` | Manage subscription |
| `/admin` | Admin panel |
| `/messages` | Direct messaging |
| `/notifications` | Notification center |
| `/wishlist` | Wishlist |

## 🌐 Multi-Language Support

AgriLink supports 3 languages:
- 🇬🇧 **English** (default)
- 🇮🇳 **Hindi** (हिंदी)
- 🇮🇳 **Tamil** (தமிழ்)

Change language in Settings → Language.

## 🔒 Security

- Route-level authentication via Next.js proxy (protected routes require login)
- Role-based authorization (Customer, Farmer, Admin)
- HMAC-SHA256 verification on Razorpay webhooks
- Secure file upload validation (type, size limits)
- Security headers on all API responses (X-Content-Type-Options, X-Frame-Options, etc.)
- Bearer token protection on cron endpoints
- Passwords hashed with bcrypt

## 📧 Email Notifications

AgriLink sends transactional emails for key events:
- **Welcome email** on signup
- **Order confirmation** when an order is placed
- **Order status updates** (confirmed, shipped, delivered, cancelled)
- **Subscription expiry warnings** (3 days before expiry)

In development, emails are logged to the console (`EMAIL_MODE="console"`).
In production, emails are sent via [Resend](https://resend.com) (`EMAIL_MODE="resend"`).

## ⏰ Cron Jobs

| Job | Schedule | Description |
|-----|----------|-------------|
| Subscription expiry | Daily at midnight UTC | Expires overdue subscriptions, downgrades farmers to customers, sends expiry warnings |

Configured in `vercel.json` for Vercel deployment. Secured with `CRON_SECRET` Bearer token.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Aravinth** - [GitHub](https://github.com/aravinth021004)

---

<p align="center">
  Made with ❤️ for farmers and consumers
</p>
