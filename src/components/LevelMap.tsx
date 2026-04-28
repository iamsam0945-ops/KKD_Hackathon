'use client'
import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Friend { id:string;name:string;username:string;currentLevel:number;points:number }
interface LevelMapProps { currentLevel:number;completedLevels:number[];friends:Friend[];userName:string;onAddFriend:()=>void }

const LEVEL_NODES: {level:number;x:number;y:number}[] = [
  {level:1,x:50,y:1160},{level:2,x:22,y:1030},{level:3,x:68,y:910},{level:4,x:82,y:775},
  {level:5,x:50,y:640},{level:6,x:18,y:510},{level:7,x:40,y:385},{level:8,x:75,y:265},
  {level:9,x:58,y:145},{level:10,x:50,y:30},
]
const MAP_HEIGHT = 1220
const FRIEND_COLORS = ['#a78bfa','#f472b6','#34d399','#fbbf24','#60a5fa','#c084fc','#22d3ee','#fb923c']
function fc(n:string){return FRIEND_COLORS[(n.charCodeAt(0)+n.charCodeAt(n.length-1))%FRIEND_COLORS.length]}

export default function LevelMap({currentLevel,completedLevels,friends,userName,onAddFriend}:LevelMapProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeFriend, setActiveFriend] = useState<string|null>(null)

  useEffect(()=>{
    const node=LEVEL_NODES.find(n=>n.level===currentLevel)
    if(!node||!scrollRef.current) return
    const targetScroll=node.y-scrollRef.current.clientHeight/2+40
    setTimeout(()=>scrollRef.current?.scrollTo({top:Math.max(0,targetScroll),behavior:'smooth'}),300)
  },[currentLevel])

  const friendsByLevel:Record<number,Friend[]>={}
  friends.forEach(f=>{if(!friendsByLevel[f.currentLevel])friendsByLevel[f.currentLevel]=[];friendsByLevel[f.currentLevel].push(f)})

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{background:'linear-gradient(180deg,rgba(30,10,94,0.95),rgba(13,8,36,0.9))',borderBottom:'2px solid rgba(139,92,246,0.3)',backdropFilter:'blur(8px)'}}>
        <div>
          <h2 className="text-white font-black text-sm" style={{textShadow:'0 0 12px rgba(167,139,250,0.6)'}}>🗺️ Journey Map</h2>
          <p className="text-violet-400/60 text-xs font-semibold">Level {currentLevel} of 10</p>
        </div>
        <div className="flex items-center gap-3">
          {friends.length>0&&(
            <div className="flex -space-x-1.5">
              {friends.slice(0,4).map(f=>(
                <div key={f.id} className="w-7 h-7 rounded-full border-2 border-[#0d0824] flex items-center justify-center text-[10px] font-black text-white shadow-lg"
                  style={{background:fc(f.name)}} title={f.name}>{f.name[0]}</div>
              ))}
              {friends.length>4&&<div className="w-7 h-7 rounded-full border-2 border-[#0d0824] bg-violet-800 flex items-center justify-center text-[9px] text-violet-300 font-black">+{friends.length-4}</div>}
            </div>
          )}
          <motion.button whileTap={{y:3,boxShadow:'0 1px 0 #3b0764'}} onClick={onAddFriend} className="btn-candy-violet px-3 py-1.5 text-xs">+ Add</motion.button>
        </div>
      </div>

      {/* Map */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto relative map-bg" style={{minHeight:0}}>
        {/* Atmospheric stars */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({length:20},(_,i)=>(
            <div key={i} className="absolute text-yellow-200 candy-sparkle" style={{left:`${(i*37)%90+5}%`,top:`${(i*53)%90+5}%`,fontSize:`${8+i%4}px`,opacity:0.3+i%3*0.1,animationDelay:`${(i*0.3)%2}s`}}>✦</div>
          ))}
        </div>

        <div className="relative mx-auto" style={{width:'100%',height:MAP_HEIGHT+80}}>
          {/* Candy path */}
          <svg className="absolute inset-0 pointer-events-none" width="100%" height={MAP_HEIGHT+80} style={{overflow:'visible'}}>
            <defs>
              <linearGradient id="pathGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.6"/>
                <stop offset="50%" stopColor="#a78bfa" stopOpacity="0.6"/>
                <stop offset="100%" stopColor="#34d399" stopOpacity="0.6"/>
              </linearGradient>
            </defs>
            {LEVEL_NODES.slice(0,-1).map((node,i)=>{
              const next=LEVEL_NODES[i+1]; const done=completedLevels.includes(node.level)
              return (
                <g key={node.level}>
                  <line x1={`${node.x}%`} y1={node.y+40} x2={`${next.x}%`} y2={next.y+40}
                    stroke={done?'url(#pathGrad)':'rgba(255,255,255,0.08)'} strokeWidth={done?5:3}
                    strokeDasharray={done?'0':'10 8'} strokeLinecap="round"/>
                  {/* Dots along path when completed */}
                  {done&&[0.3,0.6].map((t,di)=>{
                    const nx1=parseFloat(node.x.toString())/100; const nx2=parseFloat(next.x.toString())/100
                    const cx=(nx1+(nx2-nx1)*t)*100; const cy=node.y+40+(next.y+40-(node.y+40))*t
                    return <circle key={di} cx={`${cx}%`} cy={cy} r="4" fill="#fbbf24" opacity="0.7"/>
                  })}
                </g>
              )
            })}
          </svg>

          {/* Nodes */}
          {LEVEL_NODES.map(({level,x,y})=>{
            const isCurrent=level===currentLevel; const isCompleted=completedLevels.includes(level)
            const isLocked=!isCurrent&&!isCompleted; const isBonus=level%5===0
            const levelFriends=friendsByLevel[level]??[]
            const size=isBonus?70:isCurrent?60:50

            return (
              <div key={level} className="absolute flex flex-col items-center" style={{left:`${x}%`,top:y,transform:'translate(-50%,0)'}}>
                {/* Stars above completed */}
                {isCompleted&&(
                  <motion.div initial={{scale:0,rotate:-30}} animate={{scale:1,rotate:0}} transition={{type:'spring',bounce:0.6}}
                    className="text-lg mb-1">{isBonus?'⭐⭐⭐':'⭐'}</motion.div>
                )}

                {/* Friend avatars */}
                <AnimatePresence>
                  {levelFriends.length>0&&(
                    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="flex -space-x-1 mb-1.5">
                      {levelFriends.slice(0,3).map((f,fi)=>(
                        <motion.div key={f.id} animate={{y:[0,-5,0]}} transition={{duration:2,repeat:Infinity,delay:fi*0.4}} className="relative"
                          onClick={()=>setActiveFriend(activeFriend===f.id?null:f.id)}>
                          <div className="w-8 h-8 rounded-full border-2 border-[#0d0824] flex items-center justify-center text-[10px] font-black text-white cursor-pointer shadow-lg"
                            style={{background:fc(f.name),boxShadow:`0 0 10px ${fc(f.name)}88`}}>{f.name[0]}</div>
                          <AnimatePresence>
                            {activeFriend===f.id&&(
                              <motion.div initial={{opacity:0,y:4,scale:0.9}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0}}
                                className="absolute -top-10 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap">
                                <div className="candy-card px-2.5 py-1.5 shadow-xl">
                                  <p className="text-white text-[10px] font-black">{f.name}</p>
                                  <p className="text-violet-400/60 text-[9px]">{f.points}pts · L{f.currentLevel}</p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* YOU label */}
                {isCurrent&&(
                  <motion.div animate={{y:[-4,4,-4]}} transition={{duration:1.5,repeat:Infinity}}
                    className="text-[10px] font-black mb-1.5 px-2.5 py-0.5 rounded-full"
                    style={{background:'linear-gradient(135deg,#a78bfa,#7c3aed)',boxShadow:'0 0 12px rgba(139,92,246,0.7)',textShadow:'0 1px 2px rgba(0,0,0,0.5)',color:'white'}}>
                    ⬇ YOU
                  </motion.div>
                )}

                {/* Node */}
                <div className={`relative flex items-center justify-center rounded-full transition-all ${
                  isCompleted ? (isBonus?'node-bonus-completed':'node-completed') :
                  isCurrent  ? (isBonus?'node-bonus-current':'node-current') :
                  'node-locked'
                }`} style={{width:size,height:size,opacity:isLocked?0.4:1}}>
                  <span className={isBonus?'text-2xl':'text-xl'}>
                    {isCompleted&&!isBonus?'✓':isCompleted?'⭐':isCurrent?'🧘':''}
                  </span>
                  {!isCompleted&&!isCurrent&&<span className="text-[11px] font-black">{level}</span>}
                  {/* Level chip */}
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black border-2 border-[#0d0824]"
                    style={{background:isBonus?'#f59e0b':'#7c3aed',color:'white',boxShadow:isBonus?'0 2px 8px rgba(245,158,11,0.6)':'0 2px 8px rgba(124,58,237,0.6)'}}>
                    {level}
                  </span>
                  {/* Pulse ring for current */}
                  {isCurrent&&(
                    <motion.div className="absolute inset-0 rounded-full border-2 border-violet-400"
                      animate={{scale:[1,1.6],opacity:[0.8,0]}} transition={{duration:1.5,repeat:Infinity}}/>
                  )}
                </div>

                {/* Label */}
                <div className="mt-2 text-center">
                  <p className={`text-[9px] font-black ${isCurrent?'text-violet-300':isCompleted?'text-amber-400/70':'text-white/20'}`}>
                    {isBonus?'⭐ BONUS':`L${level}`}
                  </p>
                </div>
              </div>
            )
          })}

          {/* Chapter 1 divider (between level 5 and 6) */}
          <div className="absolute left-0 right-0 flex items-center gap-3 px-4" style={{top: LEVEL_NODES[4].y + 80}}>
            <div className="flex-1 h-px" style={{background:'linear-gradient(90deg,transparent,rgba(251,191,36,0.4),transparent)'}}/>
            <div className="px-3 py-1 rounded-full text-[10px] font-black text-amber-300" style={{background:'rgba(251,191,36,0.12)',border:'1.5px solid rgba(251,191,36,0.3)'}}>⭐ Chapter 1 Complete</div>
            <div className="flex-1 h-px" style={{background:'linear-gradient(90deg,transparent,rgba(251,191,36,0.4),transparent)'}}/>
          </div>

          {/* Bottom decoration */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
            <div className="flex items-center gap-2 px-5 py-2.5 rounded-full" style={{background:'rgba(139,92,246,0.15)',border:'2px solid rgba(139,92,246,0.3)'}}>
              <span className="text-lg candy-float">🌱</span>
              <span className="text-violet-300/60 text-[10px] font-bold">Your journey starts here</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
