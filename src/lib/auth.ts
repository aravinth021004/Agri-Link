import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import prisma from './prisma'
import { verifyTotpCode } from './totp'

declare module 'next-auth' {
  interface User {
    id: string
    email: string
    phone: string
    fullName: string
    role: 'CUSTOMER' | 'FARMER' | 'ADMIN'
    profileImage?: string | null
  }

  interface Session {
    user: User
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    email: string
    phone: string
    fullName: string
    role: 'CUSTOMER' | 'FARMER' | 'ADMIN'
    profileImage?: string | null
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        emailOrPhone: { label: 'Email or Phone', type: 'text' },
        password: { label: 'Password', type: 'password' },
        totpCode: { label: 'Authenticator Code', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.emailOrPhone || !credentials?.password) {
          throw new Error('Email/Phone and password are required')
        }

        const { emailOrPhone, password, totpCode } = credentials

        // Find user by email or phone
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: emailOrPhone },
              { phone: emailOrPhone },
            ],
            status: 'ACTIVE',
          },
        })

        if (!user) {
          throw new Error('Invalid credentials')
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash)

        if (!isPasswordValid) {
          throw new Error('Invalid credentials')
        }

        // TOTP verification for users with 2FA enabled
        if (user.totpEnabled && user.totpSecret) {
          if (!totpCode) {
            throw new Error('TOTP_REQUIRED')
          }
          if (!verifyTotpCode(user.totpSecret, totpCode)) {
            throw new Error('TOTP_INVALID')
          }
        }

        return {
          id: user.id,
          email: user.email,
          phone: user.phone,
          fullName: user.fullName,
          role: user.role,
          profileImage: user.profileImage,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.phone = user.phone
        token.fullName = user.fullName
        token.role = user.role
        token.profileImage = user.profileImage
      }

      // Handle session update (e.g., after role change)
      if (trigger === 'update' && session) {
        token.role = session.role || token.role
        token.fullName = session.fullName || token.fullName
        token.profileImage = session.profileImage || token.profileImage
      }

      return token
    },
    async session({ session, token }) {
      session.user = {
        id: token.id,
        email: token.email,
        phone: token.phone,
        fullName: token.fullName,
        role: token.role,
        profileImage: token.profileImage,
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  secret: process.env.NEXTAUTH_SECRET,
}

// Helper to check if user has active subscription
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
      endDate: {
        gt: new Date(),
      },
    },
  })
  return !!subscription
}

// Helper to check if user is a farmer with active subscription
export async function canCreateProducts(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })

  if (user?.role !== 'FARMER') {
    return false
  }

  return hasActiveSubscription(userId)
}
