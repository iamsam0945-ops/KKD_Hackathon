'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import yogaPoses from '@/lib/yogaPoses'

interface FlipCardProps {
  name: string
  emoji: string
  rarity: 'COMMON' | 'RARE' | 'EPIC'
  collected: boolean
  source?: string
}

const RARITY_STYLES: Record<string, {
  border: string; bg: string; shadowClass: string;
  badge: string; badgeText: string;
  lockedBorder: string; lockedBg: string;
  glowColor: string; backBg: string;
}> = {
  COMMON: {
    border: 'border-violet-400',
    bg: 'from-violet-950 via-[#1a0d40] to-indigo-950',
    shadowClass: 'card-shadow-violet',
    badge: 'bg-violet-500/40 border-violet-300/60 text-violet-100',
    badgeText: 'COMMON',
    lockedBorder: 'border-violet-900/50',
    lockedBg: 'from-[#0e0920] to-[#08060f]',
    glowColor: 'rgba(139,92,246,0.6)',
    backBg: 'from-violet-950 via-[#180d38] to-indigo-950',
  },
  RARE: {
    border: 'border-sky-400',
    bg: 'from-sky-950 via-[#0a1a3a] to-blue-950',
    shadowClass: 'card-shadow-blue',
    badge: 'bg-sky-500/40 border-sky-300/60 text-sky-100',
    badgeText: 'RARE',
    lockedBorder: 'border-sky-900/50',
    lockedBg: 'from-[#07101e] to-[#040810]',
    glowColor: 'rgba(56,189,248,0.6)',
    backBg: 'from-sky-950 via-[#081830] to-blue-950',
  },
  EPIC: {
    border: 'border-amber-400',
    bg: 'from-amber-950 via-[#2a1500] to-orange-950',
    shadowClass: 'card-shadow-gold',
    badge: 'bg-amber-500/40 border-amber-300/60 text-amber-100',
    badgeText: 'EPIC ✦',
    lockedBorder: 'border-amber-900/40',
    lockedBg: 'from-[#150b00] to-[#0a0600]',
    glowColor: 'rgba(251,191,36,0.7)',
    backBg: 'from-amber-950 via-[#201000] to-orange-950',
  },
}

const SOURCE_LABEL: Record<string, string> = {
  WELCOME:  '🎁 Welcome',
  REFERRAL: '🔗 Referral',
  BONUS:    '⚡ Bonus',
  GIFTED:   '🤝 Gifted',
}

