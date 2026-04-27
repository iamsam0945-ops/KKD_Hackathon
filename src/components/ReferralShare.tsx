'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

interface ReferralShareProps {
  referralToken: string
  referralCount: number
  totalReferrals: number
  userName: string
}

export default function ReferralShare({ referralToken, referralCount, totalReferrals, userName }: ReferralShareProps) {
  const [copied, setCopied] = useState(false)
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const referralUrl = `${baseUrl}/join/${referralToken}`

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(referralUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  async function shareLink() {
    if (navigator.share) {
      await navigator.share({
        title: '🧘 Join me on YogaQuest!',
        text: `${userName} invites you to start your yoga journey! Fill in your details and help me unlock rewards.`,
        url: referralUrl,
      })
    } else {
      copyLink()
    }
  }

  return (
    <div className="space-y-4">
      {/* Header card */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative rounded-3xl p-5 border-[3px] border-violet-400 bg-gradient-to-br from-violet-950 via-[#130d2e] to-indigo-950 card-shadow-violet overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/8 via-transparent to-transparent pointer-events-none" />
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/25 border-2 border-violet-400/50 flex items-center justify-center text-2xl">
            🔗
          </div>
          <div>
            <h3 className="text-white font-black text-base">Your Referral Link</h3>
            <p className="text-violet-300 text-xs font-semibold">Share to earn scratch cards ✨</p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.08 }}
          className="relative rounded-2xl p-4 border-[3px] border-sky-400 bg-gradient-to-br from-sky-950 via-[#0a1a3a] to-blue-950 card-shadow-blue overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/6 to-transparent rounded-2xl pointer-events-none" />
          <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-1 relative z-10">Total Clicks</p>
          <p className="text-2xl font-black text-sky-300 relative z-10">🔗 {totalReferrals}</p>
        </motion.div>
        <motion.div
          initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.12 }}
          className="relative rounded-2xl p-4 border-[3px] border-emerald-400 bg-gradient-to-br from-emerald-950 via-[#071a10] to-teal-950 card-shadow-blue overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/6 to-transparent rounded-2xl pointer-events-none" />
          <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-1 relative z-10">Converted</p>
          <p className="text-2xl font-black text-emerald-300 relative z-10">✅ {referralCount}</p>
        </motion.div>
      </div>

      {/* Link display */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
        className="rounded-2xl p-3 flex items-center gap-2 border-2 border-white/12 bg-white/5"
      >
        <span className="text-white/50 text-xs truncate flex-1 font-mono leading-none">{referralUrl}</span>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={copyLink}
          className={`text-xs px-3 py-2 rounded-xl font-black border-2 whitespace-nowrap transition-all ${
            copied
              ? 'bg-emerald-500/30 text-emerald-300 border-emerald-400/50'
              : 'bg-violet-500/30 text-violet-300 border-violet-400/50 active:bg-violet-500/50'
          }`}
        >
          {copied ? '✅ Copied!' : '📋 Copy'}
        </motion.button>
      </motion.div>

      {/* Share button */}
      <motion.button
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        whileTap={{ scale: 0.96 }}
        onClick={shareLink}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 via-violet-500 to-indigo-500 text-white font-black text-sm border-[3px] border-pink-400/60 card-shadow-violet active:opacity-90 transition-opacity"
      >
        🚀 Share & Earn Cards
      </motion.button>

      {/* How it works */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
        className="rounded-3xl border-[3px] border-white/12 bg-white/4 p-4 space-y-3"
      >
        <p className="text-white/50 text-xs font-black uppercase tracking-widest">How it works</p>
        <div className="space-y-2.5">
          {[
            ['📤', 'Share your unique link', 'violet'],
            ['📝', 'Friend fills name & phone', 'sky'],
            ['🃏', 'You earn a scratch card instantly', 'pink'],
            ['🎁', 'You got a Welcome card on signup!', 'emerald'],
          ].map(([icon, text, color]) => (
            <div key={text} className={`flex items-center gap-3 rounded-xl px-3 py-2 bg-${color}-500/10 border border-${color}-400/20`}>
              <span className="text-base">{icon}</span>
              <span className={`text-${color}-200 text-xs font-semibold`}>{text}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
