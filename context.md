# AgriLink Implementation Prompt for AI Agent

## Project Overview
AgriLink is a social commerce platform connecting farmers directly with consumers. Build a full-stack web application using Next.js 14+ (App Router) that combines social media features (posts, likes, comments) with e-commerce functionality (cart, orders, payments).

## Core Problem
Farmers receive only 25-35% of retail prices due to intermediaries. AgriLink eliminates middlemen through:
- Subscription-based farmer access (₹199/month) instead of transaction commissions
- Direct farmer-to-consumer sales
- Social media-style product showcasing

## Tech Stack (Required)
- **Frontend/Backend**: Next.js 14+ (App Router with Server Components)
- **Language**: TypeScript
- **Database**: PostgreSQL 15+
- **ORM**: Prisma
- **Styling**: Tailwind CSS 3+
- **UI Components**: shadcn/ui + Radix UI
- **Auth**: NextAuth.js (Auth.js)
- **Forms**: React Hook Form + Zod validation
- **State**: Zustand (global) + React Query (server state)
- **Payments**: Razorpay
- **Media Storage**: Cloudinary
- **i18n**: next-intl (English, Hindi, Tamil)
- **Deployment**: Vercel

## User Roles & Access

### 1. Customer (Default)
- Browse product feed (social media style)
- Like, comment, share posts
- Follow farmers
- Add to cart, checkout, track orders
- Rate and review farmers (1-5 stars)
- Direct messaging with farmers
- **Can upgrade to Farmer** via subscription

### 2. Farmer (Subscription Required - ₹199/month)
- All Customer features PLUS:
- Create product posts (images/videos, price, quantity)
- Set delivery options: Home Delivery, Farm Pickup, Meetup Point
- Manage inventory and products
- Accept/reject orders
- Update order status
- View analytics (sales, views, revenue)
- **On subscription expiry**: Downgrade to Customer, existing posts remain visible

### 3. Admin
- User management (suspend, activate)
- Content moderation (remove posts, ban users)
- Subscription management
- Platform analytics dashboard
- Support ticket resolution

## Core Features to Implement

### Authentication
- Email/Phone signup with OTP verification
- Login with JWT tokens
- Password reset
- Role-based access control (Customer, Farmer, Admin)
- Protected routes

### Product Management (Farmers)
1. Check active subscription before allowing post creation
2. Product form: title, description, category, price, quantity, unit
3. Multiple image/video upload (Cloudinary)
4. Delivery options: home_delivery, farm_pickup, meetup_point
5. Set delivery radius (km) and delivery fee
6. Edit/delete own products
7. Update inventory status

### Feed Algorithm
```
Feed Score = 0.4(Recency) + 0.3(Engagement) + 0.3(Relationship)

Recency: Posts from last 48 hours prioritized
Engagement: Likes×1 + Comments×3 + Shares×5
Relationship: Following farmer=100pts, Past orders=50pts, Same location=25pts
```
- Infinite scroll pagination (20 posts per page)
- Filter by category, location, price range

### Social Features
- **Like**: Toggle like/unlike, update count
- **Comment**: Nested comments (2 levels), edit within 5 min
- **Share**: Generate shareable link, social media buttons
- **Follow**: Follow/unfollow farmers, show follower count
- **Rate**: 1-5 stars with optional review (only after purchase)

### Shopping Cart
- Add products from multiple farmers
- **Group items by farmer** in cart display
- Select delivery option per farmer
- Show subtotal per farmer + delivery fee
- Grand total calculation
- Update quantity, remove items

### Checkout & Payments
1. Review cart grouped by farmer
2. Select delivery address (or pickup location)
3. Razorpay payment integration
4. Create **one order per farmer** after payment success
5. Send confirmation emails/SMS
6. Webhook handling for payment status

### Order Management

**Customer Side**:
- View all orders (pending, delivered, cancelled)
- Track order status with timeline
- Chat with farmer
- Mark as received
- Rate farmer after delivery

**Farmer Side**:
- View incoming orders
- Accept/reject orders
- Update status: Pending → Confirmed → Packed → Out for Delivery → Delivered
- Upload delivery proof (optional)
- Chat with customer

### Subscription System
1. Display subscription plans
2. Razorpay subscription integration
3. Check subscription status before farmer actions
4. Auto-downgrade on expiry (cron job)
5. Send expiry reminders (7 days before)
6. Renewal flow

### Direct Messaging
- Real-time chat between customer and farmer
- Message history per conversation
- Unread count indicator
- Only allow messaging if order exists (or farmer profile visit)

