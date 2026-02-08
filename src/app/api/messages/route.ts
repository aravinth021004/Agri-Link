import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { messageSchema } from '@/lib/validations'

// GET conversations or messages
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const otherUserId = searchParams.get('userId')

    if (otherUserId) {
      // Get messages with specific user
      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: session.user.id, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: session.user.id },
          ],
        },
        include: {
          sender: {
            select: {
              id: true,
              fullName: true,
              profileImage: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      })

      // Mark as read
      await prisma.message.updateMany({
        where: {
          senderId: otherUserId,
          receiverId: session.user.id,
          isRead: false,
        },
        data: { isRead: true },
      })

      return NextResponse.json({ messages })
    } else {
      // Get all conversations (latest message per user)
      const sentMessages = await prisma.message.findMany({
        where: { senderId: session.user.id },
        select: { receiverId: true },
        distinct: ['receiverId'],
      })

      const receivedMessages = await prisma.message.findMany({
        where: { receiverId: session.user.id },
        select: { senderId: true },
        distinct: ['senderId'],
      })

      const userIds = new Set([
        ...sentMessages.map(m => m.receiverId),
        ...receivedMessages.map(m => m.senderId),
      ])

      const conversations = await Promise.all(
        Array.from(userIds).map(async (userId) => {
          const lastMessage = await prisma.message.findFirst({
            where: {
              OR: [
                { senderId: session.user.id, receiverId: userId },
                { senderId: userId, receiverId: session.user.id },
              ],
            },
            orderBy: { createdAt: 'desc' },
          })

          const unreadCount = await prisma.message.count({
            where: {
              senderId: userId,
              receiverId: session.user.id,
              isRead: false,
            },
          })

          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
              id: true,
              fullName: true,
              profileImage: true,
              role: true,
            },
          })

          return {
            user,
            lastMessage,
            unreadCount,
          }
        })
      )

      // Sort by last message time
      conversations.sort((a, b) => 
        new Date(b.lastMessage?.createdAt || 0).getTime() - 
        new Date(a.lastMessage?.createdAt || 0).getTime()
      )

      return NextResponse.json({ conversations })
    }
  } catch (error) {
    console.error('Get messages error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST send message
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    const result = messageSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { receiverId, content } = result.data

    // Check if receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
    })

    if (!receiver) {
      return NextResponse.json(
        { error: 'Recipient not found' },
        { status: 404 }
      )
    }

    // Check if messaging is allowed (order exists or farmer profile visit)
    // For simplicity, we allow messaging if either user is a farmer
    const canMessage = 
      session.user.role === 'FARMER' || 
      receiver.role === 'FARMER' ||
      session.user.role === 'ADMIN'

    if (!canMessage) {
      // Check if they have orders together
      const orderExists = await prisma.order.findFirst({
        where: {
          OR: [
            { customerId: session.user.id, farmerId: receiverId },
            { customerId: receiverId, farmerId: session.user.id },
          ],
        },
      })

      if (!orderExists) {
        return NextResponse.json(
          { error: 'You can only message farmers or customers you have orders with' },
          { status: 403 }
        )
      }
    }

    const message = await prisma.message.create({
      data: {
        senderId: session.user.id,
        receiverId,
        content,
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            profileImage: true,
          },
        },
      },
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
