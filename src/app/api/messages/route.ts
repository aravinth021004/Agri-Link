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
      // Get all conversations - optimized to reduce N+1 queries
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

      const userIds = Array.from(new Set([
        ...sentMessages.map(m => m.receiverId),
        ...receivedMessages.map(m => m.senderId),
      ]))

      if (userIds.length === 0) {
        return NextResponse.json({ conversations: [] })
      }

      // Batch fetch all users at once
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          fullName: true,
          profileImage: true,
          role: true,
        },
      })
      const userMap = new Map(users.map(u => [u.id, u]))

      // Batch fetch unread counts per sender
      const unreadCounts = await prisma.message.groupBy({
        by: ['senderId'],
        where: {
          receiverId: session.user.id,
          isRead: false,
          senderId: { in: userIds },
        },
        _count: true,
      })
      const unreadMap = new Map(unreadCounts.map(u => [u.senderId, u._count]))

      // Fetch last message per conversation partner in a single batch
      // We need to get the most recent message for each conversation
      const allRecentMessages = await prisma.message.findMany({
        where: {
          OR: userIds.flatMap(uid => [
            { senderId: session.user.id, receiverId: uid },
            { senderId: uid, receiverId: session.user.id },
          ]),
        },
        orderBy: { createdAt: 'desc' },
      })

      // Group by partner and get latest per partner
      const lastMessageMap = new Map<string, typeof allRecentMessages[0]>()
      for (const msg of allRecentMessages) {
        const partnerId = msg.senderId === session.user.id ? msg.receiverId : msg.senderId
        if (!lastMessageMap.has(partnerId)) {
          lastMessageMap.set(partnerId, msg)
        }
      }

      const conversations = userIds.map(userId => ({
        user: userMap.get(userId) || null,
        lastMessage: lastMessageMap.get(userId) || null,
        unreadCount: unreadMap.get(userId) || 0,
      })).filter(c => c.user != null)

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