### Admin Panel
- **User Management**: List all users, filter by role, suspend/activate
- **Content Moderation**: View reported posts, remove/dismiss
- **Analytics**: Total users, revenue, active subscriptions, engagement metrics
- **Subscription Management**: View all subscriptions, handle refunds

### Multi-language Support
- Language switcher (EN, HI, TA)
- Translate all UI text using next-intl
- Store user language preference
- RTL support ready for future

## Database Schema (Prisma)

```prisma
model User {
  id                String   @id @default(uuid())
  email             String   @unique
  phone             String   @unique
  passwordHash      String
  fullName          String
  role              Role     @default(CUSTOMER)
  profileImage      String?
  bio               String?
  location          String?
  language          String   @default("en")
  status            Status   @default(ACTIVE)
  emailVerified     Boolean  @default(false)
  phoneVerified     Boolean  @default(false)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  products          Product[]
  orders            Order[]   @relation("CustomerOrders")
  farmerOrders      Order[]   @relation("FarmerOrders")
  subscriptions     Subscription[]
  likes             Like[]
  comments          Comment[]
  ratings           Rating[]
  following         Follow[]  @relation("Follower")
  followers         Follow[]  @relation("Following")
}

enum Role {
  CUSTOMER
  FARMER
  ADMIN
}

enum Status {
  ACTIVE
  SUSPENDED
  DELETED
}

model Subscription {
  id              String   @id @default(uuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  planId          String
  startDate       DateTime
  endDate         DateTime
  status          SubStatus @default(ACTIVE)
  amount          Decimal  @db.Decimal(10, 2)
  paymentId       String
  razorpaySubId   String?
  createdAt       DateTime @default(now())
}

enum SubStatus {
  ACTIVE
  EXPIRED
  CANCELLED
}

model Product {
  id              String   @id @default(uuid())
  farmerId        String
  farmer          User     @relation(fields: [farmerId], references: [id])
  title           String
  description     String
  price           Decimal  @db.Decimal(10, 2)
  quantity        Int
  unit            String
  categoryId      String
  mediaUrls       Json
  deliveryOptions Json
  deliveryRadius  Int?
  deliveryFee     Decimal? @db.Decimal(10, 2)
  status          ProductStatus @default(ACTIVE)
  viewsCount      Int      @default(0)
  likesCount      Int      @default(0)
  commentsCount   Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  orders          Order[]
  likes           Like[]
  comments        Comment[]
}

enum ProductStatus {
  ACTIVE
  INACTIVE
  DELETED
  SOLD_OUT
}

model Order {
  id              String   @id @default(uuid())
  orderNumber     String   @unique
  customerId      String
  customer        User     @relation("CustomerOrders", fields: [customerId], references: [id])
  farmerId        String
  farmer          User     @relation("FarmerOrders", fields: [farmerId], references: [id])
  productId       String
  product         Product  @relation(fields: [productId], references: [id])
  quantity        Int
  unitPrice       Decimal  @db.Decimal(10, 2)
  subtotal        Decimal  @db.Decimal(10, 2)
  deliveryOption  DeliveryOption
  deliveryFee     Decimal  @db.Decimal(10, 2)
  totalAmount     Decimal  @db.Decimal(10, 2)
  deliveryAddress Json?
  status          OrderStatus @default(PENDING)
  paymentId       String
  razorpayOrderId String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum DeliveryOption {
  HOME_DELIVERY
  FARM_PICKUP
  MEETUP_POINT
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PACKED
  OUT_FOR_DELIVERY
  DELIVERED
  CANCELLED
  DISPUTED
}

model Like {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  productId String
  product   Product  @relation(fields: [productId], references: [id])
  createdAt DateTime @default(now())
  
  @@unique([userId, productId])
}

model Comment {
  id              String   @id @default(uuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  productId       String
  product         Product  @relation(fields: [productId], references: [id])
  parentId        String?
  parent          Comment? @relation("CommentReplies", fields: [parentId], references: [id])
  replies         Comment[] @relation("CommentReplies")
  content         String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model Follow {
  id          String   @id @default(uuid())
  followerId  String
  follower    User     @relation("Follower", fields: [followerId], references: [id])
  farmerId    String
  farmer      User     @relation("Following", fields: [farmerId], references: [id])
  createdAt   DateTime @default(now())
  
  @@unique([followerId, farmerId])
}

model Rating {
  id         String   @id @default(uuid())
  customerId String
  customer   User     @relation(fields: [customerId], references: [id])
  farmerId   String
  orderId    String
  rating     Int
  review     String?
  createdAt  DateTime @default(now())
  
  @@unique([customerId, orderId])
}
```

