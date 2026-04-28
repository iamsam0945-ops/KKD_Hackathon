import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth'
import yogaPoses from '@/lib/yogaPoses'

// GET /api/referral - get referral stats for current user
export async function GET() {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const referrals = await prisma.referral.findMany({
    where: { referrerId: session.userId },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json({ referrals })
}

// POST /api/referral - convert a referral (User B submits form)
export async function POST(request: NextRequest) {
  try {
    const { token, leadName, leadPhone } = await request.json()

    if (!token || !leadName || !leadPhone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Find referrer
    const referrer = await prisma.user.findUnique({ where: { referralToken: token } })
    if (!referrer) return NextResponse.json({ error: 'Invalid referral link' }, { status: 404 })

    // Check if this phone has already been used for this referrer
    const existingLead = await prisma.referral.findFirst({
      where: { referrerId: referrer.id, leadPhone }
    })
    if (existingLead) return NextResponse.json({ error: 'This number has already been used' }, { status: 409 })

    // Create referral record
    const referral = await prisma.referral.create({
      data: {
        referrerId: referrer.id,
        leadName,
        leadPhone,
        status: 'CONVERTED',
        convertedAt: new Date(),
      }
    })

    // Grant scratch card to referrer
    await grantScratchCard(referrer.id, referrer.currentLevel, 'REFERRAL')

    // Mark referral as rewarded
    await prisma.referral.update({ where: { id: referral.id }, data: { status: 'REWARDED' } })

    return NextResponse.json({ success: true, message: `${referrer.name} just earned a scratch card!` })
  } catch (error) {
    console.error('Referral convert error:', error)
    return NextResponse.json({ error: 'Failed to process referral' }, { status: 500 })
  }
}

// Duplicate injection rate INCREASES with level.
// Low levels: mostly fresh cards to build the collection.
// High levels: more duplicates = active trading economy.
const DUPLICATE_INJECTION_RATE: Record<number, number> = {
  1: 0.21,
  2: 0.28,
  3: 0.35,
  4: 0.42,
  5: 0.48,  // bonus level
  6: 0.54,
  7: 0.60,
  8: 0.65,
  9: 0.70,
  10: 0.75, // 75% — trading machines at the top
}

const DUPLICATES_ALLOWED_FROM_LEVEL = 2

// When injecting a forced duplicate, strongly bias toward COMMON.
// RARE/EPIC dupes remain rare and feel genuinely lucky.
const DUP_RARITY_WEIGHT: Record<string, number> = {
  COMMON: 100,
  RARE: 12,
  EPIC: 2,
}

// COMMON card weight scales DOWN as level increases.
// At L1 full weight (×1.0). At L10 reduced to ×0.25.
// RARE/EPIC weights stay the same → they become relatively more likely.
function scaledWeight(baseWeight: number, rarity: string, level: number): number {
  if (rarity !== 'COMMON') return baseWeight
  const scale = Math.max(0.25, 1 - (level - 1) * 0.083) // 1.0 → 0.25 over 10 levels
  return Math.max(1, Math.round(baseWeight * scale))
}

export async function grantScratchCard(userId: string, level: number, source: string) {
  const allTemplates = await ensureAllCardTemplates()
  if (allTemplates.length === 0) return null

  // Level-specific pool (fallback: global)
  const levelTemplates = allTemplates.filter(t => t.level === level)
  const pool = levelTemplates.length > 0 ? levelTemplates : allTemplates
  const poolTemplateIds = pool.map((t) => t.id)

  // What the user already has scratched (unique non-duplicate)
  const existingScratched = await prisma.userCard.findMany({
    where: { userId, status: 'SCRATCHED', isDuplicate: false },
    include: { cardTemplate: true },
  })
  const scratchedTemplateIds = new Set(existingScratched.map(c => c.cardTemplateId))
  const ownedTemplates = existingScratched.map(c => c.cardTemplate)
  const duplicateGuardOwned = await prisma.userCard.findMany({
    where: {
      userId,
      cardTemplateId: { in: poolTemplateIds },
    },
    select: { cardTemplateId: true },
  })
  const ownedTemplateIds = new Set(duplicateGuardOwned.map((c) => c.cardTemplateId))
  const allowDuplicates = level >= DUPLICATES_ALLOWED_FROM_LEVEL

  // Roll: should this card be a forced duplicate?
  const dupRate = DUPLICATE_INJECTION_RATE[level] ?? 0.30
  const forceDuplicate =
    allowDuplicates && Math.random() < dupRate && ownedTemplates.length > 0

  let selectedTemplate = pool[0]
  let isDuplicate = false

  if (forceDuplicate) {
    // Pick from already-owned cards — bias strongly toward COMMON
    const totalDupWeight = ownedTemplates.reduce(
      (s, t) => s + (DUP_RARITY_WEIGHT[t.rarity] ?? 10), 0
    )
    let rand = Math.random() * totalDupWeight
    for (const t of ownedTemplates) {
      rand -= DUP_RARITY_WEIGHT[t.rarity] ?? 10
      if (rand <= 0) { selectedTemplate = t; break }
    }
    isDuplicate = true
  } else {
    // Before Level 2, block duplicate assignment even for unscratch cards.
    // After Level 2, original "fresh vs scratched" behavior remains.
    const freshPool = allowDuplicates
      ? pool.filter((t) => !scratchedTemplateIds.has(t.id))
      : pool.filter((t) => !ownedTemplateIds.has(t.id))
    const activePool = freshPool.length > 0 ? freshPool : pool

    const totalWeight = activePool.reduce(
      (s, t) => s + scaledWeight(t.dropWeight, t.rarity, level), 0
    )
    let rand = Math.random() * totalWeight
    for (const t of activePool) {
      rand -= scaledWeight(t.dropWeight, t.rarity, level)
      if (rand <= 0) { selectedTemplate = t; break }
    }
    isDuplicate = allowDuplicates
      ? scratchedTemplateIds.has(selectedTemplate.id)
      : ownedTemplateIds.has(selectedTemplate.id)
  }

  const card = await prisma.userCard.create({
    data: { userId, cardTemplateId: selectedTemplate.id, source, isDuplicate },
  })
  return card
}

async function ensureAllCardTemplates() {
  const existing = await prisma.cardTemplate.findMany()
  const existingByName = new Map(existing.map(t => [t.name, t]))
  const result = [...existing]

  for (const p of yogaPoses) {
    const tmpl = existingByName.get(p.name)
    if (!tmpl) {
      const card = await prisma.cardTemplate.create({
        data: { level: p.level, name: p.name, description: p.benefits, imageEmoji: p.emoji, rarity: p.rarity, dropWeight: p.weight }
      })
      result.push(card)
    } else if (tmpl.dropWeight !== p.weight || tmpl.rarity !== p.rarity) {
      // Sync weight/rarity if changed
      await prisma.cardTemplate.update({
        where: { id: tmpl.id },
        data: { dropWeight: p.weight, rarity: p.rarity },
      })
      tmpl.dropWeight = p.weight
      tmpl.rarity = p.rarity as typeof tmpl.rarity
    }
  }
  return result
}
