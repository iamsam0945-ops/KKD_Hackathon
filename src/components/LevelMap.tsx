'use client'
import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Friend { id: string; name: string; username: string; currentLevel: number; points: number }

interface LevelMapProps {
  currentLevel: number
  completedLevels: number[]
  friends: Friend[]
  userName: string
  onAddFriend: () => void
}

const LEVEL_NODES: { level: number; x: number; y: number }[] = [
  { level: 1,  x: 50,  y: 1160 },
  { level: 2,  x: 22,  y: 1030 },
  { level: 3,  x: 68,  y: 910  },
  { level: 4,  x: 82,  y: 775  },
  { level: 5,  x: 50,  y: 640  },
  { level: 6,  x: 18,  y: 510  },
  { level: 7,  x: 40,  y: 385  },
  { level: 8,  x: 75,  y: 265  },
  { level: 9,  x: 58,  y: 145  },
  { level: 10, x: 50,  y: 30   },
]

const MAP_HEIGHT = 1220
const FRIEND_COLORS = ['#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

function getFriendColor(name: string) {
  return FRIEND_COLORS[(name.charCodeAt(0) + name.charCodeAt(name.length - 1)) % FRIEND_COLORS.length]
}

function nodeStyle(completed: boolean, isCurrent: boolean, isBonus: boolean) {
  if (isBonus && (completed || isCurrent)) return {
    bg: 'linear-gradient(135deg,#92400e,#d97706,#f59e0b)',
    ring: '#fbbf24',
    shadow: 'rgba(251,191,36,0.55)',
    textColor: '#fff',
  }
  if (isCurrent) return {
    bg: 'linear-gradient(135deg,#5b21b6,#7c3aed,#a855f7)',
    ring: '#c084fc',
    shadow: 'rgba(168,85,247,0.55)',
    textColor: '#fff',
  }
  if (completed) return {
    bg: 'linear-gradient(135deg,#064e3b,#065f46,#059669)',
    ring: '#34d399',
    shadow: 'rgba(52,211,153,0.45)',
    textColor: '#fff',
  }
  return {
    bg: 'linear-gradient(135deg,#0f0a24,#1a1040)',
    ring: '#2d1f5e',
    shadow: 'transparent',
    textColor: 'rgba(255,255,255,0.2)',
  }
}

export default function LevelMap({ currentLevel, completedLevels, friends, userName, onAddFriend }: LevelMapProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeFriend, setActiveFriend] = useState<string | null>(null)

  useEffect(() => {
    const node = LEVEL_NODES.find(n => n.level === currentLevel)
    if (!node || !scrollRef.current) return
    const containerH = scrollRef.current.clientHeight
    const targetScroll = node.y - containerH / 2 + 40
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: Math.max(0, targetScroll), behavior: 'smooth' })
    }, 300)
  }, [currentLevel])

  const friendsByLevel: Record<number, Friend[]> = {}
  friends.forEach(f => {
    if (!friendsByLevel[f.currentLevel]) friendsByLevel[f.currentLevel] = []
    friendsByLevel[f.currentLevel].push(f)
  })

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b-2 border-white/10 shrink-0 bg-[#0a0514]/85 backdrop-blur-sm">
        <div>
          <h2 className="text-white font-black text-base">🗺️ Journey Map</h2>
          <p className="text-white/40 text-xs font-semibold">Level {currentLevel} of 10</p>
        </div>
        <div className="flex items-center gap-2">
          {friends.length > 0 && (
            <div className="flex -space-x-1.5">
              {friends.slice(0, 4).map(f => (
                <div key={f.id}
                  className="w-7 h-7 rounded-full border-2 border-[#0a0514] flex items-center justify-center text-xs font-black text-white"
                  style={{ background: getFriendColor(f.name) }}
                  title={f.name}
                >
                  {f.name[0]}
                </div>
              ))}
              {friends.length > 4 && (
                <div className="w-7 h-7 rounded-full border-2 border-[#0a0514] bg-white/10 flex items-center justify-center text-[9px] text-white/60 font-bold">
                  +{friends.length - 4}
                </div>
              )}
            </div>
          )}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={onAddFriend}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-500/25 border-2 border-violet-400/40 text-violet-300 text-xs font-black"
          >
            <span>👥</span> {friends.length === 0 ? 'Add Friends' : 'Add'}
          </motion.button>
        </div>
      </div>

      {/* Map scroll area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto relative" style={{ minHeight: 0 }}>
        {/* Starfield */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 40 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-0.5 h-0.5 rounded-full bg-white"
              style={{
                left: `${(i * 37 + 13) % 100}%`,
                top: `${(i * 53 + 7) % 100}%`,
                opacity: 0.08 + (i % 5) * 0.04,
              }}
              animate={{ opacity: [0.08, 0.35, 0.08] }}
              transition={{ duration: 2 + (i % 4), repeat: Infinity, delay: i * 0.1 }}
            />
          ))}
        </div>

        <div className="relative mx-auto" style={{ width: '100%', height: MAP_HEIGHT + 80 }}>
          {/* SVG path */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width="100%" height={MAP_HEIGHT + 80}
            style={{ overflow: 'visible' }}
          >
            <defs>
              <filter id="glow-green">
                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="glow-violet">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {LEVEL_NODES.slice(0, -1).map((node, i) => {
              const next = LEVEL_NODES[i + 1]
              const isCompleted = completedLevels.includes(node.level)
              const cx1 = node.x, cy1 = node.y + 40
              const cx2 = next.x, cy2 = next.y + 40
              const midX = (cx1 + cx2) / 2
              const midY = (cy1 + cy2) / 2

              return (
                <g key={node.level}>
                  {isCompleted && (
                    <line
                      x1={`${cx1}%`} y1={cy1}
                      x2={`${cx2}%`} y2={cy2}
                      stroke="#34d399"
                      strokeWidth={10}
                      opacity={0.18}
                      strokeLinecap="round"
                    />
                  )}
                  <line
                    x1={`${cx1}%`} y1={cy1}
                    x2={`${cx2}%`} y2={cy2}
                    stroke={isCompleted ? '#34d399' : '#2d1f5e'}
                    strokeWidth={isCompleted ? 4.5 : 2.5}
                    strokeDasharray={isCompleted ? '0' : '10 8'}
                    strokeLinecap="round"
                    opacity={0.9}
                    filter={isCompleted ? 'url(#glow-green)' : undefined}
                  />
                  {isCompleted && (
                    <circle cx={`${midX}%`} cy={midY} r={3.5} fill="#34d399" opacity={0.7} />
                  )}
                </g>
              )
            })}
          </svg>

          {/* Level nodes */}
          {LEVEL_NODES.map(({ level, x, y }) => {
            const isCurrent = level === currentLevel
            const isCompleted = completedLevels.includes(level)
            const isLocked = !isCurrent && !isCompleted
            const isBonus = level % 5 === 0
            const colors = nodeStyle(isCompleted, isCurrent, isBonus)
            const levelFriends = friendsByLevel[level] ?? []
            const nodeSize = isBonus ? 72 : isCurrent ? 66 : 56

            return (
              <div
                key={level}
                className="absolute flex flex-col items-center"
                style={{ left: `${x}%`, top: y, transform: 'translate(-50%, 0)' }}
              >
                {/* Friend avatars */}
                <AnimatePresence>
                  {levelFriends.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex -space-x-1.5 mb-1.5 relative"
                    >
                      {levelFriends.slice(0, 3).map((f, fi) => (
                        <motion.div
                          key={f.id}
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 1.8, repeat: Infinity, delay: fi * 0.3, ease: 'easeInOut' }}
                          className="relative"
                          onClick={() => setActiveFriend(activeFriend === f.id ? null : f.id)}
                        >
                          <div
                            className="w-8 h-8 rounded-full border-2 border-[#0a0514] flex items-center justify-center text-xs font-black text-white cursor-pointer"
                            style={{
                              background: getFriendColor(f.name),
                              boxShadow: `0 0 14px ${getFriendColor(f.name)}70`,
                            }}
                          >
                            {f.name[0]}
                          </div>
                          <AnimatePresence>
                            {activeFriend === f.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.8, y: 4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="absolute -top-12 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap"
                              >
                                <div className="bg-[#1a1040] border-2 border-violet-400/50 rounded-xl px-2.5 py-1.5 shadow-xl card-shadow-violet">
                                  <p className="text-white text-[10px] font-black">{f.name}</p>
                                  <p className="text-violet-300 text-[9px] font-semibold">{f.points} pts · L{f.currentLevel}</p>
                                </div>
                                <div className="w-2 h-2 bg-[#1a1040] border-r-2 border-b-2 border-violet-400/50 rotate-45 mx-auto -mt-1" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))}
                      {levelFriends.length > 3 && (
                        <div className="w-8 h-8 rounded-full border-2 border-[#0a0514] bg-white/10 flex items-center justify-center text-[9px] text-white/60 font-bold">
                          +{levelFriends.length - 3}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* YOU label */}
                {isCurrent && (
                  <motion.div
                    animate={{ y: [-4, 4, -4] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                    className="text-[11px] font-black text-violet-300 mb-1 tracking-wide"
                  >
                    YOU 👆
                  </motion.div>
                )}

                {/* Node circle */}
                <motion.div
                  animate={isCurrent
                    ? { scale: [1, 1.08, 1], boxShadow: [`0 0 0px ${colors.shadow}`, `0 8px 32px ${colors.shadow}`, `0 0 0px ${colors.shadow}`] }
                    : isCompleted
                    ? { boxShadow: [`0 0 0px ${colors.shadow}`, `0 0 18px ${colors.shadow}`, `0 0 0px ${colors.shadow}`] }
                    : {}
                  }
                  transition={{ duration: isCurrent ? 1.8 : 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative flex items-center justify-center rounded-full select-none"
                  style={{
                    width: nodeSize,
                    height: nodeSize,
                    background: colors.bg,
                    border: `3px solid ${colors.ring}`,
                    opacity: isLocked ? 0.4 : 1,
                    boxShadow: isCurrent
                      ? `0 6px 0 ${colors.shadow}, 0 0 24px ${colors.shadow}`
                      : isCompleted
                      ? `0 4px 0 ${colors.shadow}, 0 0 12px ${colors.shadow}`
                      : 'none',
                  }}
                >
                  <span className={isBonus ? 'text-2xl' : 'text-xl'}>
                    {isCompleted && !isBonus ? '✅' :
                     isCompleted && isBonus ? '⭐' :
                     isCurrent && !isBonus ? '🧘' :
                     isCurrent && isBonus ? '🏆' : '🔒'}
                  </span>

                  {/* Level chip */}
                  <span
                    className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black border-2 border-[#0a0514]"
                    style={{ background: isBonus ? '#f59e0b' : '#5b21b6', color: '#fff' }}
                  >
                    {level}
                  </span>

                  {/* Current ring pulse */}
                  {isCurrent && (
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{ border: `2.5px solid ${colors.ring}` }}
                      animate={{ scale: [1, 1.5, 1], opacity: [0.7, 0, 0.7] }}
                      transition={{ duration: 1.8, repeat: Infinity }}
                    />
                  )}
                </motion.div>

                {/* Label below */}
                <div className="mt-2 text-center">
                  <p className={`text-[10px] font-black ${isCurrent ? 'text-violet-300' : isCompleted ? 'text-emerald-400' : 'text-white/20'}`}>
                    {isBonus ? '★ BONUS' : `Level ${level}`}
                  </p>
                  {(isCurrent || isCompleted) && (
                    <p className="text-[9px] text-white/30 mt-0.5 font-semibold">
                      {isBonus ? '1000 pts' : `${level * 50} pts`}
                    </p>
                  )}
                </div>
              </div>
            )
          })}

          {/* Bottom banner */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full border-2 border-white/10 bg-white/5">
              <span className="text-sm">🌱</span>
              <span className="text-white/25 text-[10px] font-bold">Your yoga journey starts here</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
