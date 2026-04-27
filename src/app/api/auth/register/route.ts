import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/auth'
import yogaPoses from '@/lib/yogaPoses'
import { grantScratchCard } from '@/app/api/referral/route'
import { v4 as uuidv4 } from 'uuid'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { name, phone, username, password, referralToken: incomingReferralToken } = await request.json()

    if (!name || !phone || !username || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ phone }, { username }] }
    })
    if (existing) {
      return NextResponse.json({ error: 'Phone or username already taken' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const myReferralToken = uuidv4().replace(/-/g, '').slice(0, 12)

    const user = await prisma.user.create({
      data: { name, phone, username, passwordHash, referralToken: myReferralToken }
    })

    // Seed ALL card templates; update weights/rarity if changed
    for (const p of yogaPoses) {
      const tmplExists = await prisma.cardTemplate.findFirst({ where: { name: p.name } })
      if (!tmplExists) {
        await prisma.cardTemplate.create({
          data: { level: p.level, name: p.name, description: p.benefits, imageEmoji: p.emoji, rarity: p.rarity, dropWeight: p.weight }
        })
      } else if (tmplExists.dropWeight !== p.weight || tmplExists.rarity !== p.rarity) {
        await prisma.cardTemplate.update({ where: { id: tmplExists.id }, data: { dropWeight: p.weight, rarity: p.rarity } })
      }
    }

    // Give one random Level 1 card as signup bonus
    await grantScratchCard(user.id, 1, 'WELCOME')

    // Init level progress
    await prisma.levelProgress.create({ data: { userId: user.id, level: 1 } })

    // If user joined via a referral link — reward the referrer
    if (incomingReferralToken) {
      const referrer = await prisma.user.findUnique({ where: { referralToken: incomingReferralToken } })
      if (referrer && referrer.id !== user.id) {
        // Create referral record
        await prisma.referral.create({
          data: { referrerId: referrer.id, leadName: name, leadPhone: phone, status: 'REWARDED', convertedAt: new Date() }
        })
        // Give referrer a scratch card using level-aware duplicate injection
        await grantScratchCard(referrer.id, referrer.currentLevel, 'REFERRAL')
        // Notify referrer
        await prisma.notification.create({
          data: {
            userId: referrer.id,
            type: 'CARD_RECEIVED',
            title: '🃏 You earned a scratch card!',
            body: `${name} joined YogaQuest using your referral link! Scratch your new card now.`,
          }
        })
      }
    }

    const token = signToken({ userId: user.id, username: user.username })
    const cookieStore = await cookies()
    cookieStore.set('token', token, { httpOnly: true, maxAge: 60 * 60 * 24 * 7, path: '/' })

    return NextResponse.json({ success: true, user: { id: user.id, name: user.name, username: user.username, referralToken: myReferralToken } })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
