import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ unreadCount: 0 })
    }

    const unreadCount = await prisma.message.count({
      where: {
        receiverId: session.user.id,
        isRead: false,
      },
    })

    return NextResponse.json({ unreadCount })
  } catch (error) {
    console.error('Unread messages error:', error)
    return NextResponse.json({ unreadCount: 0 })
  }
}
