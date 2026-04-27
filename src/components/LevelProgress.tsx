'use client'
import { motion } from 'framer-motion'
import FlipCard from './FlipCard'

interface CollectionCard {
  id: string; name: string; emoji: string; rarity: string
  description: string; collected: boolean; source?: string
}

interface LevelProgressProps {
  currentLevel: number; uniqueCollected: number; uniqueNeeded: number
  collection: CollectionCard[]; isBonusLevel: boolean; points: number; yogaDays: number
  completedLevels: number[]; onRequestCard?: (cardName: string, cardEmoji: string) => void
}

export default function LevelProgress({
  currentLevel, uniqueCollected, uniqueNeeded, collection,
  isBonusLevel, points, yogaDays, completedLevels, onRequestCard,
}: LevelProgressProps) {
  const progress  = Math.min((uniqueCollected / uniqueNeeded) * 100, 100)
  const remaining = uniqueNeeded - uniqueCollected

  return (
    <div className="space-y-5">

      {/* ── Level header ── */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`relative rounded-3xl p-5 border-[3px] overflow-hidden ${
          isBonusLevel
            ? 'border-amber-400 bg-gradient-to-br from-amber-950 via-[#1f1000] to-orange-950'
            : 'border-violet-400 bg-gradient-to-br from-violet-950 via-[#130d2e] to-indigo-950'
        } ${isBonusLevel ? 'card-shadow-gold' : 'card-shadow-violet'}`}
      >
        {/* shine */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/8 via-transparent to-transparent pointer-events-none" />

        <div className="flex items-center justify-between mb-4 relative z-10">
          <div>
            <p className="text-white/50 text-xs font-bold uppercase tracking-widest">Current Level</p>
            <h2 className={`text-3xl font-black mt-0.5 ${isBonusLevel ? 'shimmer-text' : 'text-white'}`}>
              {isBonusLevel ? '⭐ BONUS ' : ''}Level {currentLevel}
            </h2>
          </div>
          <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center border-2 ${
            isBonusLevel ? 'border-amber-400/60 bg-amber-500/20' : 'border-violet-400/60 bg-violet-500/20'
          }`}>
            <p className="text-2xl font-black text-white leading-none">{uniqueCollected}</p>
            <p className={`text-xs font-bold ${isBonusLevel ? 'text-amber-300' : 'text-violet-300'}`}>/{uniqueNeeded}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-4 bg-white/10 rounded-full overflow-hidden border border-white/10 relative z-10">
          <motion.div
            className="h-full rounded-full progress-animated"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between mt-2 relative z-10">
          <p className="text-white/40 text-xs font-bold">{Math.round(progress)}% complete</p>
          {remaining > 0 && (
            <p className="text-white/40 text-xs font-bold">{remaining} more card{remaining > 1 ? 's' : ''} to go!</p>
          )}
        </div>
      </motion.div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}
          className="rounded-2xl p-4 border-[3px] border-pink-400 bg-gradient-to-br from-pink-950 via-[#1a0820] to-purple-950 card-shadow-violet"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/6 to-transparent rounded-2xl pointer-events-none" />
          <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-1">Total Points</p>
          <p className="text-2xl font-black text-pink-300">✨ {points}</p>
          <p className="text-white/30 text-xs font-semibold mt-1">≈ ₹{(points / 10).toFixed(0)} value</p>
        </motion.div>
        <motion.div
          initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.15 }}
          className="rounded-2xl p-4 border-[3px] border-emerald-400 bg-gradient-to-br from-emerald-950 via-[#071a10] to-teal-950 card-shadow-blue"
        >
          <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-1">Yoga Days</p>
          <p className="text-2xl font-black text-emerald-300">🧘 {yogaDays}</p>
          <p className="text-white/30 text-xs font-semibold mt-1">days of free yoga</p>
        </motion.div>
      </div>

      {/* ── Card collection grid ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white/70 text-sm font-black uppercase tracking-widest">
            🃏 Level {currentLevel} Cards
          </h3>
          <span className="text-white/30 text-[10px] font-semibold">Tap to flip</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {collection.map((card, i) => (
            <motion.div
              key={card.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.35, delay: i * 0.07 }}
              className="space-y-2"
            >
              <FlipCard
                name={card.name}
                emoji={card.emoji}
                rarity={card.rarity as 'COMMON' | 'RARE' | 'EPIC'}
                collected={card.collected}
                source={card.source}
              />
              {!card.collected && onRequestCard && (
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={() => onRequestCard(card.name, card.emoji)}
                  className="w-full py-2 rounded-xl bg-indigo-500/25 text-indigo-200 text-[10px] font-black border-2 border-indigo-400/50 active:bg-indigo-500/40 transition-colors tracking-wide"
                >
                  🙏 Ask Friend
                </motion.button>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Journey timeline ── */}
      {completedLevels.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl overflow-hidden border-[3px] border-white/15 bg-gradient-to-br from-white/5 to-transparent"
        >
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <h3 className="text-white/80 text-xs font-black uppercase tracking-widest">🏅 Journey So Far</h3>
            <span className="text-white/30 text-[10px] font-bold">{completedLevels.length} done</span>
          </div>
          <div className="px-4 pb-4 flex items-center gap-0 overflow-x-auto">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((l, idx) => {
              const done = completedLevels.includes(l)
              const isBonus = l % 5 === 0
              const isCurrent = l === currentLevel
              return (
                <div key={l} className="flex items-center shrink-0">
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: idx * 0.06 }}
                    className={`relative flex items-center justify-center rounded-full font-black border-[2.5px] transition-all ${
                      isBonus
                        ? done
                          ? 'w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 border-amber-300 card-shadow-gold'
                          : isCurrent
                          ? 'w-10 h-10 bg-amber-900/40 border-amber-400/70 text-amber-300'
                          : 'w-10 h-10 bg-white/5 border-white/15 text-white/20'
                        : done
                        ? 'w-8 h-8 bg-gradient-to-br from-violet-500 to-pink-500 border-violet-300 card-shadow-violet'
                        : isCurrent
                        ? 'w-8 h-8 bg-violet-900/50 border-violet-400/70 text-violet-300'
                        : 'w-8 h-8 bg-white/5 border-white/12 text-white/20'
                    }`}
                  >
                    {done
                      ? isBonus ? <span className="text-base">⭐</span> : <span className="text-sm">✓</span>
                      : isCurrent
                      ? <span className={isBonus ? 'text-base' : 'text-sm'}>🧘</span>
                      : <span className="text-[9px] text-white/30">{l}</span>
                    }
                    {isCurrent && (
                      <motion.div
                        className={`absolute inset-0 rounded-full border-[2px] ${isBonus ? 'border-amber-400/70' : 'border-violet-400/70'}`}
                        animate={{ scale: [1, 1.4, 1], opacity: [0.7, 0, 0.7] }}
                        transition={{ duration: 1.8, repeat: Infinity }}
                      />
                    )}
                  </motion.div>
                  {l < 10 && (
                    <div className={`h-1 w-3 mx-0.5 rounded-full ${
                      done ? 'progress-animated' : 'bg-white/8'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
          <div className="mx-4 mb-4 grid grid-cols-3 gap-2">
            <div className="bg-pink-500/15 border-2 border-pink-400/30 rounded-2xl px-3 py-2.5 text-center">
              <p className="text-pink-300 font-black text-sm">{completedLevels.reduce((s, l) => s + (l % 5 === 0 ? 1000 : l * 50), 0)}</p>
              <p className="text-white/35 text-[9px] mt-0.5 font-bold">pts earned</p>
            </div>
            <div className="bg-emerald-500/15 border-2 border-emerald-400/30 rounded-2xl px-3 py-2.5 text-center">
              <p className="text-emerald-300 font-black text-sm">{completedLevels.reduce((s, l) => s + (l % 5 === 0 ? l * 7 + 30 : l * 7), 0)}</p>
              <p className="text-white/35 text-[9px] mt-0.5 font-bold">yoga days</p>
            </div>
            <div className="bg-amber-500/15 border-2 border-amber-400/30 rounded-2xl px-3 py-2.5 text-center">
              <p className="text-amber-300 font-black text-sm">{completedLevels.filter(l => l % 5 === 0).length}</p>
              <p className="text-white/35 text-[9px] mt-0.5 font-bold">bonus lvls</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
