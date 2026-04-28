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
const SCRATCH_REVEAL_THRESHOLD = 0.15

export default function ScratchCard({ cardId, emoji, name, rarity, isDuplicate, onScratched }: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [revealed, setRevealed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [scratchPercent, setScratchPercent] = useState(0)
  const hasRevealedRef = useRef(false)   // ref guard — prevents double API calls
  const lastPos = useRef<{x:number;y:number}|null>(null)
  const isScratchingRef = useRef(false)
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
    ctx.fillText('✨ Scratch to reveal! ✨',canvas.width/2,canvas.height/2-8)
    ctx.font='11px sans-serif'; ctx.fillStyle='rgba(60,40,100,0.5)'
    ctx.fillText('Reveal unlocks after ~15% scratch',canvas.width/2,canvas.height/2+14)
  }, [])

  function getPos(e:React.MouseEvent|React.TouchEvent,canvas:HTMLCanvasElement) {
    const rect=canvas.getBoundingClientRect(); const scaleX=canvas.width/rect.width; const scaleY=canvas.height/rect.height
    if ('touches' in e) return {x:(e.touches[0].clientX-rect.left)*scaleX,y:(e.touches[0].clientY-rect.top)*scaleY}
    return {x:(e.clientX-rect.left)*scaleX,y:(e.clientY-rect.top)*scaleY}
  }

  // Just draws the visual scratch mark — does NOT control reveal logic
  function drawScratch(x:number,y:number) {
    const canvas=canvasRef.current; if(!canvas) return
    const ctx=canvas.getContext('2d'); if(!ctx) return
    ctx.globalCompositeOperation='destination-out'; ctx.beginPath()
    if (lastPos.current) {
      ctx.moveTo(lastPos.current.x,lastPos.current.y); ctx.lineTo(x,y)
      ctx.lineWidth=60; ctx.lineCap='round'; ctx.lineJoin='round'
      ctx.strokeStyle='rgba(0,0,0,1)'; ctx.stroke()
    }
    ctx.arc(x,y,30,0,Math.PI*2); ctx.fill()
    lastPos.current={x,y}
  }

  function computeScratchedRatio(): number {
    const canvas = canvasRef.current
    if (!canvas) return 0
    const ctx = canvas.getContext('2d')
    if (!ctx) return 0

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    let transparent = 0
    let total = 0
    const step = 8
    for (let y = 0; y < canvas.height; y += step) {
      for (let x = 0; x < canvas.width; x += step) {
        const alphaIdx = (y * canvas.width + x) * 4 + 3
        if (imageData[alphaIdx] < 20) transparent++
        total++
      }
    }
    return total > 0 ? transparent / total : 0
  }

  function tryRevealFromScratch() {
    const ratio = computeScratchedRatio()
    setScratchPercent(ratio)
    if (ratio >= SCRATCH_REVEAL_THRESHOLD) {
      void handleFullReveal()
    }
  }

  async function handleFullReveal() {
    if (hasRevealedRef.current) return
    hasRevealedRef.current = true
    setRevealed(true); setLoading(true)
    // Clear the overlay immediately for instant visual feedback
    const canvas=canvasRef.current
    if (canvas) { const ctx=canvas.getContext('2d'); if(ctx) ctx.clearRect(0,0,canvas.width,canvas.height) }
    try {
      const res=await fetch('/api/cards/scratch',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cardId})})
      const data=await res.json(); if(data.success) onScratched(data)
    } catch(e){console.error(e)} finally {setLoading(false)}
  }

  function onStart(e:React.MouseEvent|React.TouchEvent) {
    if ('touches' in e) e.preventDefault()
    isScratchingRef.current = true
    lastPos.current = null
    const pos = getPos(e, canvasRef.current!)
    drawScratch(pos.x, pos.y)
    tryRevealFromScratch()
  }

  function onMove(e:React.MouseEvent|React.TouchEvent) {
    if (!isScratchingRef.current || revealed) return
    if ('touches' in e) e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const pos = getPos(e, canvas)
    drawScratch(pos.x, pos.y)
    tryRevealFromScratch()
  }

  function onEnd() {
    isScratchingRef.current = false
    lastPos.current = null
    if (!revealed) tryRevealFromScratch()
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

      {/* Scratch overlay — hidden once revealed */}
      {!revealed && (
        <canvas
          ref={canvasRef}
          width={256} height={320}
          className="absolute inset-0 w-full h-full rounded-3xl cursor-pointer touch-none"
          onMouseDown={onStart}
          onMouseMove={onMove}
          onMouseUp={onEnd}
          onMouseLeave={onEnd}
          onTouchStart={onStart}
          onTouchMove={onMove}
          onTouchEnd={onEnd}
        />
      )}

      {!revealed && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/40 border border-white/20 px-2 py-0.5 text-[10px] text-white/80 font-semibold pointer-events-none">
          {Math.floor(scratchPercent * 100)}% scratched
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-black/20">
          <motion.div animate={{rotate:360}} transition={{duration:0.8,repeat:Infinity,ease:'linear'}} className="text-3xl">✨</motion.div>
        </div>
      )}
    </div>
  )
}
