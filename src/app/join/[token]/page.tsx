'use client'
import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  emoji: ['🧘', '🪷', '✨', '🌙', '⭐', '💫'][i % 6],
  x: (i * 37 + 11) % 97,
  y: (i * 53 + 7) % 95,
  delay: (i * 0.4) % 3,
}))

export default function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ name: '', phone: '', username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function next(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.phone.trim()) return
    setError('')
    setStep(2)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.username.trim() || !form.password.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          username: form.username,
          password: form.password,
          referralToken: token,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Registration failed')
        setLoading(false)
        return
      }
      router.push('/dashboard?welcome=1')
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center px-4">
      {/* Animated blobs */}
      <div className="animate-blob absolute top-[-5%] right-[-10%] w-72 h-72 rounded-full bg-pink-600/25 blur-3xl" />
      <div className="animate-blob absolute bottom-[-5%] left-[-10%] w-72 h-72 rounded-full bg-violet-600/25 blur-3xl" style={{ animationDelay: '3.5s' }} />

      {/* Floating particles */}
      {PARTICLES.map(p => (
        <motion.div
          key={p.id}
          className="absolute text-2xl pointer-events-none select-none"
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
          animate={{ y: [-10, 10, -10], opacity: [0.12, 0.45, 0.12] }}
          transition={{ duration: 4 + p.delay, repeat: Infinity, ease: 'easeInOut', delay: p.delay }}
        >
          {p.emoji}
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Invitation header */}
        <div className="text-center mb-5">
          <motion.div
            animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.12, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="text-6xl mb-3 inline-block"
          >
            🃏
          </motion.div>
          <h1 className="text-3xl font-black text-white mb-1">You&apos;re Invited!</h1>
          <p className="text-white/50 text-sm font-semibold">
            Join <span className="text-violet-300 font-black">YogaQuest</span> — your friend earns a scratch card when you sign up
          </p>
        </div>

        {/* What happens banner */}
        <motion.div
          animate={{ y: [-2, 2, -2] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="relative rounded-2xl p-4 mb-5 border-[3px] border-amber-400 bg-gradient-to-br from-amber-950 via-[#1a0e00] to-orange-950 card-shadow-gold overflow-hidden flex items-center gap-3"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/6 to-transparent pointer-events-none" />
          <motion.span animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 2, repeat: Infinity }} className="text-2xl shrink-0 relative z-10">🎁</motion.span>
          <div className="flex-1 min-w-0 relative z-10">
            <p className="text-white text-xs font-black">You get a free welcome card too!</p>
            <p className="text-amber-300/70 text-[11px] font-semibold">Sign up → instant scratch card → collect yoga poses</p>
          </div>
        </motion.div>

        {/* Step indicator */}
        <div className="flex gap-2 mb-5">
          {[1, 2].map(s => (
            <div key={s} className={`flex-1 h-2.5 rounded-full transition-all duration-500 ${step >= s ? 'progress-animated' : 'bg-white/12'}`} />
          ))}
        </div>

        {/* Form card */}
        <div className="relative rounded-3xl p-6 border-[3px] border-violet-400 bg-gradient-to-br from-violet-950 via-[#130d2e] to-indigo-950 card-shadow-violet overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/6 via-transparent to-transparent pointer-events-none" />

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.form
                key="step1"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                onSubmit={next}
                className="space-y-4 relative z-10"
              >
                <p className="text-white/45 text-xs text-center font-bold">Step 1 of 2 — About you</p>

                <div>
                  <label className="text-white/60 text-xs font-black mb-1.5 block uppercase tracking-wider">👤 Your Name</label>
                  <input
                    type="text"
                    placeholder="Priya Kapoor"
                    value={form.name}
                    autoComplete="name"
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    required
                    className="w-full bg-white/8 border-2 border-white/15 rounded-2xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-violet-400/70 focus:bg-white/12 transition-all text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="text-white/60 text-xs font-black mb-1.5 block uppercase tracking-wider">📱 Phone Number</label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={form.phone}
                    autoComplete="off"
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    required
                    className="w-full bg-white/8 border-2 border-white/15 rounded-2xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-violet-400/70 focus:bg-white/12 transition-all text-sm font-semibold"
                  />
                </div>

                <motion.button
                  whileTap={{ scale: 0.96 }}
                  type="submit"
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 via-violet-500 to-indigo-500 text-white font-black border-[3px] border-pink-400/60 card-shadow-violet"
                >
                  Continue →
                </motion.button>
              </motion.form>
            ) : (
              <motion.form
                key="step2"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                onSubmit={handleSubmit}
                className="space-y-4 relative z-10"
              >
                <p className="text-white/45 text-xs text-center font-bold">Step 2 of 2 — Create your account</p>

                <div>
                  <label className="text-white/60 text-xs font-black mb-1.5 block uppercase tracking-wider">🏷️ Choose a Username</label>
                  <input
                    type="text"
                    placeholder="priya_yoga"
                    value={form.username}
                    autoComplete="off"
                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                    required
                    className="w-full bg-white/8 border-2 border-white/15 rounded-2xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-violet-400/70 focus:bg-white/12 transition-all text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="text-white/60 text-xs font-black mb-1.5 block uppercase tracking-wider">🔒 Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={form.password}
                    autoComplete="new-password"
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    required
                    className="w-full bg-white/8 border-2 border-white/15 rounded-2xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-violet-400/70 focus:bg-white/12 transition-all text-sm font-semibold"
                  />
                </div>

                {error && (
                  <motion.p initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="text-red-300 text-sm text-center bg-red-500/15 border-2 border-red-400/30 rounded-2xl py-2.5 px-3 font-semibold">
                    ⚠️ {error}
                  </motion.p>
                )}

                <div className="flex gap-3">
                  <motion.button
                    whileTap={{ scale: 0.93 }}
                    type="button"
                    onClick={() => { setStep(1); setError('') }}
                    className="px-4 py-3 rounded-2xl border-2 border-white/15 text-white/55 text-sm font-black"
                  >
                    ← Back
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-pink-500 via-violet-500 to-indigo-500 text-white font-black border-[3px] border-pink-400/60 card-shadow-violet disabled:opacity-60"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}>⏳</motion.span>
                        Creating...
                      </span>
                    ) : '🚀 Join & Scratch Now!'}
                  </motion.button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-white/20 text-xs mt-5 font-semibold">No spam. Your info stays private. 🙏</p>
      </motion.div>
    </div>
  )
}
