import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const moderationActionSchema = z.object({
  reportId: z.string().uuid(),
  action: z.enum(['DISMISS', 'REMOVE_CONTENT', 'BAN_USER']),
})

// PUT - Take moderation action on a report
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const result = moderationActionSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { reportId, action } = result.data

    const report = await prisma.report.findUnique({
      where: { id: reportId },
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    if (report.status !== 'PENDING') {
      return NextResponse.json({ error: 'Report already resolved' }, { status: 400 })
    }

    // Perform the action
    if (action === 'DISMISS') {
      await prisma.report.update({
        where: { id: reportId },
        data: {
          status: 'DISMISSED',
          resolvedBy: session.user.id,
          resolvedAt: new Date(),
        },
      })
    } else if (action === 'REMOVE_CONTENT') {
      // Remove the reported content
      if (report.targetType === 'PRODUCT') {
        await prisma.product.update({
          where: { id: report.targetId },
          data: { status: 'DELETED' },
        })
      } else if (report.targetType === 'COMMENT') {
        await prisma.comment.delete({
          where: { id: report.targetId },
        }).catch(() => {
          // Comment may already be deleted
        })
      }

      await prisma.report.update({
        where: { id: reportId },
        data: {
          status: 'ACTION_TAKEN',
          resolvedBy: session.user.id,
          resolvedAt: new Date(),
        },
      })
    } else if (action === 'BAN_USER') {
      // Find the user who owns the reported content
      let targetUserId: string | null = null

      if (report.targetType === 'USER') {
        targetUserId = report.targetId
      } else if (report.targetType === 'PRODUCT') {
        const product = await prisma.product.findUnique({
          where: { id: report.targetId },
          select: { farmerId: true },
        })
        targetUserId = product?.farmerId || null
      } else if (report.targetType === 'COMMENT') {
        const comment = await prisma.comment.findUnique({
          where: { id: report.targetId },
          select: { userId: true },
        })
        targetUserId = comment?.userId || null
      }

      if (targetUserId) {
        await prisma.user.update({
          where: { id: targetUserId },
          data: { status: 'SUSPENDED' },
        })
      }

      await prisma.report.update({
        where: { id: reportId },
        data: {
          status: 'ACTION_TAKEN',
          resolvedBy: session.user.id,
          resolvedAt: new Date(),
        },
      })
    }

    return NextResponse.json({ success: true, action })
  } catch (error) {
    console.error('Moderation action error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
