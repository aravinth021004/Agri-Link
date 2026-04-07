import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import prisma from './prisma'
import { verifyTotpCode } from './totp'

declare module 'next-auth' {
  interface User {
    id: string
    email: string
    phone: string | null
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
    phone: string | null
    fullName: string
    role: 'CUSTOMER' | 'FARMER' | 'ADMIN'
    profileImage?: string | null
  }
}

const providers: NextAuthOptions['providers'] = [
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

      if (!user || !user.passwordHash) {
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
]

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  )
}

export const authOptions: NextAuthOptions = {
  providers,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== 'google') {
        return true
      }

      if (!user.email) {
        return false
      }

      const existingUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { id: true, status: true },
      })

      if (existingUser) {
        return existingUser.status === 'ACTIVE'
      }

      try {
        await prisma.user.create({
          data: {
            email: user.email,
            fullName: user.name?.trim() || user.email.split('@')[0],
            profileImage: user.image,
            emailVerified: true,
            role: 'CUSTOMER',
            status: 'ACTIVE',
          },
        })
      } catch {
        // Another concurrent sign-in can create the same user by email.
        const createdUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { id: true, status: true },
        })

        if (!createdUser || createdUser.status !== 'ACTIVE') {
          return false
        }
      }

      return true
    },
    async jwt({ token, user, account, trigger, session }) {
      if (user && account?.provider === 'credentials') {
        token.id = user.id
        token.email = user.email
        token.phone = user.phone
        token.fullName = user.fullName
        token.role = user.role
        token.profileImage = user.profileImage
      }

      if ((account?.provider === 'google' || !token.id) && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: {
            id: true,
            email: true,
            phone: true,
            fullName: true,
            role: true,
            profileImage: true,
            status: true,
          },
        })

        if (dbUser?.status === 'ACTIVE') {
          token.id = dbUser.id
          token.email = dbUser.email
          token.phone = dbUser.phone
          token.fullName = dbUser.fullName
          token.role = dbUser.role
          token.profileImage = dbUser.profileImage
        }
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
        phone: token.phone || null,
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
