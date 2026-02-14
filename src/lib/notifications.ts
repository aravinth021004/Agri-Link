import prisma from './prisma'

type NotificationType = 'ORDER_UPDATE' | 'NEW_FOLLOWER' | 'NEW_LIKE' | 'NEW_COMMENT' | 'SUBSCRIPTION_EXPIRY' | 'NEW_MESSAGE' | 'SYSTEM'

export async function createNotification({
  userId,
  type,
  title,
  message,
  link,
}: {
  userId: string
  type: NotificationType
  title: string
  message: string
  link?: string
}) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link,
      },
    })
  } catch (error) {
    console.error('Failed to create notification:', error)
  }
}
