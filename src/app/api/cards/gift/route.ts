import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth'
import { checkAndAdvanceLevel } from '@/lib/levelCheck'

export async function POST(request: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { cardId, cardName, recipientUsername } = await request.json()

    // Find duplicate card either by explicit ID or by card name (fallback)
    const card = cardId
      ? await prisma.userCard.findFirst({
          where: { id: cardId, userId: session.userId, isDuplicate: true, status: 'SCRATCHED' },
          include: { cardTemplate: true },
        })
      : await prisma.userCard.findFirst({
          where: { userId: session.userId, isDuplicate: true, status: 'SCRATCHED', cardTemplate: { name: cardName } },
          include: { cardTemplate: true },
        })
    if (!card) return NextResponse.json({ error: 'No duplicate card found to gift' }, { status: 404 })

    const recipient = await prisma.user.findUnique({ where: { username: recipientUsername } })
    if (!recipient) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (recipient.id === session.userId) return NextResponse.json({ error: 'Cannot gift to yourself' }, { status: 400 })

    // Mark original as gifted
    await prisma.userCard.update({
      where: { id: card.id },
      data: { status: 'GIFTED' }
    })

    // Check if recipient already has this card scratched → mark as duplicate so they can re-gift
    const recipientAlreadyHas = await prisma.userCard.findFirst({
      where: { userId: recipient.id, cardTemplateId: card.cardTemplateId, status: 'SCRATCHED' },
    })

    // Create new card for recipient
    await prisma.userCard.create({
      data: {
        userId: recipient.id,
        cardTemplateId: card.cardTemplateId,
        source: 'GIFTED',
        isDuplicate: !!recipientAlreadyHas,   // duplicate if they already own one
        giftedByUserId: session.userId,
        status: 'SCRATCHED',
      }
    })

    // Notify recipient
    const sender = await prisma.user.findUnique({ where: { id: session.userId }, select: { name: true } })
    await prisma.notification.create({
      data: {
        userId: recipient.id,
        type: 'CARD_RECEIVED',
        title: '🎁 You received a card!',
        body: `${sender?.name ?? 'Someone'} gifted you a ${card.cardTemplate.name} ${card.cardTemplate.imageEmoji} card!`,
      },
    })

    // Check if receiving this gifted card completes the recipient's current level
    await checkAndAdvanceLevel(recipient.id)

    return NextResponse.json({ success: true, message: `Card gifted to ${recipient.name}!` })
  } catch (error) {
    console.error('Gift error:', error)
    return NextResponse.json({ error: 'Gift failed' }, { status: 500 })
  }
}
