'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

interface ReferralShareProps { referralToken:string;referralCount:number;totalReferrals:number;userName:string }

export default function ReferralShare({referralToken,referralCount,totalReferrals,userName}:ReferralShareProps) {
  const [copied,setCopied]=useState(false)
  const baseUrl=typeof window!=='undefined'?window.location.origin:''
  const referralUrl=`${baseUrl}/join/${referralToken}`

  async function copyLink() { try { await navigator.clipboard.writeText(referralUrl); setCopied(true); setTimeout(()=>setCopied(false),2000) } catch{} }
  async function shareLink() { if (navigator.share) { await navigator.share({title:'Join me on YogaQuest!',text:`${userName} invites you to start your yoga journey!`,url:referralUrl}) } else { copyLink() } }

  return (
    <div className="candy-card p-5 space-y-4">
      <div>
        <h3 className="text-white font-black text-sm">🔗 Referral Link</h3>
        <p className="text-violet-400/60 text-xs mt-0.5 font-semibold">Share to earn scratch cards</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-3 text-center" style={{background:'linear-gradient(135deg,#2d1b69 0%,#1a0f40 100%)',border:'2px solid rgba(167,139,250,0.3)'}}>
          <p className="text-2xl font-black text-amber-300">{totalReferrals}</p>
          <p className="text-violet-400/60 text-xs mt-0.5 font-semibold">total clicks</p>
        </div>
        <div className="rounded-2xl p-3 text-center" style={{background:'linear-gradient(135deg,#002d1b 0%,#001a10 100%)',border:'2px solid rgba(52,211,153,0.3)'}}>
          <p className="text-2xl font-black text-emerald-300">{referralCount}</p>
          <p className="text-emerald-400/60 text-xs mt-0.5 font-semibold">converted</p>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-2xl p-3" style={{background:'rgba(0,0,0,0.3)',border:'2px solid rgba(139,92,246,0.25)'}}>
        <span className="text-violet-300/50 text-xs truncate flex-1 font-mono">{referralUrl}</span>
        <motion.button whileTap={{y:3}} onClick={copyLink}
          className={`text-xs px-3 py-1.5 rounded-xl font-black whitespace-nowrap transition-all ${copied?'bg-emerald-500 text-white':'btn-candy-violet py-1.5 px-3'}`}>
          {copied?'✅ Copied!':'Copy'}
        </motion.button>
      </div>

      <motion.button whileTap={{y:5,boxShadow:'0 1px 0 #3b0764'}} onClick={shareLink} className="btn-candy-violet w-full py-3.5 text-sm">
        🚀 Share & Earn Cards!
      </motion.button>

      <div className="space-y-2 pt-1">
        <p className="text-violet-400/40 text-[10px] font-black uppercase tracking-wider">How it works</p>
        {['Share your unique link','Friend fills name & phone','You earn a scratch card instantly'].map(text=>(
          <div key={text} className="flex items-center gap-2 text-violet-300/60 text-xs font-semibold">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 candy-sparkle"/>
            <span>{text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
