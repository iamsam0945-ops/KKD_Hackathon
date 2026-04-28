'use client'
import { motion } from 'framer-motion'
import FlipCard from './FlipCard'

interface CollectionCard { id:string;name:string;emoji:string;rarity:string;description:string;collected:boolean;source?:string }
interface LevelProgressProps {
  currentLevel:number;uniqueCollected:number;uniqueNeeded:number;collection:CollectionCard[]
  isBonusLevel:boolean;points:number;yogaDays:number;completedLevels:number[]
  onRequestCard?:(cardName:string,cardEmoji:string)=>void
}

export default function LevelProgress({currentLevel,uniqueCollected,uniqueNeeded,collection,isBonusLevel,points,yogaDays,completedLevels,onRequestCard}:LevelProgressProps) {
  const progress = Math.min((uniqueCollected/uniqueNeeded)*100,100)
  const remaining = uniqueNeeded-uniqueCollected

  return (
    <div className="space-y-5">
      {/* Level header */}
      <div className="candy-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-violet-400 text-xs font-black uppercase tracking-wider mb-0.5">Current Level</p>
            <h2 className="text-2xl font-black text-white">{isBonusLevel?'⭐ Bonus ':''}Level {currentLevel}</h2>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-white">{uniqueCollected}<span className="text-white/25 text-base">/{uniqueNeeded}</span></p>
            <p className="text-violet-400 text-xs">cards</p>
          </div>
        </div>
        <div className="h-3 bg-black/40 rounded-full overflow-hidden border border-violet-500/20">
          <motion.div className="h-full rounded-full" style={{background:'linear-gradient(90deg,#a78bfa,#7c3aed)'}}
            initial={{width:0}} animate={{width:`${progress}%`}} transition={{duration:1.2,ease:'easeOut'}} />
        </div>
        <div className="flex justify-between mt-2">
          <p className="text-violet-400/60 text-[10px] font-semibold">{Math.round(progress)}% complete</p>
          {remaining>0&&<p className="text-violet-400/60 text-[10px] font-semibold">{remaining} more to go</p>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="candy-card p-4" style={{background:'linear-gradient(135deg,#2d1b00 0%,#1a1000 100%)',borderColor:'rgba(251,191,36,0.4)'}}>
          <p className="text-amber-400 text-xs font-black uppercase tracking-wider mb-1">✨ Points</p>
          <p className="text-xl font-black text-amber-300">{points}</p>
          <p className="text-amber-500/60 text-xs mt-0.5">≈ ₹{(points/10).toFixed(0)}</p>
        </div>
        <div className="candy-card p-4" style={{background:'linear-gradient(135deg,#002d1b 0%,#001a10 100%)',borderColor:'rgba(52,211,153,0.4)'}}>
          <p className="text-emerald-400 text-xs font-black uppercase tracking-wider mb-1">💚 Yoga Days</p>
          <p className="text-xl font-black text-emerald-300">{yogaDays}</p>
          <p className="text-emerald-500/60 text-xs mt-0.5">free days</p>
        </div>
      </div>

      {/* Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-violet-400 text-xs font-black uppercase tracking-wider">Level {currentLevel} Cards</h3>
          <span className="text-violet-400/50 text-[10px] font-semibold">Tap to flip</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {collection.map((card,i)=>(
            <motion.div key={card.id} initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} transition={{duration:0.25,delay:i*0.05}} className="space-y-2">
              <FlipCard name={card.name} emoji={card.emoji} rarity={card.rarity as 'COMMON'|'RARE'|'EPIC'} collected={card.collected} source={card.source} />
              {!card.collected&&onRequestCard&&(
                <motion.button whileTap={{y:3,boxShadow:'0 1px 0 #3b0764'}} onClick={()=>onRequestCard(card.name,card.emoji)}
                  className="btn-candy-violet w-full py-2 text-xs">Ask Friend</motion.button>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Journey */}
      {completedLevels.length>0&&(
        <div className="candy-card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-violet-400 text-xs font-black uppercase tracking-wider">🗺️ Journey</h3>
            <span className="text-violet-400/50 text-[10px] font-semibold">{completedLevels.length} completed</span>
          </div>
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {Array.from({length:10},(_,i)=>i+1).map((l,idx)=>{
              const done=completedLevels.includes(l); const isBonus=l%5===0; const isCurrent=l===currentLevel
              return (
                <div key={l} className="flex items-center shrink-0">
                  <motion.div initial={{opacity:0,scale:0.5}} animate={{opacity:1,scale:1}} transition={{delay:idx*0.05}}
                    className={`flex items-center justify-center rounded-full font-black text-[10px] transition-all ${
                      isBonus ? done?'w-9 h-9 node-bonus-completed text-amber-900':isCurrent?'w-9 h-9 node-bonus-current text-amber-900':'w-9 h-9 node-locked text-gray-400'
                      : done?'w-7 h-7 node-completed text-amber-900':isCurrent?'w-7 h-7 node-current text-white':'w-7 h-7 node-locked text-gray-400'
                    }`}>
                    {done?(isBonus?'⭐':'✓'):isCurrent?'🧘':l}
                  </motion.div>
                  {l<10&&<div className={`h-0.5 w-2 mx-0.5 rounded-full ${done?'bg-amber-500/50':'bg-white/10'}`}/>}
                </div>
              )
            })}
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[
              {label:'pts earned',value:completedLevels.reduce((s,l)=>s+(l%5===0?1000:l*50),0),color:'text-amber-400'},
              {label:'yoga days',value:completedLevels.reduce((s,l)=>s+(l%5===0?l*7+30:l*7),0),color:'text-emerald-400'},
              {label:'bonus lvls',value:completedLevels.filter(l=>l%5===0).length,color:'text-violet-400'},
            ].map(stat=>(
              <div key={stat.label} className="text-center">
                <p className={`font-black text-sm ${stat.color}`}>{stat.value}</p>
                <p className="text-white/25 text-[9px] mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
