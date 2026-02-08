import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create Admin User
  const adminPassword = await bcrypt.hash('Admin@123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@agrilink.com' },
    update: {},
    create: {
      email: 'admin@agrilink.com',
      phone: '9999999999',
      passwordHash: adminPassword,
      fullName: 'Admin User',
      role: 'ADMIN',
      emailVerified: true,
      phoneVerified: true,
      location: 'Chennai, Tamil Nadu',
    },
  })
  console.log(`✅ Admin user created: ${admin.email}`)

  // Create Sample Farmer
  const farmerPassword = await bcrypt.hash('Farmer@123', 12)
  const farmer = await prisma.user.upsert({
    where: { email: 'farmer@agrilink.com' },
    update: {},
    create: {
      email: 'farmer@agrilink.com',
      phone: '9876543210',
      passwordHash: farmerPassword,
      fullName: 'Rajan Kumar',
      role: 'FARMER',
      emailVerified: true,
      phoneVerified: true,
      bio: 'Organic farmer with 15 years of experience. Growing vegetables and fruits using traditional methods.',
      location: 'Coimbatore, Tamil Nadu',
    },
  })
  console.log(`✅ Farmer user created: ${farmer.email}`)

  // Create subscription for farmer
  const now = new Date()
  const endDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000) // 1 year from now

  await prisma.subscription.upsert({
    where: { id: 'seed-subscription-1' },
    update: {},
    create: {
      id: 'seed-subscription-1',
      userId: farmer.id,
      planId: 'farmer_yearly',
      startDate: now,
      endDate: endDate,
      status: 'ACTIVE',
      amount: 1499,
      paymentId: 'seed_payment_1',
    },
  })
  console.log('✅ Farmer subscription created')

  // Create Sample Customer
  const customerPassword = await bcrypt.hash('Customer@123', 12)
  const customer = await prisma.user.upsert({
    where: { email: 'customer@agrilink.com' },
    update: {},
    create: {
      email: 'customer@agrilink.com',
      phone: '9876543211',
      passwordHash: customerPassword,
      fullName: 'Priya Sharma',
      role: 'CUSTOMER',
      emailVerified: true,
      phoneVerified: true,
      location: 'Chennai, Tamil Nadu',
    },
  })
  console.log(`✅ Customer user created: ${customer.email}`)

  // Create Global Categories
  const categories = [
    { name: 'Vegetables', nameHi: 'सब्जियां', nameTa: 'காய்கறிகள்', slug: 'vegetables', description: 'Fresh farm vegetables' },
    { name: 'Fruits', nameHi: 'फल', nameTa: 'பழங்கள்', slug: 'fruits', description: 'Seasonal and exotic fruits' },
    { name: 'Grains', nameHi: 'अनाज', nameTa: 'தானியங்கள்', slug: 'grains', description: 'Rice, wheat, and other grains' },
    { name: 'Dairy', nameHi: 'डेयरी', nameTa: 'பால் பொருட்கள்', slug: 'dairy', description: 'Milk, curd, ghee, and more' },
    { name: 'Spices', nameHi: 'मसाले', nameTa: 'மசாலாப் பொருட்கள்', slug: 'spices', description: 'Fresh spices and herbs' },
    { name: 'Pulses', nameHi: 'दालें', nameTa: 'பருப்பு வகைகள்', slug: 'pulses', description: 'Lentils and legumes' },
    { name: 'Organic', nameHi: 'जैविक', nameTa: 'கரிம உணவு', slug: 'organic', description: 'Certified organic products' },
  ]

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        ...cat,
        isGlobal: true,
      },
    })
  }
  console.log('✅ Categories created')

  // Get vegetable category for sample products
  const vegCategory = await prisma.category.findUnique({ where: { slug: 'vegetables' } })
  const fruitCategory = await prisma.category.findUnique({ where: { slug: 'fruits' } })

  if (vegCategory && fruitCategory) {
    // Create Sample Products
    const products = [
      {
        farmerId: farmer.id,
        title: 'Fresh Organic Tomatoes',
        description: 'Naturally grown tomatoes without any pesticides. Perfect for salads and cooking. Harvested fresh every morning.',
        price: 40,
        quantity: 50,
        unit: 'kg',
        categoryId: vegCategory.id,
        mediaUrls: ['/uploads/tomatoes.jpg'],
        deliveryOptions: ['HOME_DELIVERY', 'FARM_PICKUP'],
        deliveryRadius: 25,
        deliveryFee: 30,
      },
      {
        farmerId: farmer.id,
        title: 'Green Spinach (Palak)',
        description: 'Fresh, leafy spinach rich in iron and vitamins. Grown organically in our farm.',
        price: 30,
        quantity: 30,
        unit: 'bunch',
        categoryId: vegCategory.id,
        mediaUrls: ['/uploads/spinach.jpg'],
        deliveryOptions: ['HOME_DELIVERY', 'FARM_PICKUP', 'MEETUP_POINT'],
        deliveryRadius: 20,
        deliveryFee: 25,
      },
      {
        farmerId: farmer.id,
        title: 'Farm Fresh Bananas',
        description: 'Locally grown bananas, naturally ripened. Sweet and nutritious.',
        price: 50,
        quantity: 100,
        unit: 'dozen',
        categoryId: fruitCategory.id,
        mediaUrls: ['/uploads/bananas.jpg'],
        deliveryOptions: ['HOME_DELIVERY', 'FARM_PICKUP'],
        deliveryRadius: 30,
        deliveryFee: 35,
      },
      {
        farmerId: farmer.id,
        title: 'Fresh Carrots',
        description: 'Crunchy, sweet carrots perfect for salads, juices, and cooking.',
        price: 45,
        quantity: 40,
        unit: 'kg',
        categoryId: vegCategory.id,
        mediaUrls: ['/uploads/carrots.jpg'],
        deliveryOptions: ['HOME_DELIVERY', 'FARM_PICKUP'],
        deliveryRadius: 25,
        deliveryFee: 30,
      },
    ]

    for (const product of products) {
      await prisma.product.create({
        data: product,
      })
    }
    console.log('✅ Sample products created')
  }

  console.log('')
  console.log('🎉 Database seeding completed!')
  console.log('')
  console.log('📋 Test Accounts:')
  console.log('  Admin:    admin@agrilink.com / Admin@123')
  console.log('  Farmer:   farmer@agrilink.com / Farmer@123')
  console.log('  Customer: customer@agrilink.com / Customer@123')
  console.log('')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
