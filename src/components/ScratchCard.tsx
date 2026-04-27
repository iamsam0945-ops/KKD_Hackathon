'use client'
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

interface ScratchCardProps {
  cardId: string
  emoji: string
  name: string
  rarity: string
  isDuplicate: boolean
  onScratched: (result: {
    card: { cardTemplate: { name: string; imageEmoji: string; rarity: string } }
    levelCompleted: boolean
    rewards: { points: number; yogaDays: number; isBonusLevel: boolean; nextLevel: number } | null
    uniqueCollected: number
    uniqueNeeded: number
  }) => void
}

const RARITY_STYLES: Record<string, {
  border: string; bg: string; shadow: string;
  badge: string; badgeText: string; glow: string;
  canvasGrad: [string, string, string];
}> = {
  COMMON: {
    border: 'border-violet-400',
    bg: 'from-violet-950 via-[#1a0d40] to-indigo-950',
    shadow: 'card-shadow-violet',
    badge: 'bg-violet-500/40 border-violet-300/60 text-violet-100',
    badgeText: 'COMMON',
    glow: 'shadow-violet-500/40',
    canvasGrad: ['#1e1b4b', '#312e81', '#4c1d95'],
  },
  RARE: {
    border: 'border-sky-400',
    bg: 'from-sky-950 via-[#0a1a3a] to-blue-950',
    shadow: 'card-shadow-blue',
    badge: 'bg-sky-500/40 border-sky-300/60 text-sky-100',
    badgeText: 'RARE',
    glow: 'shadow-sky-500/40',
    canvasGrad: ['#0c1a2e', '#0a1f40', '#082060'],
  },
  EPIC: {
    border: 'border-amber-400',
    bg: 'from-amber-950 via-[#2a1500] to-orange-950',
    shadow: 'card-shadow-gold',
    badge: 'bg-amber-500/40 border-amber-300/60 text-amber-100',
    badgeText: 'EPIC ✦',
    glow: 'shadow-amber-500/40',
    canvasGrad: ['#1c0f00', '#2d1800', '#3d2000'],
  },
}

export default function ScratchCard({ cardId, emoji, name, rarity, isDuplicate, onScratched }: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isScratching, setIsScratching] = useState(false)
  const [scratchPercent, setScratchPercent] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [loading, setLoading] = useState(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  const styles = RARITY_STYLES[rarity] ?? RARITY_STYLES.COMMON

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const [c0, c1, c2] = styles.canvasGrad
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, c0)
    gradient.addColorStop(0.5, c1)
    gradient.addColorStop(1, c2)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Subtle grid pattern
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'
    ctx.lineWidth = 1
    for (let x = 0; x < canvas.width; x += 20) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke()
    }
    for (let y = 0; y < canvas.height; y += 20) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke()
    }

    ctx.fillStyle = 'rgba(255,255,255,0.18)'
    ctx.font = 'bold 15px Nunito, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('✨ SCRATCH HERE ✨', canvas.width / 2, canvas.height / 2 - 10)
    ctx.font = '11px Nunito, sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.12)'
    ctx.fillText('Swipe to reveal your card', canvas.width / 2, canvas.height / 2 + 12)

    for (let i = 0; i < 35; i++) {
      ctx.beginPath()
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 2.5, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.35})`
      ctx.fill()
    }
  }, [])

  function getPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  function scratch(x: number, y: number) {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()

    if (lastPos.current) {
      ctx.moveTo(lastPos.current.x, lastPos.current.y)
      ctx.lineTo(x, y)
      ctx.lineWidth = 44
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = 'rgba(0,0,0,1)'
      ctx.stroke()
    }

    ctx.arc(x, y, 24, 0, Math.PI * 2)
    ctx.fill()
    lastPos.current = { x, y }

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const pixels = imageData.data
    let transparent = 0
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] < 128) transparent++
    }
    const percent = (transparent / (pixels.length / 4)) * 100
    setScratchPercent(percent)

    if (percent > 75 && !revealed) {
      handleFullReveal()
    }
  }

  async function handleFullReveal() {
    if (revealed || loading) return
    setRevealed(true)
    setLoading(true)

    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
    }

    try {
      const res = await fetch('/api/cards/scratch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId }),
      })
      const data = await res.json()
      if (data.success) onScratched(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      {/* Revealed card layer */}
      <div
        className={`w-64 h-80 rounded-3xl flex flex-col items-center justify-between p-5 border-[3px] ${styles.border} ${styles.shadow} bg-gradient-to-br ${styles.bg} overflow-hidden relative`}
      >
        {/* Inner shine */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/8 via-transparent to-transparent pointer-events-none rounded-3xl" />

        {/* Top badge */}
        <div className="w-full flex justify-end relative z-10">
          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${styles.badge}`}>
            {styles.badgeText}
          </span>
        </div>

        {/* Emoji */}
        <motion.div
          animate={{ rotate: [0, -6, 6, 0], scale: [1, 1.12, 1] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className="text-7xl drop-shadow-2xl relative z-10"
        >
          {emoji}
        </motion.div>

        {/* Name + rarity */}
        <div className="text-center space-y-2 w-full relative z-10">
          <p className="text-white font-black text-base leading-tight">{name}</p>
          {isDuplicate && (
            <motion.p
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-amber-300 text-xs font-black bg-amber-500/20 border border-amber-400/40 rounded-xl px-3 py-1"
            >
              ⚡ Duplicate — can be gifted!
            </motion.p>
          )}
        </div>
      </div>

      {/* EPIC shimmer */}
      {rarity === 'EPIC' && (
        <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-300/20 to-transparent skew-x-12"
            animate={{ x: ['-150%', '250%'] }}
            transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1.2 }}
          />
        </div>
      )}

      {/* Scratch canvas overlay */}
      {!revealed && (
        <canvas
          ref={canvasRef}
          width={256}
          height={320}
          className="absolute inset-0 w-full h-full rounded-3xl cursor-pointer touch-none"
          onMouseDown={(e) => { setIsScratching(true); lastPos.current = null; scratch(...Object.values(getPos(e, canvasRef.current!)) as [number, number]) }}
          onMouseMove={(e) => { if (isScratching) scratch(...Object.values(getPos(e, canvasRef.current!)) as [number, number]) }}
          onMouseUp={() => { setIsScratching(false); lastPos.current = null }}
          onMouseLeave={() => { setIsScratching(false); lastPos.current = null }}
          onTouchStart={(e) => { e.preventDefault(); setIsScratching(true); lastPos.current = null; scratch(...Object.values(getPos(e, canvasRef.current!)) as [number, number]) }}
          onTouchMove={(e) => { e.preventDefault(); if (isScratching) scratch(...Object.values(getPos(e, canvasRef.current!)) as [number, number]) }}
          onTouchEnd={() => { setIsScratching(false); lastPos.current = null }}
        />
      )}

      {/* Scratch progress */}
      {!revealed && scratchPercent > 0 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-44 space-y-1">
          <div className="h-2 bg-white/10 rounded-full overflow-hidden border border-white/10">
            <motion.div
              className="h-full progress-animated rounded-full"
              animate={{ width: `${Math.min((scratchPercent / 75) * 100, 100)}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
          <p className="text-white/40 text-[9px] text-center font-bold">
            {scratchPercent < 75 ? `Keep scratching! ${Math.round((scratchPercent / 75) * 100)}%` : 'Revealing... ✨'}
          </p>
        </div>
      )}
    </div>
  )
}
