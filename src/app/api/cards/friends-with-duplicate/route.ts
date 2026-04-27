import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth'

// GET /api/cards/friends-with-duplicate?cardName=Halasana
// Returns which friends have that card as a duplicate (can gift it)
export async function GET(request: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const cardName = searchParams.get('cardName')
  if (!cardName) return NextResponse.json({ error: 'cardName required' }, { status: 400 })

  // Get accepted friends
  const friendships = await prisma.friendship.findMany({
    where: {
      status: 'ACCEPTED',
      OR: [{ requesterId: session.userId }, { receiverId: session.userId }],
    },
    include: {
      requester: { select: { id: true, name: true, username: true } },
      receiver:  { select: { id: true, name: true, username: true } },
    },
  })

  const friendUsers = friendships.map(f =>
    f.requesterId === session.userId ? f.receiver : f.requester
  )

  // For each friend, check how many of this card they have scratched, and find a giftable duplicate
  const results = await Promise.all(
    friendUsers.map(async friend => {
      // Find all scratched copies of this card for the friend
      const theirCards = await prisma.userCard.findMany({
        where: {
          userId: friend.id,
          status: 'SCRATCHED',
          cardTemplate: { name: cardName },
        },
        select: { id: true, isDuplicate: true },
      })

      const totalCount = theirCards.length
      // A duplicate card they can gift
      const giftableCard = theirCards.find(c => c.isDuplicate)

      const hasDuplicate = !!giftableCard

      return {
        id: friend.id,
        name: friend.name,
        username: friend.username,
        hasDuplicate,
        duplicateCount: theirCards.filter(c => c.isDuplicate).length,
        duplicateCardId: giftableCard?.id ?? null,
        totalCount,
      }
    })
  )

  return NextResponse.json({ friends: results })
}
