import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cards = await prisma.userCard.findMany({
    where: { userId: session.userId },
    include: { cardTemplate: true },
    orderBy: { earnedAt: 'desc' }
  })

  return NextResponse.json({ cards })
}
