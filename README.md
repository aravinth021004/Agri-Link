# 🌾 AgriLink

**Farm Fresh, Direct to You** - A modern platform connecting farmers directly with consumers for fresh produce at fair prices.

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
- 📦 Order tracking and history
- ❤️ Wishlist for favorite products
- 🌐 Multi-language support (English, Hindi, Tamil)

### For Farmers
- 📊 Comprehensive dashboard with analytics
- 📝 Easy product management (create, edit, delete)
- 💰 Subscription plans for selling
- 📈 Sales tracking and earnings overview
- 👥 Follower management

### For Admins
- 👤 User management
- 📊 Platform analytics
- 🛡️ Content moderation

## 🚀 Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | PostgreSQL |
| ORM | Prisma 5 |
| Auth | NextAuth.js |
| State | Zustand |
| i18n | next-intl |

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL 15+
- npm or yarn

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
   Update `.env` with your database URL and secrets.

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
├── prisma/              # Database schema and migrations
├── public/              # Static assets
├── messages/            # i18n translation files
│   ├── en.json          # English
│   ├── hi.json          # Hindi
│   └── ta.json          # Tamil
├── src/
│   ├── app/             # Next.js App Router pages
│   │   ├── api/         # API routes
│   │   ├── (auth)/      # Auth pages (login, signup)
│   │   ├── feed/        # Product feed
│   │   ├── cart/        # Shopping cart
│   │   ├── orders/      # Order management
│   │   ├── dashboard/   # Farmer dashboard
│   │   └── admin/       # Admin panel
│   ├── components/      # Reusable UI components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions
│   ├── stores/          # Zustand stores
│   └── i18n/            # Internationalization config
└── package.json
```

## 🔑 Environment Variables

```env
DATABASE_URL="postgresql://user:password@localhost:5432/agrilink"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
JWT_SECRET="your-jwt-secret"

# Optional
STORAGE_MODE="local"       # or "cloudinary"
OTP_MODE="console"         # or "twilio"
EMAIL_MODE="console"       # or "smtp"
```

## 📱 Pages & Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/feed` | Product feed |
| `/search` | Search products |
| `/cart` | Shopping cart |
| `/checkout` | Checkout flow |
| `/orders` | Order history |
| `/profile` | User profile |
| `/settings` | App settings |
| `/dashboard` | Farmer dashboard |
| `/admin` | Admin panel |
| `/messages` | Direct messaging |

## 🌐 Multi-Language Support

AgriLink supports 3 languages:
- 🇬🇧 **English** (default)
- 🇮🇳 **Hindi** (हिंदी)
- 🇮🇳 **Tamil** (தமிழ்)

Change language in Settings → Language.

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
