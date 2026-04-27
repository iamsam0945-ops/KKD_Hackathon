import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth'

// GET /api/friends — list accepted friends + pending incoming requests + leaderboard positions
export async function GET() {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.userId

  // Accepted friendships (I sent or they sent)
  const accepted = await prisma.friendship.findMany({
    where: {
      status: 'ACCEPTED',
      OR: [{ requesterId: userId }, { receiverId: userId }],
    },
    include: {
      requester: { select: { id: true, name: true, username: true, currentLevel: true, points: true } },
      receiver:  { select: { id: true, name: true, username: true, currentLevel: true, points: true } },
    },
  })

  const friends = accepted.map(f => {
    const friend = f.requesterId === userId ? f.receiver : f.requester
    return { ...friend, friendshipId: f.id }
  })

  // Incoming pending requests
  const incoming = await prisma.friendship.findMany({
    where: { receiverId: userId, status: 'PENDING' },
    include: { requester: { select: { id: true, name: true, username: true, currentLevel: true } } },
  })

  // Outgoing pending
  const outgoing = await prisma.friendship.findMany({
    where: { requesterId: userId, status: 'PENDING' },
    include: { receiver: { select: { id: true, name: true, username: true } } },
  })

  return NextResponse.json({
    friends,
    incoming: incoming.map(r => ({ ...r.requester, friendshipId: r.id })),
    outgoing: outgoing.map(r => ({ ...r.receiver, friendshipId: r.id })),
  })
}

// POST /api/friends — send friend request by username
export async function POST(request: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { username } = await request.json()
  if (!username) return NextResponse.json({ error: 'Username required' }, { status: 400 })

  const target = await prisma.user.findUnique({ where: { username } })
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (target.id === session.userId) return NextResponse.json({ error: 'Cannot add yourself' }, { status: 400 })

  // Check existing
  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: session.userId, receiverId: target.id },
        { requesterId: target.id, receiverId: session.userId },
      ],
    },
  })
  if (existing) {
    if (existing.status === 'ACCEPTED') return NextResponse.json({ error: 'Already friends' }, { status: 409 })
    if (existing.status === 'PENDING') return NextResponse.json({ error: 'Request already sent' }, { status: 409 })
  }

  const friendship = await prisma.friendship.create({
    data: { requesterId: session.userId, receiverId: target.id },
  })

  return NextResponse.json({ success: true, friendshipId: friendship.id, targetName: target.name })
}

// PATCH /api/friends — accept or reject a request
export async function PATCH(request: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { friendshipId, action } = await request.json()
  if (!['accept', 'reject'].includes(action)) return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  const friendship = await prisma.friendship.findFirst({
    where: { id: friendshipId, receiverId: session.userId, status: 'PENDING' },
    include: {
      receiver: { select: { name: true } },
    },
  })
  if (!friendship) return NextResponse.json({ error: 'Request not found' }, { status: 404 })

  await prisma.friendship.update({
    where: { id: friendshipId },
    data: { status: action === 'accept' ? 'ACCEPTED' : 'DECLINED' },
  })

  // Notify the requester of the outcome
  const receiverName = friendship.receiver.name
  if (action === 'accept') {
    await prisma.notification.create({
      data: {
        userId: friendship.requesterId,
        type: 'FRIEND_ACCEPTED',
        title: '🤝 Friend request accepted!',
        body: `${receiverName} accepted your friend request. You can now see each other on the map!`,
      },
    })
  } else {
    await prisma.notification.create({
      data: {
        userId: friendship.requesterId,
        type: 'FRIEND_REJECTED',
        title: '❌ Friend request declined',
        body: `${receiverName} declined your friend request.`,
      },
    })
  }

  return NextResponse.json({ success: true })
}
