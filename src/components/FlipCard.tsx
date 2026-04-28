'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import yogaPoses from '@/lib/yogaPoses'

interface FlipCardProps {
  name: string; emoji: string; rarity: 'COMMON'|'RARE'|'EPIC'; collected: boolean; source?: string
}

const RARITY: Record<string, {label:string;border:string;glow:string;badge:string;text:string}> = {
  COMMON: { label:'Common', border:'border-slate-500/50', glow:'',                       badge:'bg-slate-600 text-slate-200',    text:'text-slate-400' },
  RARE:   { label:'Rare',   border:'border-indigo-400/70', glow:'shadow-indigo-500/40',   badge:'bg-indigo-600 text-indigo-100',  text:'text-indigo-400' },
  EPIC:   { label:'Epic',   border:'border-amber-400/80',  glow:'shadow-amber-400/50',    badge:'bg-amber-500 text-amber-100',   text:'text-amber-400' },
}
const SOURCE_LABEL: Record<string,string> = { WELCOME:'Welcome', REFERRAL:'Referral', BONUS:'Bonus', GIFTED:'Gifted' }

export default function FlipCard({ name, emoji, rarity, collected, source }: FlipCardProps) {
  const [flipped, setFlipped] = useState(false)
  const r = RARITY[rarity] ?? RARITY.COMMON
  const pose = yogaPoses.find(p=>p.name===name) ?? yogaPoses.find(p=>p.english===name)
  const englishName = pose?.english ?? name
  const benefits = pose?.benefits ?? 'Practice this pose mindfully and breathe deeply.'
  const steps = pose?.steps ?? ['Find a comfortable stance','Breathe deeply and hold','Release gently on exhale']

  return (
    <div className="relative w-full aspect-[3/4] cursor-pointer select-none" style={{perspective:'1000px'}} onClick={()=>{ if(collected) setFlipped(f=>!f) }}>
      <motion.div className="relative w-full h-full" style={{transformStyle:'preserve-3d'}} animate={{rotateY:flipped?180:0}} transition={{duration:0.5,ease:[0.4,0,0.2,1]}}>
        {/* FRONT */}
        <div className={`absolute inset-0 rounded-3xl border-2 flex flex-col items-center justify-between p-3 overflow-hidden ${r.border} ${collected?`shadow-lg ${r.glow}`:''} ${collected&&rarity==='EPIC'?'epic-shimmer':''}`}
          style={{backfaceVisibility:'hidden', background:collected?'linear-gradient(160deg,#2d1b69 0%,#1e0f4a 60%,#130930 100%)':'linear-gradient(160deg,#1a1a2e 0%,#111124 100%)',opacity:collected?1:0.5}}>
          <div className="w-full flex items-center justify-between">
            {collected&&source?<span className="text-[9px] text-violet-400/70 font-semibold">{SOURCE_LABEL[source]??source}</span>:<span/>}
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${collected?r.badge:'bg-gray-700 text-gray-500'}`}>{r.label}</span>
          </div>
          <div className="relative flex flex-col items-center gap-2">
            <span className={`text-5xl ${!collected?'grayscale opacity-30':''}`}>{emoji}</span>
            {!collected && <div className="absolute -bottom-1 -right-2 w-5 h-5 rounded-full bg-gray-700 border-2 border-gray-600 flex items-center justify-center"><span className="text-[10px]">🔒</span></div>}
          </div>
          <div className="w-full text-center space-y-0.5">
            <p className={`text-xs font-black leading-tight ${collected?'text-white':'text-white/20'}`}>{name}</p>
            {englishName!==name && <p className={`text-[10px] ${collected?'text-violet-300/60':'text-white/15'}`}>{englishName}</p>}
            <p className={`text-[9px] mt-1 ${collected?r.text:'text-white/10'}`}>{collected?'Tap to flip ↩':'Not collected'}</p>
          </div>
        </div>
        {/* BACK */}
        <div className="absolute inset-0 rounded-3xl border-2 border-violet-500/50 flex flex-col p-3 gap-2 shadow-lg shadow-violet-500/30"
          style={{backfaceVisibility:'hidden',transform:'rotateY(180deg)',background:'linear-gradient(160deg,#1e0a5e 0%,#150838 60%,#0d0824 100%)'}}>
          <div className="flex items-center gap-2">
            <span className="text-xl">{emoji}</span>
            <div><p className="text-white text-xs font-black">{name}</p><p className="text-violet-300/60 text-[10px]">{englishName}</p></div>
          </div>
          <div className="bg-black/30 border border-violet-500/20 rounded-xl p-2 flex-1 overflow-hidden">
            <p className="text-violet-400 text-[9px] font-black uppercase tracking-wider mb-1">Benefits</p>
            <p className="text-violet-100/70 text-[10px] leading-relaxed line-clamp-4">{benefits}</p>
          </div>
          {steps.length>0 && (
            <div className="bg-black/30 border border-violet-500/20 rounded-xl p-2 flex-1 overflow-hidden">
              <p className="text-violet-400 text-[9px] font-black uppercase tracking-wider mb-1">How to</p>
              <ol className="space-y-0.5">
                {steps.slice(0,4).map((step,i)=>(
                  <li key={i} className="text-violet-100/60 text-[9px] leading-relaxed flex gap-1">
                    <span className="text-amber-400 font-black shrink-0">{i+1}.</span>
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
