import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, username: true, phone: true, countryCode: true, points: true, yogaDays: true, currentLevel: true, referralToken: true, createdAt: true }
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const referralCount = await prisma.referral.count({ where: { referrerId: user.id, status: 'REWARDED' } })
  const totalReferrals = await prisma.referral.count({ where: { referrerId: user.id } })

  return NextResponse.json({ user: { ...user, referralCount, totalReferrals } })
}
