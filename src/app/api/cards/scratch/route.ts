import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth'
import { checkAndAdvanceLevel } from '@/lib/levelCheck'

export async function POST(request: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { cardId } = await request.json()

    const card = await prisma.userCard.findFirst({
      where: { id: cardId, userId: session.userId, status: 'UNSCRATCHED' },
      include: { cardTemplate: true }
    })
    if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 })

    // Mark as scratched
    await prisma.userCard.update({
      where: { id: cardId },
      data: { status: 'SCRATCHED', scratchedAt: new Date() }
    })

    // Check level completion using shared helper
    const { uniqueCollected, uniqueNeeded, levelCompleted, rewards } =
      await checkAndAdvanceLevel(session.userId)

    return NextResponse.json({
      success: true,
      card: { ...card, status: 'SCRATCHED' },
      uniqueCollected,
      uniqueNeeded,
      levelCompleted,
      rewards,
    })
  } catch (error) {
    console.error('Scratch error:', error)
    return NextResponse.json({ error: 'Scratch failed' }, { status: 500 })
  }
}
