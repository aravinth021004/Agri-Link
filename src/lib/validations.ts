import { z } from 'zod'

// Auth schemas
export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^(\+91)?[6-9]\d{9}$/, 'Invalid phone number'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
})

export const loginSchema = z.object({
  emailOrPhone: z.string().min(1, 'Email or phone is required'),
  password: z.string().min(1, 'Password is required'),
})

export const verifyOtpSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  code: z.string().length(6, 'OTP must be 6 digits'),
  purpose: z.enum(['VERIFY_EMAIL', 'VERIFY_PHONE', 'RESET_PASSWORD']),
})

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export const newPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

// Product schemas
export const productSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000),
  price: z.number().positive('Price must be positive'),
  quantity: z.number().int().positive('Quantity must be positive'),
  unit: z.enum(['kg', 'g', 'piece', 'dozen', 'litre', 'ml', 'bunch']),
  categoryId: z.string().uuid('Invalid category'),
  deliveryOptions: z.array(z.enum(['HOME_DELIVERY', 'FARM_PICKUP', 'MEETUP_POINT'])).min(1),
  deliveryRadius: z.number().int().positive().optional(),
  deliveryFee: z.number().nonnegative().optional(),
})

export const updateProductSchema = productSchema.partial()

// Category schema
export const categorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  nameHi: z.string().optional(),
  nameTa: z.string().optional(),
  description: z.string().max(200).optional(),
})

// Cart schema
export const cartItemSchema = z.object({
  productId: z.string().uuid('Invalid product'),
  quantity: z.number().int().positive('Quantity must be positive'),
  deliveryOption: z.enum(['HOME_DELIVERY', 'FARM_PICKUP', 'MEETUP_POINT']),
})

export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive('Quantity must be positive').optional(),
  deliveryOption: z.enum(['HOME_DELIVERY', 'FARM_PICKUP', 'MEETUP_POINT']).optional(),
})

// Order schema
export const createOrderSchema = z.object({
  deliveryAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    pincode: z.string(),
    landmark: z.string().optional(),
  }).nullish(),
  pickupLocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string(),
  }).nullish(),
  notes: z.string().max(500).optional(),
  paymentMethod: z.enum(['UPI', 'COD']),
  upiRefId: z.string().regex(/^\d{12}$/, 'UPI Reference ID must be 12 digits').optional(),
})

export const updateOrderStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']),
})

// Comment schema
export const commentSchema = z.object({
  productId: z.string().uuid('Invalid product'),
  content: z.string().min(1, 'Comment cannot be empty').max(500),
  parentId: z.string().uuid().optional(),
})

// Rating schema
export const ratingSchema = z.object({
  orderId: z.string().uuid('Invalid order'),
  rating: z.number().int().min(1).max(5),
  review: z.string().max(500).optional(),
})

// Message schema
export const messageSchema = z.object({
  receiverId: z.string().uuid('Invalid receiver'),
  content: z.string().min(1, 'Message cannot be empty').max(1000),
})

// Profile schema
export const profileSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  bio: z.string().max(300).optional(),
  location: z.string().max(100).optional(),
  language: z.enum(['en', 'hi', 'ta']).optional(),
  upiId: z.string().regex(/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/, 'Invalid UPI ID format (e.g. name@upi)').optional(),
})

// Subscription schema
export const subscribeSchema = z.object({
  planId: z.string(),
  paymentId: z.string(),
})

// Types
export type SignupInput = z.infer<typeof signupSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>
export type ProductInput = z.infer<typeof productSchema>
export type CategoryInput = z.infer<typeof categorySchema>
export type CartItemInput = z.infer<typeof cartItemSchema>
export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type CommentInput = z.infer<typeof commentSchema>
export type RatingInput = z.infer<typeof ratingSchema>
export type MessageInput = z.infer<typeof messageSchema>
export type ProfileInput = z.infer<typeof profileSchema>
