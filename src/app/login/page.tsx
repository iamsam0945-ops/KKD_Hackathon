'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ phone: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      router.push('/dashboard')
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Animated blobs */}
      <div className="animate-blob absolute top-[-10%] left-[-10%] w-72 h-72 rounded-full bg-violet-600/20 blur-3xl" />
      <div className="animate-blob absolute bottom-[-10%] right-[-10%] w-72 h-72 rounded-full bg-pink-600/20 blur-3xl" style={{ animationDelay: '3s' }} />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-6xl mb-3 inline-block"
          >
            🧘
          </motion.div>
          <h1 className="text-3xl font-black shimmer-text">YogaQuest</h1>
          <p className="text-white/50 text-sm mt-1 font-semibold">Welcome back! Continue your journey</p>
        </div>

        {/* Form card */}
        <div className="relative rounded-3xl p-6 border-[3px] border-violet-400 bg-gradient-to-br from-violet-950 via-[#130d2e] to-indigo-950 card-shadow-violet overflow-hidden space-y-4">
          <div className="absolute inset-0 bg-gradient-to-br from-white/6 via-transparent to-transparent pointer-events-none" />

          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            <div>
              <label className="text-white/60 text-xs font-black mb-1.5 block uppercase tracking-wider">📱 Phone Number</label>
              <input
                type="tel"
                placeholder="9876543210"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                required
                className="w-full bg-white/8 border-2 border-white/15 rounded-2xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-violet-400/70 focus:bg-white/12 transition-all text-sm font-semibold"
              />
            </div>
            <div>
              <label className="text-white/60 text-xs font-black mb-1.5 block uppercase tracking-wider">🔒 Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                  className="w-full bg-white/8 border-2 border-white/15 rounded-2xl px-4 py-3 pr-12 text-white placeholder-white/20 focus:outline-none focus:border-violet-400/70 focus:bg-white/12 transition-all text-sm font-semibold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors p-1"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {error && (
              <motion.p initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="text-red-300 text-sm text-center bg-red-500/15 border-2 border-red-400/30 rounded-2xl py-2.5 px-3 font-semibold">
                ⚠️ {error}
              </motion.p>
            )}

            <motion.button
              whileTap={{ scale: 0.96 }}
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 via-violet-500 to-indigo-500 text-white font-black text-sm border-[3px] border-pink-400/60 card-shadow-violet disabled:opacity-60 mt-2"
            >
              {loading ? '⏳ Signing in...' : '✨ Sign In'}
            </motion.button>
          </form>
        </div>

        <p className="text-center text-white/30 text-xs mt-5 font-semibold">
          New here?{' '}
          <Link href="/register" className="text-violet-300 font-black">Create account & get free card 🎁</Link>
        </p>
      </motion.div>
    </div>
  )
}
