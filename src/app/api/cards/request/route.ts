import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth'

// POST /api/cards/request — ask a friend to gift you a card
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { targetUserId, cardName, duplicateCardId } = await request.json()
    if (!targetUserId) return NextResponse.json({ error: 'Target user required' }, { status: 400 })

    const [me, target] = await Promise.all([
      prisma.user.findUnique({ where: { id: session.userId }, select: { id: true, name: true, username: true } }),
      prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true, name: true } }),
    ])

    if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (target.id === session.userId) return NextResponse.json({ error: 'Cannot request from yourself' }, { status: 400 })

    // Check they're actually friends
    const friendship = await prisma.friendship.findFirst({
      where: {
        status: 'ACCEPTED',
        OR: [
          { requesterId: session.userId, receiverId: target.id },
          { requesterId: target.id, receiverId: session.userId },
        ],
      },
    })
    if (!friendship) return NextResponse.json({ error: 'You can only request cards from friends' }, { status: 403 })

    const cardLabel = cardName ?? 'a card'
    const hasDuplicate = !!duplicateCardId
    const displayText = hasDuplicate
      ? `${me?.name} wants your spare ${cardLabel} card. Tap Gift below to send it directly!`
      : `${me?.name} is hoping you'll get a duplicate ${cardLabel} card to gift them someday.`
    const meta = JSON.stringify({
      requesterUserId: session.userId,
      requesterUsername: me?.username ?? null,
      requesterName: me?.name ?? null,
      cardName: cardLabel,
      duplicateCardId: duplicateCardId ?? null,
    })

    await prisma.notification.create({
      data: {
        userId: target.id,
        type: 'CARD_REQUEST',
        title: `🙏 ${me?.name ?? 'A friend'} wants your ${cardLabel}!`,
        body: `${displayText}||${meta}`,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Card request error:', error)
    return NextResponse.json({ error: 'Failed to send request', detail: String(error) }, { status: 500 })
  }
}
