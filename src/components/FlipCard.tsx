'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import yogaPoses from '@/lib/yogaPoses'

interface FlipCardProps {
  name: string; emoji: string; rarity: 'COMMON'|'RARE'|'EPIC'; collected: boolean; source?: string
}

const RARITY: Record<string, { label:string; border:string; glow:string; badge:string; accent:string; accentDim:string }> = {
  COMMON: { label:'Common', border:'border-slate-500/60', glow:'',                       badge:'bg-slate-600/80 text-slate-200',   accent:'#94a3b8', accentDim:'#94a3b822' },
  RARE:   { label:'Rare',   border:'border-indigo-400/80', glow:'shadow-indigo-500/50',   badge:'bg-indigo-600/90 text-indigo-100', accent:'#818cf8', accentDim:'#818cf833' },
  EPIC:   { label:'Epic',   border:'border-amber-400/90',  glow:'shadow-amber-400/60',    badge:'bg-amber-500/90 text-amber-100',  accent:'#fbbf24', accentDim:'#fbbf2433' },
}

const SOURCE_LABEL: Record<string,string> = { WELCOME:'Welcome', REFERRAL:'Referral', BONUS:'Bonus', GIFTED:'Gifted' }

// Cinematic yoga motion keyframes — simulates a person moving through the pose
const POSE_FRAMES = [
  { y: 0,   rotate: 0,   scale: 1.0  },
  { y: -10, rotate: -7,  scale: 1.12 },
  { y: -14, rotate: 4,   scale: 1.18 },
  { y: -8,  rotate: -3,  scale: 1.10 },
  { y: -12, rotate: 6,   scale: 1.15 },
  { y: -6,  rotate: -4,  scale: 1.08 },
  { y: 0,   rotate: 0,   scale: 1.0  },
]

