'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', phone: '', username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      router.push('/dashboard?welcome=1')
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const fields1 = [
    { key: 'name', label: 'Full Name', placeholder: 'Arjun Sharma', type: 'text', emoji: '👤', autoComplete: 'name' },
    { key: 'phone', label: 'Phone Number', placeholder: '9876543210', type: 'tel', emoji: '📱', autoComplete: 'off' },
  ]
  const fields2 = [
    { key: 'username', label: 'Username', placeholder: 'arjun_yoga', type: 'text', emoji: '🏷️', autoComplete: 'off' },
    { key: 'password', label: 'Password', placeholder: '••••••••', type: 'password', emoji: '🔒', autoComplete: 'new-password' },
  ]

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Animated blobs */}
      <div className="animate-blob absolute top-[-10%] right-[-10%] w-72 h-72 rounded-full bg-pink-600/20 blur-3xl" />
      <div className="animate-blob absolute bottom-[-10%] left-[-10%] w-72 h-72 rounded-full bg-violet-600/20 blur-3xl" style={{ animationDelay: '4s' }} />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <motion.div
            animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-6xl mb-3 inline-block"
          >
            🧘
          </motion.div>
          <h1 className="text-3xl font-black shimmer-text">Join YogaQuest</h1>
          <p className="text-white/50 text-sm mt-1 font-semibold">Get your welcome scratch card instantly!</p>
        </div>

        {/* Welcome card teaser */}
        <motion.div
          animate={{ y: [-3, 3, -3] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="relative rounded-2xl p-4 mb-5 border-[3px] border-amber-400 bg-gradient-to-br from-amber-950 via-[#1a0e00] to-orange-950 card-shadow-gold overflow-hidden flex items-center gap-3"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/6 to-transparent pointer-events-none" />
          <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 2, repeat: Infinity }} className="text-3xl relative z-10">🎁</motion.div>
          <div className="relative z-10">
            <p className="text-white font-black text-sm">Welcome Gift!</p>
            <p className="text-amber-300/70 text-xs font-semibold">Sign up and get your first scratch card free</p>
          </div>
          <div className="ml-auto text-amber-300 text-sm font-black relative z-10 bg-amber-500/20 border border-amber-400/40 px-2 py-0.5 rounded-full">FREE</div>
        </motion.div>

        {/* Step indicator */}
        <div className="flex gap-2 mb-5">
          {[1, 2].map(s => (
            <motion.div key={s}
              animate={step >= s ? { opacity: 1 } : { opacity: 0.4 }}
              className={`flex-1 h-2.5 rounded-full transition-all duration-500 ${step >= s ? 'progress-animated' : 'bg-white/15'}`} />
          ))}
        </div>

        {/* Form card */}
        <div className="relative rounded-3xl p-6 border-[3px] border-violet-400 bg-gradient-to-br from-violet-950 via-[#130d2e] to-indigo-950 card-shadow-violet overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/6 via-transparent to-transparent pointer-events-none" />

          <form onSubmit={step === 2 ? handleSubmit : (e) => { e.preventDefault(); setStep(2) }} className="space-y-4 relative z-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: step === 2 ? 40 : -40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: step === 2 ? -40 : 40 }}
                className="space-y-4"
              >
                {(step === 1 ? fields1 : fields2).map(field => (
                  <div key={field.key}>
                    <label className="text-white/60 text-xs font-black mb-1.5 block uppercase tracking-wider">{field.emoji} {field.label}</label>
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      value={form[field.key as keyof typeof form]}
                      onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                      autoComplete={field.autoComplete}
                      required
                      className="w-full bg-white/8 border-2 border-white/15 rounded-2xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-violet-400/70 focus:bg-white/12 transition-all text-sm font-semibold"
                    />
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>

            {error && (
              <motion.p initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="text-red-300 text-sm text-center bg-red-500/15 border-2 border-red-400/30 rounded-2xl py-2.5 px-3 font-semibold">
                ⚠️ {error}
              </motion.p>
            )}

            <div className="flex gap-3">
              {step === 2 && (
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-3 rounded-2xl border-2 border-white/15 text-white/55 text-sm font-black"
                >
                  ← Back
                </motion.button>
              )}
              <motion.button
                whileTap={{ scale: 0.96 }}
                type="submit"
                disabled={loading}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 via-violet-500 to-indigo-500 text-white font-black text-sm border-[3px] border-pink-400/60 card-shadow-violet disabled:opacity-60"
              >
                {loading ? '⏳ Creating...' : step === 1 ? 'Continue →' : '🎁 Create Account'}
              </motion.button>
            </div>
          </form>
        </div>

        <p className="text-center text-white/30 text-xs mt-5 font-semibold">
          Already have an account?{' '}
          <Link href="/login" className="text-violet-300 font-black">Sign in ✨</Link>
        </p>
      </motion.div>
    </div>
  )
}
