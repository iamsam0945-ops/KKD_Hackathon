import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth'
import { getLevelConfig } from '@/lib/levels'
import yogaPoses, { UNIQUE_NEEDED } from '@/lib/yogaPoses'

export async function GET() {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.userId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const levelConfig = getLevelConfig(user.currentLevel)
  const uniqueNeeded = UNIQUE_NEEDED[user.currentLevel] ?? levelConfig.uniqueCardTypes

  // Get all yoga poses for the current level — source of truth for what cards exist
  const levelPoses = yogaPoses.filter(p => p.level === user.currentLevel)

  // All unique scratched non-duplicate cards across entire collection
  const allScratched = await prisma.userCard.findMany({
    where: { userId: user.id, status: 'SCRATCHED', isDuplicate: false },
    include: { cardTemplate: true },
    orderBy: { scratchedAt: 'asc' },
  })

  // Build a set of scratched template names (name is the stable key matching yogaPoses)
  const scratchedByName = new Map(
    allScratched.map(c => [c.cardTemplate.name, c])
  )

  // Build collection: all current-level poses, sorted collected-first
  const allLevelCards = levelPoses
    .sort((a, b) => {
      const aCollected = scratchedByName.has(a.name) ? 1 : 0
      const bCollected = scratchedByName.has(b.name) ? 1 : 0
      if (aCollected !== bCollected) return bCollected - aCollected // collected first
      return b.weight - a.weight // within group: common before epic
    })
    .map(p => {
      const userCard = scratchedByName.get(p.name)
      return {
        id: userCard?.cardTemplateId ?? `pose-${p.id}`,
        name: p.name,
        emoji: p.emoji,
        rarity: p.rarity,
        description: p.benefits,
        collected: !!userCard,
        source: userCard?.source,
      }
    })

  // Cap display to exactly uniqueNeeded slots:
  // Show all collected cards (up to uniqueNeeded), then fill remaining with uncollected
  const collectedCards   = allLevelCards.filter(c => c.collected).slice(0, uniqueNeeded)
  const uncollectedCards = allLevelCards.filter(c => !c.collected)
  const slotsLeft = Math.max(0, uniqueNeeded - collectedCards.length)
  const collectionCards = [...collectedCards, ...uncollectedCards.slice(0, slotsLeft)]

  // uniqueCollected = only level-specific cards collected — matches exactly what's shown in the grid
  const uniqueCollected = collectedCards.length

  // Unscratched cards count
  const unscratched = await prisma.userCard.count({
    where: { userId: user.id, status: 'UNSCRATCHED' },
  })

  // Completed levels
  const completedLevels = await prisma.levelProgress.findMany({
    where: { userId: user.id, isCompleted: true },
    orderBy: { level: 'asc' },
  })

  return NextResponse.json({
    currentLevel: user.currentLevel,
    levelConfig,
    collection: collectionCards,
    uniqueCollected,
    uniqueNeeded,
    unscratchedCount: unscratched,
    completedLevels: completedLevels.map(l => l.level),
    points: user.points,
    yogaDays: user.yogaDays,
  })
}
