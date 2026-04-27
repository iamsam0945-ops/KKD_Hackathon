import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth'

// GET /api/notifications — fetch all notifications for current user
export async function GET() {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const notifications = await prisma.notification.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const unreadCount = notifications.filter(n => !n.read).length

  return NextResponse.json({ notifications, unreadCount })
}

// PATCH /api/notifications — mark all as read
export async function PATCH() {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.notification.updateMany({
    where: { userId: session.userId, read: false },
    data: { read: true },
  })

  return NextResponse.json({ success: true })
}
