import { getPosesForLevel, UNIQUE_NEEDED } from './yogaPoses'

export interface LevelConfig {
  level: number
  uniqueCardTypes: number
  yogaDays: number
  points: number
  isBonusLevel: boolean
  label: string
  emoji: string
}

export function getLevelConfig(level: number): LevelConfig {
  const clampedLevel = Math.min(Math.max(level, 1), 10)
  const isBonusLevel = clampedLevel % 5 === 0
  const uniqueCardTypes = UNIQUE_NEEDED[clampedLevel] ?? 2

  if (isBonusLevel) {
    return {
      level: clampedLevel,
      uniqueCardTypes,
      yogaDays: clampedLevel * 7 + 30,
      points: 1000,
      isBonusLevel: true,
      label: `⭐ BONUS LEVEL ${clampedLevel}`,
      emoji: '🏆',
    }
  }

  return {
    level: clampedLevel,
    uniqueCardTypes,
    yogaDays: clampedLevel * 7,
    points: clampedLevel * 50,
    isBonusLevel: false,
    label: `Level ${clampedLevel}`,
    emoji: clampedLevel <= 3 ? '🌱' : clampedLevel <= 6 ? '🌿' : '🌳',
  }
}

export function getCardTemplatesForLevel(level: number) {
  const raw = getPosesForLevel(level)
  const poses = raw.length > 0 ? raw : getPosesForLevel(1)
  return poses.map(p => ({
    name: p.name,
    description: p.benefits,
    emoji: p.emoji,
    rarity: p.rarity,
    weight: p.weight,
  }))
}
