'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function HomePage() {
  const router = useRouter()
  useEffect(() => { fetch('/api/auth/me').then(r => { if (r.ok) router.replace('/dashboard') }) }, [router])

  const steps = [
    { icon: '🔗', label: 'Share your link', desc: 'Invite friends to join', color: '#a78bfa', shadow: '#4c1d95' },
    { icon: '📝', label: 'Friend signs up', desc: 'You earn a scratch card', color: '#34d399', shadow: '#047857' },
    { icon: '🃏', label: 'Scratch & collect', desc: 'Reveal yoga pose cards', color: '#fbbf24', shadow: '#92400e' },
    { icon: '🏆', label: 'Unlock rewards', desc: 'Free yoga days + points', color: '#f472b6', shadow: '#9d174d' },
  ]

  return (
    <div className="min-h-screen bg-[#fdf8ff] flex flex-col items-center justify-center px-5 overflow-hidden relative">

      {/* Atmospheric blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="candy-blob absolute w-72 h-72 rounded-full" style={{background:'rgba(139,92,246,0.18)',top:'-80px',left:'-60px',borderRadius:'60% 40% 30% 70% / 60% 30% 70% 40%',animationDelay:'0s'}}/>
        <div className="candy-blob absolute w-56 h-56 rounded-full" style={{background:'rgba(251,191,36,0.12)',top:'30%',right:'-60px',borderRadius:'40% 60% 70% 30% / 40% 50% 60% 50%',animationDelay:'1.5s'}}/>
        <div className="candy-blob absolute w-48 h-48 rounded-full" style={{background:'rgba(52,211,153,0.1)',bottom:'10%',left:'-40px',borderRadius:'50% 60% 40% 70% / 50% 40% 60% 50%',animationDelay:'3s'}}/>
        <div className="candy-blob absolute w-40 h-40 rounded-full" style={{background:'rgba(244,114,182,0.1)',bottom:'20%',right:'-30px',borderRadius:'70% 30% 50% 40% / 50% 60% 30% 60%',animationDelay:'2s'}}/>
      </div>

      {/* Sparkle stars */}
      <div className="fixed inset-0 pointer-events-none">
        {[
          {pos:'18%,8%',  color:'#a78bfa', size:'16px', delay:'0s'},
          {pos:'78%,12%', color:'#fbbf24', size:'12px', delay:'0.4s'},
          {pos:'8%,42%',  color:'#34d399', size:'10px', delay:'0.8s'},
          {pos:'88%,38%', color:'#f472b6', size:'14px', delay:'0.3s'},
          {pos:'45%,6%',  color:'#60a5fa', size:'10px', delay:'1.2s'},
          {pos:'92%,65%', color:'#c084fc', size:'12px', delay:'0.6s'},
          {pos:'5%,72%',  color:'#fbbf24', size:'10px', delay:'1s'},
          {pos:'60%,90%', color:'#a78bfa', size:'14px', delay:'0.2s'},
        ].map((s, i) => (
          <div key={i} className="absolute candy-sparkle font-black" style={{left:s.pos.split(',')[0],top:s.pos.split(',')[1],animationDelay:s.delay,fontSize:s.size,color:s.color}}>✦</div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div className="text-8xl mb-4 candy-float inline-block" style={{filter:'drop-shadow(0 0 20px rgba(167,139,250,0.6))'}}>🧘</motion.div>
          <h1 className="text-5xl font-black mb-2 leading-none" style={{
            background:'linear-gradient(135deg,#c4b5fd 0%,#f472b6 30%,#fbbf24 60%,#34d399 100%)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
            filter:'drop-shadow(0 4px 12px rgba(167,139,250,0.4))'
          }}>YogaQuest</h1>
          <p className="text-violet-300/80 text-sm font-bold tracking-wide">Collect · Scratch · Conquer</p>

          {/* Stars row */}
          <div className="flex items-center justify-center gap-1.5 mt-3">
            {['⭐','⭐','⭐'].map((s, i) => (
              <motion.span key={i} initial={{scale:0,rotate:-30}} animate={{scale:1,rotate:0}} transition={{delay:0.5+i*0.15,type:'spring',bounce:0.6}} className="text-xl">{s}</motion.span>
            ))}
            <span className="text-violet-400/60 text-xs font-black ml-2">10-level adventure</span>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-2.5 mb-8">
          {steps.map((s, i) => (
            <motion.div key={i} initial={{opacity:0,x:-24}} animate={{opacity:1,x:0}} transition={{delay:0.12+i*0.09,type:'spring',stiffness:260,damping:20}}
              className="flex items-center gap-3.5 rounded-2xl p-3.5"
              style={{background:'linear-gradient(160deg,#2d1b69 0%,#1e0f4a 50%,#130930 100%)',border:`2px solid ${s.color}44`,boxShadow:`0 4px 0 ${s.shadow}55, 0 6px 16px rgba(0,0,0,0.3)`}}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                style={{background:`${s.color}20`,border:`2px solid ${s.color}60`,boxShadow:`0 3px 0 ${s.shadow}44`}}>
                {s.icon}
              </div>
              <div className="flex-1">
                <p className="text-white font-black text-sm">{s.label}</p>
                <p className="text-violet-300/60 text-xs font-semibold">{s.desc}</p>
              </div>
              <motion.div animate={{x:[0,3,0]}} transition={{duration:1.5,repeat:Infinity,delay:i*0.3}} className="text-violet-400/40 text-sm">→</motion.div>
            </motion.div>
          ))}
        </div>

        {/* CTAs */}
        <div className="space-y-3">
          <Link href="/register">
            <motion.button whileTap={{y:5,boxShadow:'0 1px 0 #047857'}} className="btn-candy-green w-full py-4 text-lg">
              🎮 Play for Free!
            </motion.button>
          </Link>
          <Link href="/login">
            <motion.button whileTap={{y:4,boxShadow:'0 1px 0 #3b0764'}} className="btn-candy-violet w-full py-3.5 text-base">
              Sign In
            </motion.button>
          </Link>
          <p className="text-center text-violet-400/40 text-[11px] font-semibold">Free to play · No credit card needed</p>
        </div>
      </motion.div>
    </div>
  )
}
