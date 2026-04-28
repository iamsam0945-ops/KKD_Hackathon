'use client'
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

interface ScratchCardProps {
  cardId: string; emoji: string; name: string; rarity: string; isDuplicate: boolean
  onScratched: (result: {card:{cardTemplate:{name:string;imageEmoji:string;rarity:string}};levelCompleted:boolean;rewards:{points:number;yogaDays:number;isBonusLevel:boolean;nextLevel:number}|null;uniqueCollected:number;uniqueNeeded:number}) => void
}

const RARITY_INFO: Record<string,{label:string;glow:string;border:string;bg:string}> = {
  COMMON: { label:'Common', glow:'',                     border:'border-slate-500/50', bg:'from-slate-800 to-slate-900' },
  RARE:   { label:'Rare',   glow:'shadow-indigo-500/50',  border:'border-indigo-400/70', bg:'from-indigo-900 to-purple-950' },
  EPIC:   { label:'Epic',   glow:'shadow-amber-400/60',   border:'border-amber-400/80',  bg:'from-amber-900 to-orange-950' },
}

export default function ScratchCard({ cardId, emoji, name, rarity, isDuplicate, onScratched }: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isScratching, setIsScratching] = useState(false)
  const [scratchPercent, setScratchPercent] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [loading, setLoading] = useState(false)
  const lastPos = useRef<{x:number;y:number}|null>(null)
  const ri = RARITY_INFO[rarity] ?? RARITY_INFO.COMMON

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    // Silver metallic scratch surface
    const grad = ctx.createLinearGradient(0,0,canvas.width,canvas.height)
    grad.addColorStop(0,'#d1d5db'); grad.addColorStop(0.3,'#9ca3af'); grad.addColorStop(0.6,'#e5e7eb'); grad.addColorStop(1,'#9ca3af')
    ctx.fillStyle = grad; ctx.fillRect(0,0,canvas.width,canvas.height)
    // Shimmer lines
    for (let i=0;i<16;i++) {
      ctx.beginPath(); ctx.moveTo(0,(canvas.height/16)*i); ctx.lineTo(canvas.width,(canvas.height/16)*i+24)
      ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.lineWidth=10; ctx.stroke()
    }
    // Text
    ctx.fillStyle='rgba(60,40,100,0.75)'; ctx.font='bold 15px sans-serif'; ctx.textAlign='center'
    ctx.fillText('✨ Scratch here! ✨',canvas.width/2,canvas.height/2-8)
    ctx.font='11px sans-serif'; ctx.fillStyle='rgba(60,40,100,0.5)'
    ctx.fillText('Swipe your finger',canvas.width/2,canvas.height/2+14)
  }, [])

  function getPos(e:React.MouseEvent|React.TouchEvent,canvas:HTMLCanvasElement) {
    const rect=canvas.getBoundingClientRect(); const scaleX=canvas.width/rect.width; const scaleY=canvas.height/rect.height
    if ('touches' in e) return {x:(e.touches[0].clientX-rect.left)*scaleX,y:(e.touches[0].clientY-rect.top)*scaleY}
    return {x:(e.clientX-rect.left)*scaleX,y:(e.clientY-rect.top)*scaleY}
  }

  function scratch(x:number,y:number) {
    const canvas=canvasRef.current; if(!canvas) return
    const ctx=canvas.getContext('2d'); if(!ctx) return
    ctx.globalCompositeOperation='destination-out'; ctx.beginPath()
    if (lastPos.current) { ctx.moveTo(lastPos.current.x,lastPos.current.y); ctx.lineTo(x,y); ctx.lineWidth=48; ctx.lineCap='round'; ctx.lineJoin='round'; ctx.strokeStyle='rgba(0,0,0,1)'; ctx.stroke() }
    ctx.arc(x,y,26,0,Math.PI*2); ctx.fill(); lastPos.current={x,y}
    const imageData=ctx.getImageData(0,0,canvas.width,canvas.height); const pixels=imageData.data; let transparent=0
    for (let i=3;i<pixels.length;i+=4) { if(pixels[i]<128) transparent++ }
    const percent=(transparent/(pixels.length/4))*100; setScratchPercent(percent)
    if (percent>2&&!revealed) handleFullReveal()
  }

  async function handleFullReveal() {
    if (revealed||loading) return; setRevealed(true); setLoading(true)
    const canvas=canvasRef.current; if(canvas){const ctx=canvas.getContext('2d');if(ctx)ctx.clearRect(0,0,canvas.width,canvas.height)}
    try {
      const res=await fetch('/api/cards/scratch',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cardId})})
      const data=await res.json(); if(data.success) onScratched(data)
    } catch(e){console.error(e)} finally {setLoading(false)}
  }

  return (
    <div className="relative">
      {/* Revealed card */}
      <div className={`w-64 h-80 rounded-3xl border-2 ${ri.border} bg-gradient-to-br ${ri.bg} flex flex-col items-center justify-between p-5 shadow-2xl ${ri.glow}`}>
        <div className="w-full flex justify-end">
          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${rarity==='EPIC'?'bg-amber-500/30 text-amber-300 border border-amber-400/50':rarity==='RARE'?'bg-indigo-500/30 text-indigo-300 border border-indigo-400/50':'bg-slate-600/40 text-slate-300 border border-slate-500/40'}`}>
            {ri.label}
          </span>
        </div>
        <motion.div animate={{y:[0,-8,0]}} transition={{duration:2.5,repeat:Infinity,ease:'easeInOut'}} className="text-7xl">{emoji}</motion.div>
        <div className="text-center space-y-2 w-full">
          <p className="text-white font-black text-sm" style={{textShadow:'0 2px 8px rgba(0,0,0,0.5)'}}>{name}</p>
          {isDuplicate && <p className="text-amber-300 text-xs font-bold bg-amber-500/20 border border-amber-400/30 rounded-lg py-1">⚡ Duplicate — can be gifted</p>}
        </div>
      </div>
      {/* Scratch overlay */}
      {!revealed && (
        <canvas ref={canvasRef} width={256} height={320} className="absolute inset-0 w-full h-full rounded-3xl cursor-pointer touch-none"
          onMouseDown={e=>{setIsScratching(true);lastPos.current=null;scratch(...Object.values(getPos(e,canvasRef.current!)) as [number,number])}}
          onMouseMove={e=>{if(isScratching)scratch(...Object.values(getPos(e,canvasRef.current!)) as [number,number])}}
          onMouseUp={()=>{setIsScratching(false);lastPos.current=null}} onMouseLeave={()=>{setIsScratching(false);lastPos.current=null}}
          onTouchStart={e=>{e.preventDefault();setIsScratching(true);lastPos.current=null;scratch(...Object.values(getPos(e,canvasRef.current!)) as [number,number])}}
          onTouchMove={e=>{e.preventDefault();if(isScratching)scratch(...Object.values(getPos(e,canvasRef.current!)) as [number,number])}}
          onTouchEnd={()=>{setIsScratching(false);lastPos.current=null}} />
      )}
      {/* Scratch hint */}
      {!revealed&&scratchPercent===0&&(
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <p className="text-white/50 text-[10px] text-center font-bold">👆 Scratch to reveal!</p>
        </div>
      )}
    </div>
  )
}