export default function FlipCard({ name, emoji, rarity, collected, source }: FlipCardProps) {
  const [flipped, setFlipped]   = useState(false)
  const [stepIdx, setStepIdx]   = useState(0)
  const [frameIdx, setFrameIdx] = useState(0)

  const r    = RARITY[rarity] ?? RARITY.COMMON
  const pose = yogaPoses.find(p => p.name === name) ?? yogaPoses.find(p => p.english === name)
  const englishName = pose?.english ?? name
  const steps       = pose?.steps    ?? ['Find a comfortable stance', 'Breathe deeply and hold', 'Release gently on exhale']
  const benefits    = pose?.benefits ?? 'Practice this pose mindfully and breathe deeply.'

  // Auto-advance subtitle steps every 2.5 s (video subtitle effect)
  useEffect(() => {
    if (!collected || flipped) return
    const t = setInterval(() => setStepIdx(i => (i + 1) % steps.length), 2500)
    return () => clearInterval(t)
  }, [collected, flipped, steps.length])

  // Animate through pose frames every 700 ms (motion video effect)
  useEffect(() => {
    if (!collected || flipped) return
    const t = setInterval(() => setFrameIdx(i => (i + 1) % POSE_FRAMES.length), 700)
    return () => clearInterval(t)
  }, [collected, flipped])

  const frame = POSE_FRAMES[frameIdx]

  return (
    <div
      className="relative w-full aspect-[3/4] cursor-pointer select-none"
      style={{ perspective: '1000px' }}
      onClick={() => { if (collected) setFlipped(f => !f) }}
    >
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
      >

        {/* ── FRONT — Cinematic video style ── */}
        <div
          className={`absolute inset-0 rounded-3xl border-2 overflow-hidden ${r.border} ${collected ? `shadow-2xl ${r.glow}` : ''}`}
          style={{
            backfaceVisibility: 'hidden',
            background: 'linear-gradient(160deg,#080412 0%,#130930 45%,#060310 100%)',
            opacity: collected ? 1 : 0.55,
          }}
        >
          {/* Animated rarity glow — background shifts like studio lighting */}
          {collected && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse' }}
              style={{ background: `radial-gradient(ellipse at 50% 45%, ${r.accentDim} 0%, transparent 70%)` }}
            />
          )}

          {/* Film-grain texture overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`, backgroundSize: '128px' }} />

          {/* Top cinematic bar */}
          <div className="absolute top-0 left-0 right-0 h-14 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(180deg,rgba(0,0,0,0.85) 0%,transparent 100%)' }} />

          {/* Bottom cinematic bar */}
          <div className="absolute bottom-0 left-0 right-0 h-20 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(0deg,rgba(0,0,0,0.92) 0%,transparent 100%)' }} />

          {/* Top bar — rarity badge + source tag */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-3 pt-2.5">
            {collected && source
              ? <span className="text-[8px] text-white/50 font-semibold bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-sm">{SOURCE_LABEL[source] ?? source}</span>
              : <span />
            }
            <span className={`text-[8px] font-black px-2 py-0.5 rounded-full shadow ${collected ? r.badge : 'bg-gray-700/80 text-gray-500'}`}>{r.label}</span>
          </div>

          {/* ── Main animated emoji (the "video") ── */}
          <div className="absolute inset-0 flex items-center justify-center">
            {collected ? (
              <motion.div
                animate={{ y: frame.y, rotate: frame.rotate, scale: frame.scale }}
                transition={{ duration: 0.55, ease: 'easeInOut' }}
              >
                {/* Emoji shadow / depth */}
                <div className="relative">
                  {/* Ground shadow */}
                  <motion.div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full"
                    animate={{ width: `${frame.scale * 48}px`, opacity: 0.3 / frame.scale }}
                    style={{ height: '8px', background: 'rgba(0,0,0,0.6)', filter: 'blur(6px)', bottom: '-12px' }}
                    transition={{ duration: 0.55, ease: 'easeInOut' }}
                  />
                  <span
                    className="text-6xl leading-none"
                    style={{
                      filter: rarity === 'EPIC'
                        ? `drop-shadow(0 0 18px ${r.accent}99) drop-shadow(0 4px 12px rgba(0,0,0,0.9))`
                        : rarity === 'RARE'
                        ? `drop-shadow(0 0 10px ${r.accent}66) drop-shadow(0 4px 12px rgba(0,0,0,0.9))`
                        : 'drop-shadow(0 4px 12px rgba(0,0,0,0.9))',
                    }}
                  >{emoji}</span>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <span className="text-5xl grayscale opacity-25">{emoji}</span>
                <span className="text-lg opacity-30">🔒</span>
              </div>
            )}
          </div>

          {/* ── Bottom HUD — subtitle + step progress (video UI) ── */}
          {collected && (
            <div className="absolute bottom-0 left-0 right-0 z-20 px-3 pb-3">
              {/* Step progress dots */}
              <div className="flex gap-1 justify-center mb-2">
                {steps.map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      width: i === stepIdx ? 18 : 5,
                      opacity: i === stepIdx ? 1 : 0.3,
                      background: i === stepIdx ? r.accent : '#ffffff',
                    }}
                    className="h-1 rounded-full"
                    transition={{ duration: 0.3 }}
                  />
                ))}
              </div>

              {/* Step subtitle — auto-scrolling like a video */}
              <AnimatePresence mode="wait">
                <motion.p
                  key={stepIdx}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.3 }}
                  className="text-white text-[9px] text-center font-bold leading-snug"
                  style={{ textShadow: '0 1px 6px rgba(0,0,0,1), 0 0 12px rgba(0,0,0,0.9)' }}
                >
                  <span style={{ color: r.accent, fontWeight: 900 }}>{stepIdx + 1}. </span>
                  {steps[stepIdx]}
                </motion.p>
              </AnimatePresence>

              {/* Pose name */}
              <p
                className="text-[8px] text-center mt-1.5 font-black uppercase tracking-widest opacity-60"
                style={{ color: r.accent, textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}
              >{englishName}</p>
            </div>
          )}

          {/* Uncollected label */}
          {!collected && (
            <div className="absolute bottom-4 left-0 right-0 text-center">
              <p className="text-white/20 text-[10px] font-black">{name}</p>
              <p className="text-white/12 text-[9px] mt-0.5">Not collected</p>
            </div>
          )}

          {/* EPIC shimmer */}
          {collected && rarity === 'EPIC' && (
            <div className="epic-shimmer absolute inset-0 rounded-3xl pointer-events-none" />
          )}

          {/* Tap hint — top-right corner */}
          {collected && (
            <div className="absolute top-8 right-2 z-20">
              <p className="text-white/20 text-[7px] font-bold">tap ↩</p>
            </div>
          )}
        </div>

        {/* ── BACK — Details ── */}
        <div
          className="absolute inset-0 rounded-3xl border-2 border-violet-500/50 flex flex-col p-3 gap-2 shadow-lg shadow-violet-500/30"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: 'linear-gradient(160deg,#1e0a5e 0%,#150838 60%,#0d0824 100%)' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">{emoji}</span>
            <div>
              <p className="text-white text-xs font-black">{name}</p>
              <p className="text-violet-300/60 text-[10px]">{englishName}</p>
            </div>
          </div>
          <div className="bg-black/30 border border-violet-500/20 rounded-xl p-2 flex-1 overflow-hidden">
            <p className="text-violet-400 text-[9px] font-black uppercase tracking-wider mb-1">Benefits</p>
            <p className="text-violet-100/70 text-[10px] leading-relaxed line-clamp-4">{benefits}</p>
          </div>
          {steps.length > 0 && (
            <div className="bg-black/30 border border-violet-500/20 rounded-xl p-2 flex-1 overflow-hidden">
              <p className="text-violet-400 text-[9px] font-black uppercase tracking-wider mb-1">How to</p>
              <ol className="space-y-0.5">
                {steps.slice(0, 4).map((step, i) => (
                  <li key={i} className="text-violet-100/60 text-[9px] leading-relaxed flex gap-1">
                    <span className="text-amber-400 font-black shrink-0">{i + 1}.</span>
                    <span className="line-clamp-2">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          <p className="text-[9px] text-violet-400/50 text-center">Tap to flip back ↩</p>
        </div>

      </motion.div>
    </div>
  )
}
