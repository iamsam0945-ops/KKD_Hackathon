'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  emoji: ['🧘', '🪷', '✨', '🌙', '⭐', '🌿', '💫'][i % 7],
  x: (i * 37 + 13) % 97,
  y: (i * 53 + 7) % 95,
  delay: (i * 0.5) % 4,
  duration: 4 + (i % 4),
}))

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    fetch('/api/auth/me').then(r => {
      if (r.ok) router.replace('/dashboard')
    })
  }, [router])

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center px-4">
      {/* Animated blobs */}
      <div className="animate-blob absolute top-[-5%] left-[-10%] w-80 h-80 rounded-full bg-violet-600/25 blur-3xl" />
      <div className="animate-blob absolute bottom-[-5%] right-[-10%] w-80 h-80 rounded-full bg-pink-600/25 blur-3xl" style={{ animationDelay: '3s' }} />
      <div className="animate-blob absolute top-[40%] right-[5%] w-48 h-48 rounded-full bg-sky-600/20 blur-2xl" style={{ animationDelay: '6s' }} />

      {/* Floating particles */}
      {PARTICLES.map(p => (
        <motion.div
          key={p.id}
          className="absolute text-2xl pointer-events-none select-none"
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
          animate={{ y: [-12, 12, -12], rotate: [-8, 8, -8], opacity: [0.15, 0.55, 0.15] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        >
          {p.emoji}
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 text-center max-w-sm mx-auto"
      >
        <motion.div
          animate={{ rotate: [0, -8, 8, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="text-8xl mb-5 inline-block"
        >
          🧘
        </motion.div>

        <h1 className="text-5xl font-black shimmer-text mb-1">YogaQuest</h1>
        <p className="text-white/50 text-sm mb-6 font-semibold">Collect. Scratch. Grow.</p>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-7">
          {[
            { label: '🃏 Scratch Cards', color: 'violet' },
            { label: '🎁 Referral Rewards', color: 'pink' },
            { label: '🏆 Level Up', color: 'amber' },
            { label: '🧘 Free Yoga Days', color: 'emerald' },
          ].map(({ label, color }) => (
            <span key={label} className={`px-3 py-1 rounded-full border-2 border-${color}-400/40 bg-${color}-500/15 text-${color}-200 text-xs font-bold`}>
              {label}
            </span>
          ))}
        </div>

        {/* How it works */}
        <div className="relative rounded-3xl p-5 border-[3px] border-violet-400/50 bg-gradient-to-br from-violet-950/80 via-[#0f0a24] to-indigo-950/80 mb-6 text-left space-y-3 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
          {[
            { icon: '🔗', title: 'Share your link', desc: 'Invite friends to join YogaQuest' },
            { icon: '📝', title: 'Friend signs up', desc: 'They fill name & phone — you earn a card' },
            { icon: '🃏', title: 'Scratch & collect', desc: 'Reveal yoga pose cards' },
            { icon: '🏆', title: 'Unlock rewards', desc: 'Complete sets → free yoga days + points' },
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3 relative z-10">
              <span className="text-xl">{step.icon}</span>
              <div>
                <p className="text-white text-sm font-black">{step.title}</p>
                <p className="text-white/40 text-xs font-semibold">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <Link href="/register">
            <motion.div
              whileTap={{ scale: 0.96 }}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 via-violet-500 to-indigo-500 text-white font-black text-base border-[3px] border-pink-400/60 card-shadow-violet text-center cursor-pointer"
            >
              🚀 Start Playing — It&apos;s Free
            </motion.div>
          </Link>
          <Link href="/login">
            <motion.div
              whileTap={{ scale: 0.97 }}
              className="w-full py-3 rounded-2xl border-2 border-white/15 text-white/55 text-sm font-black text-center"
            >
              Already have an account? Sign in
            </motion.div>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