export default function FlipCard({ name, emoji, rarity, collected, source }: FlipCardProps) {
  const [flipped, setFlipped] = useState(false)
  const styles = RARITY_STYLES[rarity] ?? RARITY_STYLES.COMMON

  const pose = yogaPoses.find(p => p.name === name) ?? yogaPoses.find(p => p.english === name)
  const englishName = pose?.english ?? name
  const benefits    = pose?.benefits ?? 'Practice this pose mindfully and breathe deeply.'
  const steps       = pose?.steps   ?? ['Find a comfortable stance', 'Breathe deeply and hold', 'Release gently on exhale']

  function handleClick() {
    if (!collected) return
    setFlipped(f => !f)
  }

  return (
    <div
      className="relative w-full aspect-[3/4] cursor-pointer select-none"
      style={{ perspective: '1000px' }}
      onClick={handleClick}
    >
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* ── FRONT ── */}
        <div
          className={`absolute inset-0 rounded-2xl border-[3px] flex flex-col items-center justify-between p-3 overflow-hidden
            ${collected
              ? `${styles.border} ${styles.shadowClass} bg-gradient-to-br ${styles.bg}`
              : `${styles.lockedBorder} bg-gradient-to-br ${styles.lockedBg}`
            }`}
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* Inner shine overlay for collected cards */}
          {collected && (
            <div className="absolute inset-0 bg-gradient-to-br from-white/8 via-transparent to-transparent rounded-2xl pointer-events-none" />
          )}

          {/* Top row */}
          <div className="w-full flex items-center justify-between relative z-10">
            {collected && source ? (
              <span className="text-[9px] text-white/40 font-bold">{SOURCE_LABEL[source] ?? source}</span>
            ) : <span />}
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
              collected ? styles.badge : 'bg-white/5 border-white/10 text-white/20'
            }`}>
              {styles.badgeText}
            </span>
          </div>

          {/* Emoji */}
          <div className="relative flex flex-col items-center gap-2 z-10">
            <motion.div
              className={`text-6xl drop-shadow-lg ${!collected ? 'grayscale opacity-30' : ''}`}
              animate={collected ? { y: [0, -4, 0] } : {}}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              {emoji}
            </motion.div>
            {!collected && (
              <div className="absolute -bottom-1 -right-2 w-6 h-6 rounded-full bg-white/15 border-2 border-white/25 flex items-center justify-center">
                <span className="text-xs">🔒</span>
              </div>
            )}
          </div>

          {/* Names */}
          <div className="w-full text-center space-y-0.5 z-10">
            <p className={`text-xs font-black leading-tight tracking-wide ${collected ? 'text-white' : 'text-white/30'}`}>
              {name}
            </p>
            {englishName !== name && (
              <p className={`text-[10px] font-semibold ${collected ? 'text-white/55' : 'text-white/18'}`}>
                {englishName}
              </p>
            )}
            {collected
              ? <p className="text-[9px] text-white/40 mt-1 font-semibold">Tap to flip ↩</p>
              : <p className="text-[9px] text-white/20 mt-1 font-semibold">Not collected</p>
            }
          </div>
        </div>

        {/* ── BACK ── */}
        <div
          className={`absolute inset-0 rounded-2xl border-[3px] ${styles.border} ${styles.shadowClass} flex flex-col p-3 gap-2
            bg-gradient-to-br ${styles.backBg}`}
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/6 via-transparent to-transparent rounded-2xl pointer-events-none" />

          <div className="flex items-center gap-2 relative z-10">
            <span className="text-2xl">{emoji}</span>
            <div>
              <p className="text-white text-xs font-black leading-tight">{name}</p>
              <p className="text-white/40 text-[10px] font-semibold">{englishName}</p>
            </div>
          </div>

          <div className="bg-white/8 rounded-xl p-2 flex-1 overflow-hidden relative z-10">
            <p className="text-pink-300 text-[9px] font-black uppercase tracking-widest mb-1">✨ Benefits</p>
            <p className="text-white/75 text-[10px] leading-relaxed line-clamp-4">{benefits}</p>
          </div>

          {steps.length > 0 && (
            <div className="bg-white/8 rounded-xl p-2 flex-1 overflow-hidden relative z-10">
              <p className="text-emerald-300 text-[9px] font-black uppercase tracking-widest mb-1">🧘 How to</p>
              <ol className="space-y-0.5">
                {steps.slice(0, 4).map((step, i) => (
                  <li key={i} className="text-white/65 text-[9px] leading-relaxed flex gap-1">
                    <span className="text-emerald-400 font-black shrink-0">{i + 1}.</span>
                    <span className="line-clamp-2">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <p className="text-[9px] text-white/25 text-center font-semibold relative z-10">Tap to flip back ↩</p>
        </div>
      </motion.div>

      {/* EPIC shimmer sweep */}
      {collected && rarity === 'EPIC' && !flipped && (
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-300/20 to-transparent skew-x-12"
            animate={{ x: ['-150%', '250%'] }}
            transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1.2, ease: 'easeInOut' }}
          />
        </div>
      )}

      {/* RARE shimmer sweep */}
      {collected && rarity === 'RARE' && !flipped && (
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-sky-300/12 to-transparent skew-x-12"
            animate={{ x: ['-150%', '250%'] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}
          />
        </div>
      )}

      {/* Pulse glow on uncollected RARE/EPIC */}
      {!collected && (rarity === 'EPIC' || rarity === 'RARE') && (
        <motion.div
          className={`absolute inset-0 rounded-2xl pointer-events-none ${
            rarity === 'EPIC'
              ? 'shadow-[0_0_20px_rgba(251,191,36,0.2)]'
              : 'shadow-[0_0_16px_rgba(56,189,248,0.15)]'
          }`}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </div>
  )
}