## Key API Routes (Next.js App Router)

```
app/api/
├── auth/
│   ├── signup/route.ts
│   ├── login/route.ts
│   ├── verify-otp/route.ts
│   └── reset-password/route.ts
├── products/
│   ├── route.ts (GET all, POST create)
│   ├── [id]/route.ts (GET, PUT, DELETE)
│   └── farmer/[farmerId]/route.ts
├── feed/route.ts (GET with algorithm)
├── cart/
│   ├── route.ts (GET, POST, DELETE)
│   └── [itemId]/route.ts (PUT, DELETE)
├── orders/
│   ├── route.ts (GET, POST)
│   ├── [id]/route.ts (GET)
│   └── [id]/status/route.ts (PUT - farmer only)
├── subscriptions/
│   ├── plans/route.ts
│   ├── subscribe/route.ts
│   └── status/route.ts
├── payments/
│   ├── create-order/route.ts
│   ├── verify/route.ts
│   └── webhook/route.ts (Razorpay webhook)
├── interactions/
│   ├── like/[productId]/route.ts
│   ├── comment/route.ts
│   ├── follow/[farmerId]/route.ts
│   └── rate/route.ts
└── admin/
    ├── users/route.ts
    ├── analytics/route.ts
    └── moderation/route.ts
```

## Critical Business Rules

1. **Subscription Validation**: Always check `subscription.status === 'ACTIVE' && subscription.endDate > now()` before allowing farmer to create posts
2. **Cart Grouping**: Group cart items by `farmerId` for multi-vendor checkout
3. **Order Creation**: Create separate order records for each farmer in cart
4. **Payment Verification**: Verify Razorpay signature before marking payment successful
5. **Rating**: Only allow customers who have completed orders to rate farmers
6. **Delivery Options**: Validate delivery radius for HOME_DELIVERY option
7. **Auto-downgrade**: Cron job to downgrade farmers when subscription expires
8. **Image Upload**: Max 5 images per product, 5MB per image, compress before upload

## UI/UX Requirements

- **Mobile-first**: Optimize for smartphones (70% of users)
- **Responsive**: Works on 320px to 2560px screens
- **Fast**: < 2s initial load, < 500ms navigation
- **Accessible**: WCAG 2.1 AA compliance, keyboard navigation
- **Visual**: Image-heavy design mimicking Instagram/Facebook
- **Simple**: Minimal text, icon-based actions, visual feedback
- **Colors**: Green primary (#16a34a), Yellow secondary (#eab308), Red admin (#dc2626)

## Performance Targets

- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.1
- Time to Interactive: < 3.5s
- Image optimization: WebP format, lazy loading
- API response time: < 200ms (95th percentile)

## Security Checklist

- [ ] Password hashing with bcrypt (12 rounds)
- [ ] JWT tokens with 7-day expiry
- [ ] HTTPS only in production
- [ ] Rate limiting (100 req/min per IP)
- [ ] Input validation with Zod on all forms
- [ ] SQL injection prevention via Prisma
- [ ] XSS protection (sanitize user input)
- [ ] CSRF tokens for state-changing operations
- [ ] Secure cookie settings (httpOnly, secure, sameSite)
- [ ] Environment variables for secrets

## Deployment Checklist

- [ ] Set up Vercel project
- [ ] Configure PostgreSQL database (Supabase/Neon)
- [ ] Set environment variables
- [ ] Run Prisma migrations
- [ ] Configure Cloudinary
- [ ] Set up Razorpay (test mode first)
- [ ] Configure custom domain
- [ ] Enable HTTPS
- [ ] Set up error monitoring (Sentry)
- [ ] Configure analytics

## Development Phases

**Phase 1**: Auth + User Management
- Setup Next.js project, database, Prisma
- Implement authentication (signup, login, OTP)
- User profiles, role management
- Subscription system

**Phase 2**: Products + Feed
- Product CRUD for farmers
- Feed algorithm implementation
- Social features (like, comment, follow)
- Image upload to Cloudinary

**Phase 3**: E-commerce
- Shopping cart
- Checkout flow
- Razorpay integration
- Order management

**Phase 4**: Additional Features
- Direct messaging
- Admin panel
- Analytics dashboard
- Multi-language support

**Phase 5**: Testing + Deployment
- End-to-end testing
- Performance optimization
- Security audit
- Production deployment

## Start Implementation
