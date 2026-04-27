import { prisma } from '@/lib/prisma'
import { getLevelConfig } from '@/lib/levels'
import { UNIQUE_NEEDED, CUMULATIVE_NEEDED } from '@/lib/yogaPoses'

export interface LevelCheckResult {
  uniqueCollected: number
  uniqueNeeded: number
  levelCompleted: boolean
  rewards: { points: number; yogaDays: number; isBonusLevel: boolean; nextLevel: number } | null
}

/**
 * After any card is added to a user's SCRATCHED collection (scratch or gift),
 * check whether they've now completed their current level and advance them if so.
 */
export async function checkAndAdvanceLevel(userId: string): Promise<LevelCheckResult> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return { uniqueCollected: 0, uniqueNeeded: 2, levelCompleted: false, rewards: null }

  const levelConfig = getLevelConfig(user.currentLevel)
  const uniqueNeeded = UNIQUE_NEEDED[user.currentLevel] ?? levelConfig.uniqueCardTypes

  // Count total unique non-duplicate scratched cards across whole collection
  const allScratched = await prisma.userCard.findMany({
    where: { userId: user.id, status: 'SCRATCHED', isDuplicate: false },
    select: { cardTemplateId: true },
  })
  const totalUnique = new Set(allScratched.map(c => c.cardTemplateId)).size

  const prevCumulative = user.currentLevel > 1 ? (CUMULATIVE_NEEDED[user.currentLevel - 1] ?? 0) : 0
  const uniqueCollected = Math.max(0, totalUnique - prevCumulative)

  let levelCompleted = false
  let rewards: LevelCheckResult['rewards'] = null

  if (uniqueCollected >= uniqueNeeded) {
    const existing = await prisma.levelProgress.findUnique({
      where: { userId_level: { userId: user.id, level: user.currentLevel } },
    })

    if (!existing?.isCompleted) {
      await prisma.levelProgress.upsert({
        where: { userId_level: { userId: user.id, level: user.currentLevel } },
        update: { isCompleted: true, completedAt: new Date() },
        create: { userId: user.id, level: user.currentLevel, isCompleted: true, completedAt: new Date() },
      })

      const nextLevel = user.currentLevel + 1
      await prisma.user.update({
        where: { id: user.id },
        data: {
          currentLevel: nextLevel,
          points: { increment: levelConfig.points },
          yogaDays: { increment: levelConfig.yogaDays },
        },
      })

      await prisma.levelProgress.upsert({
        where: { userId_level: { userId: user.id, level: nextLevel } },
        update: {},
        create: { userId: user.id, level: nextLevel },
      })

      levelCompleted = true
      rewards = {
        points: levelConfig.points,
        yogaDays: levelConfig.yogaDays,
        isBonusLevel: levelConfig.isBonusLevel,
        nextLevel,
      }

      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'LEVEL_UP',
          title: levelConfig.isBonusLevel ? '🏆 Bonus Level Unlocked!' : `🎉 Level ${nextLevel} Unlocked!`,
          body: levelConfig.isBonusLevel
            ? `You completed Level ${user.currentLevel} and unlocked a bonus level! You earned +${levelConfig.points} pts & +${levelConfig.yogaDays} yoga days.`
            : `You completed Level ${user.currentLevel}! You earned +${levelConfig.points} pts & +${levelConfig.yogaDays} yoga days. Keep going!`,
        },
      })
    }
  }

  return { uniqueCollected, uniqueNeeded, levelCompleted, rewards }
}
