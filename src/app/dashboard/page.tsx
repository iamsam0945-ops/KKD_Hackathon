'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import ReferralShare from '@/components/ReferralShare'
import LevelProgress from '@/components/LevelProgress'
import LevelMap from '@/components/LevelMap'
import { Suspense } from 'react'

interface User {
  id: string; name: string; username: string; phone: string
  points: number; yogaDays: number; currentLevel: number
  referralToken: string; referralCount: number; totalReferrals: number
}
interface LevelData {
  currentLevel: number
  levelConfig: { isBonusLevel: boolean; points: number; yogaDays: number; label: string }
  collection: { id: string; name: string; emoji: string; rarity: string; description: string; collected: boolean; source?: string }[]
  uniqueCollected: number; uniqueNeeded: number; unscratchedCount: number
  completedLevels: number[]; points: number; yogaDays: number
}
interface CardData {
  id: string; status: string; isDuplicate: boolean; source: string; earnedAt: string
  cardTemplate: { name: string; imageEmoji: string; rarity: string; description: string; level: number }
}
interface FriendData { id: string; name: string; username: string; currentLevel: number; points: number; friendshipId: string }
interface FriendRequest { id: string; name: string; username: string; currentLevel: number; friendshipId: string }
interface NotificationData { id: string; type: string; title: string; body: string; read: boolean; createdAt: string }

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

// ─────────────────────────────────────────────────────────
function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isWelcome = searchParams.get('welcome') === '1'

  const [user, setUser] = useState<User | null>(null)
  const [levelData, setLevelData] = useState<LevelData | null>(null)
  const [cards, setCards] = useState<CardData[]>([])
  const [friends, setFriends] = useState<FriendData[]>([])
  const [incoming, setIncoming] = useState<FriendRequest[]>([])
  const [tab, setTab] = useState<'home' | 'scratch' | 'collection' | 'map' | 'notifications'>('home')
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const [showWelcome, setShowWelcome] = useState(isWelcome)
  const [showAddFriend, setShowAddFriend] = useState(false)
  const [addUsername, setAddUsername] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [addMsg, setAddMsg] = useState('')

  const [giftCard, setGiftCard] = useState<CardData | null>(null)
  const [giftLoadingId, setGiftLoadingId] = useState<string | null>(null)  // friendId loading
  const [giftSentId, setGiftSentId] = useState<string | null>(null)        // friendId success

  const [requestCardName, setRequestCardName] = useState<string | null>(null) // card name being requested
  const [requestCardEmoji, setRequestCardEmoji] = useState<string>('')
  const [requestLoadingId, setRequestLoadingId] = useState<string | null>(null)
  const [requestSentId, setRequestSentId] = useState<string | null>(null)
  const [friendsWithDuplicate, setFriendsWithDuplicate] = useState<{
    id: string; name: string; username: string; hasDuplicate: boolean; duplicateCardId: string | null; totalCount: number
  }[]>([])

  const [showFaq, setShowFaq] = useState(false)
  const [giftingNotifId, setGiftingNotifId] = useState<string | null>(null)
  const [giftedNotifIds, setGiftedNotifIds] = useState<Set<string>>(new Set())

  async function loadData() {
    const [meRes, levelRes, cardsRes, friendsRes, notifRes] = await Promise.all([
      fetch('/api/auth/me'),
      fetch('/api/levels'),
      fetch('/api/cards'),
      fetch('/api/friends'),
      fetch('/api/notifications'),
    ])
    if (!meRes.ok) { router.push('/login'); return }
    const [me, level, cardsData, friendsData, notifData] = await Promise.all([
      meRes.json(), levelRes.json(), cardsRes.json(), friendsRes.json(), notifRes.json()
    ])
    setUser(me.user)
    setLevelData(level)
    setCards(cardsData.cards)
    setFriends(friendsData.friends ?? [])
    setIncoming(friendsData.incoming ?? [])
    setNotifications(notifData.notifications ?? [])
    setUnreadCount(notifData.unreadCount ?? 0)
  }

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    if (!requestCardName) { setFriendsWithDuplicate([]); return }
    fetch(`/api/cards/friends-with-duplicate?cardName=${encodeURIComponent(requestCardName)}`)
      .then(r => r.json())
      .then(d => setFriendsWithDuplicate(d.friends ?? []))
      .catch(() => setFriendsWithDuplicate([]))
  }, [requestCardName])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  async function openNotifications() {
    setTab('notifications')
    // Always reload to pick up new notifications since last visit
    const notifRes = await fetch('/api/notifications')
    if (notifRes.ok) {
      const notifData = await notifRes.json()
      setNotifications(notifData.notifications ?? [])
      if ((notifData.unreadCount ?? 0) > 0) {
        await fetch('/api/notifications', { method: 'PATCH' })
        setUnreadCount(0)
        setNotifications((notifData.notifications ?? []).map((n: NotificationData) => ({ ...n, read: true })))
      } else {
        setUnreadCount(0)
      }
    }
  }

  async function handleGiftFromNotif(notifId: string, duplicateCardId: string | null, recipientUsername: string, cardName: string) {
    setGiftingNotifId(notifId)
    try {
      const res = await fetch('/api/cards/gift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: duplicateCardId ?? undefined, cardName, recipientUsername }),
      })
      if (res.ok) {
        setGiftedNotifIds(prev => new Set(prev).add(notifId))
        await loadData()
      }
    } finally {
      setGiftingNotifId(null)
    }
  }

  async function handleAddFriend() {
    if (!addUsername.trim()) return
    setAddLoading(true); setAddMsg('')
    const res = await fetch('/api/friends', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: addUsername.trim() }),
    })
    const data = await res.json()
    setAddMsg(res.ok ? `✅ Request sent to ${data.targetName}!` : `❌ ${data.error}`)
    if (res.ok) { setAddUsername(''); loadData() }
    setAddLoading(false)
  }

  async function handleFriendResponse(friendshipId: string, action: 'accept' | 'reject') {
    await fetch('/api/friends', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ friendshipId, action }),
    })
    loadData()
  }

  async function handleGiftToFriend(friend: FriendData) {
    if (!giftCard) return
    setGiftLoadingId(friend.id)
    const res = await fetch('/api/cards/gift', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId: giftCard.id, recipientUsername: friend.username }),
    })
    if (res.ok) {
      setGiftSentId(friend.id)
      setTimeout(() => { setGiftCard(null); setGiftSentId(null); loadData() }, 1200)
    }
    setGiftLoadingId(null)
  }

  async function handleCardRequest(friend: { id: string; username: string }, duplicateCardId?: string | null) {
    setRequestLoadingId(friend.id)
    try {
      const res = await fetch('/api/cards/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: friend.id, cardName: requestCardName, duplicateCardId: duplicateCardId ?? undefined }),
      })
      if (res.ok) {
        setRequestSentId(friend.id)
        setTimeout(() => { setRequestCardName(null); setRequestSentId(null); setFriendsWithDuplicate([]) }, 1400)
      } else {
        const err = await res.json().catch(() => ({}))
        console.error('Card request failed:', res.status, err)
      }
    } catch (e) {
      console.error('Card request error:', e)
    }
    setRequestLoadingId(null)
  }

  const unscratchedCards = cards.filter(c => c.status === 'UNSCRATCHED')
  const scratchedCards   = cards.filter(c => c.status === 'SCRATCHED')
  const duplicateCards   = scratchedCards.filter(c => c.isDuplicate)

  if (!user || !levelData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="text-4xl">🧘</motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0d0a24] pb-24 relative overflow-x-hidden">
      {/* Animated blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="animate-blob absolute -top-32 -left-32 w-80 h-80 rounded-full bg-pink-600/20 blur-3xl" style={{ animationDelay: '0s' }} />
        <div className="animate-blob absolute top-1/3 -right-24 w-72 h-72 rounded-full bg-violet-600/20 blur-3xl" style={{ animationDelay: '3s' }} />
        <div className="animate-blob absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full bg-sky-600/15 blur-3xl" style={{ animationDelay: '6s' }} />
        <div className="animate-blob absolute -bottom-24 right-1/3 w-56 h-56 rounded-full bg-emerald-600/15 blur-3xl" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* ── Welcome Modal ── */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.7, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.7 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="relative bg-gradient-to-br from-violet-950 via-[#1a0a30] to-pink-950 border-[3px] border-pink-400 rounded-3xl p-8 max-w-sm w-full text-center card-shadow-violet overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/6 to-transparent" />
              <motion.div animate={{ rotate: [0, -15, 15, -10, 10, 0], scale: [1, 1.3, 1] }} transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }} className="text-7xl mb-4 relative z-10">🎁</motion.div>
              <h2 className="text-2xl font-black text-white mb-2 relative z-10">Welcome to YogaQuest!</h2>
              <p className="text-white/60 text-sm mb-4 font-semibold relative z-10">You&apos;ve received your first scratch card. Share your link to earn more!</p>
              <div className="bg-white/10 border-2 border-pink-400/30 rounded-2xl p-4 mb-6 relative z-10">
                <p className="text-pink-300 font-black text-lg">🃏 1 Welcome Card</p>
                <p className="text-white/50 text-xs mt-1 font-semibold">Scratch it to reveal your first yoga pose!</p>
              </div>
              <motion.button whileTap={{ scale: 0.93 }}
                onClick={() => { setShowWelcome(false); setTab('scratch') }}
                className="relative z-10 w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-violet-500 text-white font-black text-sm shadow-lg shadow-pink-500/40 border-2 border-pink-300/30">
                ✨ Scratch Now!
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Add Friend Modal ── */}
      <AnimatePresence>
        {showAddFriend && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85, y: 30 }}
              transition={{ type: 'spring', stiffness: 280, damping: 24 }}
              className="relative bg-gradient-to-br from-sky-950 via-[#080e28] to-indigo-950 border-[3px] border-sky-400 rounded-3xl p-6 max-w-sm w-full card-shadow-blue overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
              <h3 className="text-white font-black text-lg mb-1 relative z-10">👥 Add Friend</h3>
              <p className="text-white/40 text-xs mb-4 font-semibold relative z-10">Enter their username to send a request</p>

              {/* Pending incoming requests */}
              {incoming.length > 0 && (
                <div className="mb-4 space-y-2">
                  <p className="text-purple-300 text-xs font-bold uppercase tracking-wide">Incoming Requests</p>
                  {incoming.map(req => (
                    <div key={req.friendshipId} className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0"
                        style={{ background: `hsl(${(req.name.charCodeAt(0) * 40) % 360}, 60%, 45%)` }}>
                        {req.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold truncate">{req.name}</p>
                        <p className="text-white/40 text-xs">@{req.username} · L{req.currentLevel}</p>
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => handleFriendResponse(req.friendshipId, 'accept')}
                          className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">✅</button>
                        <button onClick={() => handleFriendResponse(req.friendshipId, 'reject')}
                          className="px-2 py-1 rounded-lg bg-red-500/10 text-red-400 text-xs font-bold border border-red-400/20">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <input type="text" placeholder="e.g. arjun_yoga"
                value={addUsername} onChange={e => setAddUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddFriend()}
                className="relative z-10 w-full bg-white/8 border-2 border-sky-400/40 rounded-2xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-sky-400/80 text-sm mb-3 font-semibold" />
              {addMsg && <p className={`text-sm text-center mb-3 font-bold relative z-10 ${addMsg.startsWith('✅') ? 'text-emerald-400' : 'text-red-400'}`}>{addMsg}</p>}
              <div className="flex gap-3 relative z-10">
                <button onClick={() => { setShowAddFriend(false); setAddMsg('') }}
                  className="flex-1 py-3 rounded-2xl border-2 border-white/15 text-white/50 text-sm font-bold">Close</button>
                <motion.button whileTap={{ scale: 0.93 }} onClick={handleAddFriend} disabled={addLoading || !addUsername.trim()}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-violet-500 text-white font-black text-sm disabled:opacity-50 shadow-lg shadow-sky-500/30 border-2 border-sky-300/25">
                  {addLoading ? '...' : '➕ Send Request'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Gift Modal (friends list) ── */}
      <AnimatePresence>
        {giftCard && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => { setGiftCard(null); setGiftSentId(null) }}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              onClick={e => e.stopPropagation()}
              className="bg-gradient-to-b from-[#1a0a2e] to-[#0d0520] border-t border-purple-400/20 rounded-t-3xl p-5 w-full max-w-lg max-h-[70vh] flex flex-col">

              {/* Handle bar */}
              <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-4" />

              <h3 className="text-white font-bold text-base mb-0.5">🎁 Gift Card</h3>
              <p className="text-white/40 text-xs mb-4">
                Gifting <span className="text-purple-300 font-semibold">{giftCard.cardTemplate.imageEmoji} {giftCard.cardTemplate.name}</span> — choose a friend
              </p>

              {friends.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
                  <div className="text-4xl mb-3">👥</div>
                  <p className="text-white/50 text-sm font-medium mb-1">No friends yet</p>
                  <p className="text-white/30 text-xs mb-4">Add friends first to gift cards to them</p>
                  <button onClick={() => { setGiftCard(null); setShowAddFriend(true) }}
                    className="px-5 py-2.5 rounded-xl bg-purple-500/30 text-purple-300 text-sm font-bold border border-purple-400/30">
                    ➕ Add Friends
                  </button>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-2 pb-2">
                  {friends.map(f => {
                    const isSent = giftSentId === f.id
                    const isLoading = giftLoadingId === f.id
                    return (
                      <div key={f.id} className="flex items-center gap-3 bg-white/5 rounded-2xl p-3 border border-white/5">
                        <div className="w-11 h-11 rounded-full flex items-center justify-center text-base font-black text-white shrink-0"
                          style={{ background: `hsl(${(f.name.charCodeAt(0) * 40) % 360}, 60%, 40%)` }}>
                          {f.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-semibold truncate">{f.name}</p>
                          <p className="text-white/40 text-xs">@{f.username} · Level {f.currentLevel} · {f.points} pts</p>
                        </div>
                        <motion.button
                          whileTap={{ scale: 0.93 }}
                          onClick={() => !isSent && !isLoading && handleGiftToFriend(f)}
                          disabled={isLoading || !!giftSentId}
                          className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            isSent ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/30' :
                            'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                          } disabled:opacity-60`}
                        >
                          {isSent ? '✅ Sent!' : isLoading ? '...' : '🎁 Send'}
                        </motion.button>
                      </div>
                    )
                  })}
                </div>
              )}

              <button onClick={() => { setGiftCard(null); setGiftSentId(null) }}
                className="mt-3 w-full py-3 rounded-xl border border-white/10 text-white/50 text-sm font-medium">
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Card Request Modal (friends list with duplicate status) ── */}
      <AnimatePresence>
        {requestCardName !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => { setRequestCardName(null); setRequestSentId(null); setFriendsWithDuplicate([]) }}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              onClick={e => e.stopPropagation()}
              className="bg-gradient-to-b from-[#1a0a2e] to-[#0d0520] border-t border-purple-400/20 rounded-t-3xl p-5 w-full max-w-lg max-h-[75vh] flex flex-col">

              <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-4" />

              {/* Card being requested — prominent display */}
              <div className="flex items-center gap-3 bg-indigo-900/30 border border-indigo-400/20 rounded-2xl p-3 mb-4">
                <span className="text-3xl">{requestCardEmoji}</span>
                <div>
                  <p className="text-white/50 text-[10px] uppercase tracking-wider">I need this card</p>
                  <p className="text-white font-black text-base">{requestCardName}</p>
                </div>
              </div>

              <p className="text-white/40 text-xs mb-3">
                Friends with 🟢 have a spare to gift you — tap <span className="text-emerald-300 font-semibold">Request Gift</span>. Others get a nudge notification.
              </p>

              {friends.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
                  <div className="text-4xl mb-3">👥</div>
                  <p className="text-white/50 text-sm">Add friends to request cards from them</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-2 pb-2">
                  {friends.map(f => {
                    const isSent = requestSentId === f.id
                    const isLoading = requestLoadingId === f.id
                    const fwdInfo = friendsWithDuplicate.find(fw => fw.id === f.id)
                    const hasDuplicate = fwdInfo?.hasDuplicate ?? false
                    const dupCardId = fwdInfo?.duplicateCardId ?? null

                    return (
                      <div key={f.id} className={`flex items-center gap-3 rounded-2xl p-3 border transition-all ${
                        hasDuplicate ? 'bg-emerald-900/20 border-emerald-400/25' : 'bg-white/5 border-white/5'
                      }`}>
                        <div className="relative shrink-0">
                          <div className="w-11 h-11 rounded-full flex items-center justify-center text-base font-black text-white"
                            style={{ background: `hsl(${(f.name.charCodeAt(0) * 40) % 360}, 60%, 40%)` }}>
                            {f.name[0]}
                          </div>
                          {hasDuplicate && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full flex items-center justify-center text-[9px]">✓</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-semibold truncate">{f.name}</p>
                          <p className={`text-xs ${hasDuplicate ? 'text-emerald-400 font-medium' : 'text-white/40'}`}>
                            {fwdInfo === undefined ? '...' : hasDuplicate ? `Has ${fwdInfo.totalCount} · can gift!` : 'Doesn\'t have it'}
                          </p>
                        </div>
                        <motion.button
                          whileTap={{ scale: 0.93 }}
                          onClick={() => !isSent && !isLoading && handleCardRequest(f, dupCardId)}
                          disabled={isLoading || !!requestSentId}
                          className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                            isSent ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/30' :
                            hasDuplicate ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/40' :
                            'bg-indigo-500/20 text-indigo-300 border border-indigo-400/25'
                          } disabled:opacity-60`}
                        >
                          {isSent ? '✅ Sent!' : isLoading ? '...' : hasDuplicate ? '🎁 Request Gift' : '🙏 Ask'}
                        </motion.button>
                      </div>
                    )
                  })}
                </div>
              )}

              <button onClick={() => { setRequestCardName(null); setRequestSentId(null); setFriendsWithDuplicate([]) }}
                className="mt-3 w-full py-3 rounded-xl border border-white/10 text-white/50 text-sm font-medium">
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div className="sticky top-0 z-40 bg-[#0d0a24]/85 backdrop-blur-xl border-b border-white/8 px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <motion.span animate={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 3, repeat: Infinity }} className="text-2xl">🧘</motion.span>
            <span className="font-black text-base shimmer-text">YogaQuest</span>
            {incoming.length > 0 && (
              <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
                className="w-5 h-5 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full text-white text-[9px] flex items-center justify-center font-black shadow-lg shadow-pink-500/40">
                {incoming.length}
              </motion.span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-pink-500/20 border border-pink-400/40 text-pink-200 text-[10px] font-black px-2.5 py-1 rounded-full">✨ {user.points}pts</span>
            <span className="bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-[10px] font-black px-2.5 py-1 rounded-full">🧘 {user.yogaDays}d</span>
            <button onClick={handleLogout} className="text-white/25 text-xs font-bold hover:text-white/50">Exit</button>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className={`max-w-lg mx-auto pt-4 ${tab === 'map' ? 'px-0' : 'px-4'}`}>
        <AnimatePresence mode="wait">
          {/* HOME */}
          {tab === 'home' && (
            <motion.div key="home" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              {/* User greeting */}
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ boxShadow: ['0 0 0px rgba(244,114,182,0.4)', '0 0 16px rgba(244,114,182,0.7)', '0 0 0px rgba(244,114,182,0.4)'] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                  className="w-13 h-13 w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-violet-600 flex items-center justify-center text-xl font-black text-white shrink-0 border-2 border-pink-300/50">
                  {user.name[0]}
                </motion.div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-black text-base">Hey, {user.name.split(' ')[0]}! 👋</p>
                  <p className="text-white/40 text-xs font-semibold">@{user.username} · Level {user.currentLevel}</p>
                </div>
                {unscratchedCards.length > 0 && (
                  <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 1.3, repeat: Infinity }}
                    className="shrink-0 bg-gradient-to-r from-pink-500 to-violet-500 rounded-full px-3 py-1.5 text-xs font-black text-white cursor-pointer shadow-lg shadow-pink-500/40"
                    onClick={() => setTab('scratch')}>
                    {unscratchedCards.length} to scratch!
                  </motion.div>
                )}
              </div>

              {/* Scratch card banner */}
              {unscratchedCards.length > 0 && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  whileTap={{ scale: 0.97 }}
                  className="relative rounded-3xl p-4 border-[3px] border-pink-400 bg-gradient-to-br from-pink-950 via-[#1f0a2e] to-violet-950 cursor-pointer overflow-hidden card-shadow-violet"
                  onClick={() => setTab('scratch')}>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/6 to-transparent" />
                  <div className="flex items-center gap-4 relative z-10">
                    <motion.div animate={{ rotate: [-8, 8, -8], scale: [1, 1.1, 1] }} transition={{ duration: 1.8, repeat: Infinity }} className="text-5xl">🃏</motion.div>
                    <div className="flex-1">
                      <p className="text-white font-black text-base">{unscratchedCards.length} scratch card{unscratchedCards.length > 1 ? 's' : ''} waiting!</p>
                      <p className="text-pink-300/70 text-xs font-semibold">Tap to reveal your yoga poses ✨</p>
                    </div>
                    <motion.span animate={{ x: [0, 5, 0] }} transition={{ duration: 1.2, repeat: Infinity }} className="text-pink-300 text-2xl">→</motion.span>
                  </div>
                </motion.div>
              )}

              {/* Level mini progress */}
              <motion.div
                whileTap={{ scale: 0.98 }}
                className="relative rounded-3xl p-4 border-[3px] border-violet-400/60 bg-gradient-to-br from-violet-950/80 via-[#0f0d28] to-indigo-950/80 cursor-pointer overflow-hidden card-shadow-violet"
                onClick={() => setTab('map')}>
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                <div className="flex justify-between items-center mb-3 relative z-10">
                  <p className="text-white font-black text-sm">{levelData.levelConfig.isBonusLevel ? '⭐ BONUS ' : ''}Level {levelData.currentLevel}</p>
                  <span className="text-violet-300 text-xs font-black bg-violet-500/20 px-2 py-0.5 rounded-full border border-violet-400/30">{levelData.uniqueCollected}/{levelData.uniqueNeeded} cards</span>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden border border-white/10 relative z-10">
                  <motion.div className="h-full rounded-full progress-animated"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((levelData.uniqueCollected / levelData.uniqueNeeded) * 100, 100)}%` }}
                    transition={{ duration: 1.2 }} />
                </div>
                <p className="text-white/30 text-[10px] mt-2 text-right font-semibold relative z-10">Open journey map →</p>
              </motion.div>

              {/* Friends row */}
              <div className="relative rounded-3xl p-4 border-[3px] border-sky-400/40 bg-gradient-to-br from-sky-950/50 via-[#0a0d20] to-indigo-950/50">
                <div className="absolute inset-0 bg-gradient-to-br from-white/4 to-transparent rounded-3xl" />
                <div className="flex items-center justify-between mb-3 relative z-10">
                  <p className="text-white/80 text-xs font-black uppercase tracking-widest">👥 Friends</p>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowAddFriend(true)}
                    className="text-[10px] text-sky-200 font-black bg-sky-500/25 border border-sky-400/40 px-2.5 py-1 rounded-full flex items-center gap-1">
                    ➕ Add {incoming.length > 0 && <span className="bg-pink-500 text-white rounded-full px-1.5 text-[9px] font-black">{incoming.length}</span>}
                  </motion.button>
                </div>
                {friends.length === 0 ? (
                  <p className="text-white/25 text-xs text-center py-3 font-semibold">No friends yet — add some to see them on the map!</p>
                ) : (
                  <div className="flex gap-4 overflow-x-auto pb-1 relative z-10">
                    {friends.map(f => (
                      <div key={f.id} className="flex flex-col items-center gap-1.5 shrink-0">
                        <div className="w-11 h-11 rounded-full border-[2.5px] border-white/25 flex items-center justify-center text-sm font-black text-white shadow-lg"
                          style={{ background: `hsl(${(f.name.charCodeAt(0) * 45) % 360}, 65%, 45%)` }}>
                          {f.name[0]}
                        </div>
                        <p className="text-white/65 text-[10px] font-bold">{f.name.split(' ')[0]}</p>
                        <span className="text-white/30 text-[9px] font-bold bg-white/10 px-1.5 rounded-full">L{f.currentLevel}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <ReferralShare referralToken={user.referralToken} referralCount={user.referralCount} totalReferrals={user.totalReferrals} userName={user.name} />

              {duplicateCards.length > 0 && (
                <div className="relative rounded-3xl p-4 border-[3px] border-amber-400 bg-gradient-to-br from-amber-950 via-[#1a0e00] to-orange-950 card-shadow-gold overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/6 to-transparent" />
                  <p className="text-amber-200 font-black text-sm mb-3 relative z-10">⚡ {duplicateCards.length} Duplicate{duplicateCards.length > 1 ? 's' : ''} — Gift to Friends!</p>
                  <div className="space-y-2 relative z-10">
                    {duplicateCards.slice(0, 3).map(card => (
                      <div key={card.id} className="flex items-center gap-3 bg-white/8 rounded-2xl p-3 border border-amber-400/20">
                        <motion.span animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }} className="text-2xl">{card.cardTemplate.imageEmoji}</motion.span>
                        <span className="text-white/85 text-sm flex-1 font-bold">{card.cardTemplate.name}</span>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setGiftCard(card)}
                          className="px-3 py-1.5 rounded-xl bg-amber-500/30 text-amber-200 text-xs font-black border-2 border-amber-400/50 shadow-lg shadow-amber-500/20">
                          🎁 Gift
                        </motion.button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FAQ / How it works */}
              <FaqSection showFaq={showFaq} onToggle={() => setShowFaq(v => !v)} />
            </motion.div>
          )}

          {/* SCRATCH */}
          {tab === 'scratch' && (
            <motion.div key="scratch" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <ScratchTab cards={unscratchedCards} onDone={loadData} />
            </motion.div>
          )}

          {/* COLLECTION */}
          {tab === 'collection' && (
            <motion.div key="collection" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <LevelProgress
                currentLevel={levelData.currentLevel}
                uniqueCollected={levelData.uniqueCollected}
                uniqueNeeded={levelData.uniqueNeeded}
                collection={levelData.collection}
                isBonusLevel={levelData.levelConfig.isBonusLevel}
                points={levelData.points}
                yogaDays={levelData.yogaDays}
                completedLevels={levelData.completedLevels}
                onRequestCard={(cardName, cardEmoji) => {
                  if (friends.length === 0) { setShowAddFriend(true); return }
                  setRequestCardName(cardName)
                  setRequestCardEmoji(cardEmoji)
                }}
              />
              {/* All scratched cards (other levels) */}
              {scratchedCards.filter(c => c.cardTemplate.level !== levelData.currentLevel).length > 0 && (
                <div className="mt-6 space-y-3">
                  <p className="text-white/40 text-xs uppercase tracking-wide font-medium">All collected cards</p>
                  <CollectionTab cards={scratchedCards} onGift={setGiftCard} />
                </div>
              )}
            </motion.div>
          )}

          {/* MAP — Candy Crush style */}
          {tab === 'map' && (
            <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ height: 'calc(100vh - 120px)' }}>
              <LevelMap
                currentLevel={levelData.currentLevel}
                completedLevels={levelData.completedLevels}
                friends={friends}
                userName={user.name}
                onAddFriend={() => setShowAddFriend(true)}
              />
            </motion.div>
          )}

          {/* NOTIFICATIONS */}
          {tab === 'notifications' && (
            <motion.div key="notifications" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="space-y-3 pb-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-white font-black text-base">🔔 Notifications</h2>
                {notifications.length > 0 && (
                  <span className="text-white/30 text-xs">{notifications.length} total</span>
                )}
              </div>
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="text-5xl mb-4">🔔</div>
                  <p className="text-white/50 font-medium mb-1">All caught up!</p>
                  <p className="text-white/30 text-sm">Level ups, friend activity and gifts will appear here.</p>
                </div>
              ) : (
                notifications.map(n => {
                  const [displayBody, action] = (() => {
                    if (n.type !== 'CARD_REQUEST' || !n.body.includes('||')) return [n.body, null]
                    const idx = n.body.indexOf('||')
                    const text = n.body.slice(0, idx)
                    try { return [text, JSON.parse(n.body.slice(idx + 2))] } catch { return [text, null] }
                  })()
                  const canGift = n.type === 'CARD_REQUEST' && action?.requesterUsername && action?.cardName
                  const alreadyGifted = giftedNotifIds.has(n.id)
                  return (
                  <motion.div key={n.id}
                    initial={{ opacity: 0, x: -15, scale: 0.97 }} animate={{ opacity: 1, x: 0, scale: 1 }}
                    className={`relative rounded-3xl p-4 border-[2px] overflow-hidden transition-all ${
                      n.type === 'LEVEL_UP'        ? 'border-amber-400/50 bg-gradient-to-br from-amber-950/60 to-[#0d0a00]' :
                      n.type === 'FRIEND_ACCEPTED' ? 'border-emerald-400/50 bg-gradient-to-br from-emerald-950/60 to-[#000d06]' :
                      n.type === 'FRIEND_REJECTED' ? 'border-red-400/40 bg-gradient-to-br from-red-950/50 to-[#0d0000]' :
                      n.type === 'CARD_REQUEST'    ? 'border-indigo-400/50 bg-gradient-to-br from-indigo-950/60 to-[#040010]' :
                      n.read ? 'border-white/8 bg-white/3' : 'border-pink-400/40 bg-gradient-to-br from-pink-950/50 to-violet-950/40'
                    }`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                    <div className="flex gap-3 items-start relative z-10">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 border-2 ${
                        n.type === 'LEVEL_UP'        ? 'bg-amber-500/30 border-amber-400/50' :
                        n.type === 'FRIEND_ACCEPTED' ? 'bg-emerald-500/30 border-emerald-400/50' :
                        n.type === 'FRIEND_REJECTED' ? 'bg-red-500/25 border-red-400/40' :
                        n.type === 'CARD_REQUEST'    ? 'bg-indigo-500/30 border-indigo-400/50' :
                        'bg-pink-500/25 border-pink-400/40'
                      }`}>
                        {n.type === 'LEVEL_UP' ? '🏆' : n.type === 'FRIEND_ACCEPTED' ? '🤝' : n.type === 'FRIEND_REJECTED' ? '❌' : n.type === 'CARD_REQUEST' ? '🙏' : '🎁'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-black leading-tight ${n.read ? 'text-white/65' : 'text-white'}`}>{n.title}</p>
                        <p className="text-white/50 text-xs mt-0.5 leading-relaxed font-semibold">{displayBody}</p>
                        <p className="text-white/25 text-[10px] mt-1.5 font-bold">{timeAgo(n.createdAt)}</p>
                        {canGift && (
                          <button
                            disabled={!!giftingNotifId || alreadyGifted}
                            onClick={() => handleGiftFromNotif(n.id, action.duplicateCardId ?? null, action.requesterUsername, action.cardName)}
                            className={`mt-3 w-full py-2.5 rounded-2xl text-xs font-black transition-all border-2 ${
                              alreadyGifted
                                ? 'bg-emerald-500/25 text-emerald-300 border-emerald-400/50'
                                : 'bg-indigo-500/30 text-indigo-200 border-indigo-400/50 active:scale-95 shadow-lg shadow-indigo-500/20'
                            }`}
                          >
                            {alreadyGifted ? '✅ Gifted!' : giftingNotifId === n.id ? '✨ Gifting…' : `🎁 Gift ${action.cardName} to ${action.requesterName}`}
                          </button>
                        )}
                      </div>
                      {!n.read && (
                        <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                          className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-pink-400 to-violet-400 shrink-0 mt-1 shadow-lg shadow-pink-400/50" />
                      )}
                    </div>
                  </motion.div>
                  )
                })
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Bottom Nav ── */}
      <div className="fixed bottom-4 left-0 right-0 z-40 px-4">
        <div className="max-w-sm mx-auto bg-[#1a1535]/90 backdrop-blur-xl border-[2px] border-white/15 rounded-full px-2 py-2 shadow-2xl shadow-black/50 flex">
          {([
            { key: 'home' as const,          emoji: '🏠', label: 'Home',     badge: 0,                    onClick: () => setTab('home') },
            { key: 'scratch' as const,        emoji: '🃏', label: 'Scratch',  badge: unscratchedCards.length, onClick: () => setTab('scratch') },
            { key: 'collection' as const,     emoji: '📚', label: 'Cards',    badge: 0,                    onClick: () => setTab('collection') },
            { key: 'map' as const,            emoji: '🗺️', label: 'Map',      badge: incoming.length,      onClick: () => setTab('map') },
            { key: 'notifications' as const,  emoji: '🔔', label: 'Activity', badge: unreadCount,          onClick: openNotifications },
          ]).map(item => (
            <motion.button key={item.key} onClick={item.onClick}
              whileTap={{ scale: 0.88 }}
              className={`flex-1 py-2 flex flex-col items-center gap-0.5 relative rounded-full transition-all ${
                tab === item.key
                  ? 'bg-gradient-to-br from-pink-500/40 to-violet-500/40 text-white'
                  : 'text-white/35 hover:text-white/60'
              }`}>
              <motion.span
                className="text-xl leading-none"
                animate={tab === item.key ? { y: [0, -3, 0] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
              >{item.emoji}</motion.span>
              <span className={`text-[9px] font-black tracking-wide ${tab === item.key ? 'text-white/90' : 'text-white/30'}`}>{item.label}</span>
              {item.badge > 0 && (
                <motion.span animate={{ scale: [1, 1.25, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
                  className="absolute -top-0.5 right-1 w-4 h-4 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full text-white text-[9px] flex items-center justify-center font-black shadow-lg shadow-pink-500/50">
                  {item.badge}
                </motion.span>
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
function ScratchTab({ cards, onDone }: { cards: CardData[], onDone: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [scratchResult, setScratchResult] = useState<{
    card: { cardTemplate: { name: string; imageEmoji: string; rarity: string } }
    levelCompleted: boolean
    rewards: { points: number; yogaDays: number; isBonusLevel: boolean; nextLevel: number } | null
    uniqueCollected: number; uniqueNeeded: number
  } | null>(null)
  const [showReward, setShowReward] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ScratchCard = require('@/components/ScratchCard').default

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <motion.div animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }} transition={{ duration: 2.5, repeat: Infinity }} className="text-7xl mb-5">🎴</motion.div>
        <p className="text-white font-black text-xl mb-2">No cards to scratch</p>
        <p className="text-white/45 text-sm font-semibold">Share your referral link to earn more cards!</p>
      </div>
    )
  }

  const current = cards[currentIndex]

  function handleScratched(result: typeof scratchResult) {
    setScratchResult(result)
    if (result?.levelCompleted) setShowReward(true)
  }

  function nextCard() {
    setScratchResult(null); setShowReward(false)
    if (currentIndex < cards.length - 1) setCurrentIndex(i => i + 1)
    else onDone()
  }

  return (
    <div className="flex flex-col items-center py-6 space-y-6">
      <div className="flex gap-2">
        {cards.map((_, i) => (
          <motion.div key={i}
            animate={i === currentIndex ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              i === currentIndex ? 'bg-gradient-to-r from-pink-400 to-violet-400 w-8 shadow-lg shadow-pink-400/40' :
              i < currentIndex ? 'bg-emerald-400 w-2.5 shadow-sm shadow-emerald-400/40' :
              'bg-white/20 w-2.5'
            }`} />
        ))}
      </div>
      <p className="text-white/40 text-sm font-bold">Card {currentIndex + 1} of {cards.length}</p>

      {current && (
        <ScratchCard key={current.id} cardId={current.id} emoji={current.cardTemplate.imageEmoji}
          name={current.cardTemplate.name} rarity={current.cardTemplate.rarity}
          isDuplicate={current.isDuplicate} onScratched={handleScratched} />
      )}

      <AnimatePresence>
        {scratchResult && !showReward && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            className="text-center space-y-3 w-full max-w-xs">
            <div className="rounded-3xl p-4 border-[3px] border-violet-400 bg-gradient-to-br from-violet-950 via-[#130d2e] to-indigo-950 card-shadow-violet">
              <motion.p animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 1.5, repeat: 2 }}
                className="text-2xl mb-1">{scratchResult.card.cardTemplate.imageEmoji}</motion.p>
              <p className="text-white font-black text-base">{scratchResult.card.cardTemplate.name}</p>
              <p className="text-white/40 text-xs mt-1 font-semibold">{scratchResult.uniqueCollected}/{scratchResult.uniqueNeeded} unique cards</p>
            </div>
            <motion.button whileTap={{ scale: 0.95 }} onClick={nextCard}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 via-violet-500 to-indigo-500 text-white font-black text-sm border-[3px] border-pink-400/60 card-shadow-violet">
              {currentIndex < cards.length - 1 ? 'Next Card →' : '✅ Done!'}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Level up modal */}
      <AnimatePresence>
        {showReward && scratchResult?.rewards && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/75 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', bounce: 0.5, duration: 0.6 }}
              className={`relative rounded-3xl p-7 max-w-sm w-full text-center overflow-hidden border-[3px] ${
                scratchResult.rewards.isBonusLevel
                  ? 'bg-gradient-to-br from-amber-950 via-[#2a1500] to-orange-950 border-amber-400 card-shadow-gold'
                  : 'bg-gradient-to-br from-violet-950 via-[#130d2e] to-indigo-950 border-violet-400 card-shadow-violet'
              }`}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/8 via-transparent to-transparent pointer-events-none" />
              <motion.div animate={{ rotate: [0, -15, 15, 0], scale: [1, 1.35, 1] }}
                transition={{ duration: 1.5, repeat: 2 }} className="text-7xl mb-3 relative z-10">
                {scratchResult.rewards.isBonusLevel ? '🏆' : '🎉'}
              </motion.div>
              <h2 className={`text-2xl font-black mb-1 relative z-10 ${scratchResult.rewards.isBonusLevel ? 'shimmer-text' : 'text-white'}`}>
                {scratchResult.rewards.isBonusLevel ? 'BONUS LEVEL!' : 'Level Up!'}
              </h2>
              <p className="text-white/55 text-sm mb-5 font-semibold relative z-10">
                You completed Level {scratchResult.rewards.nextLevel - 1}! 🎊
              </p>
              <div className="space-y-2.5 mb-5 relative z-10">
                <div className={`rounded-2xl p-3 flex items-center gap-3 border-2 ${
                  scratchResult.rewards.isBonusLevel
                    ? 'bg-amber-500/15 border-amber-400/30'
                    : 'bg-pink-500/15 border-pink-400/30'
                }`}>
                  <span className="text-2xl">✨</span>
                  <span className="text-white font-black">+{scratchResult.rewards.points} Points</span>
                  <span className="text-white/40 text-xs ml-auto font-semibold">≈ ₹{(scratchResult.rewards.points / 10).toFixed(0)}</span>
                </div>
                <div className="bg-emerald-500/15 border-2 border-emerald-400/30 rounded-2xl p-3 flex items-center gap-3">
                  <span className="text-2xl">🧘</span>
                  <span className="text-white font-black">+{scratchResult.rewards.yogaDays} Yoga Days</span>
                  <span className="text-white/40 text-xs ml-auto font-semibold">FREE access</span>
                </div>
              </div>
              <motion.button whileTap={{ scale: 0.95 }} onClick={nextCard}
                className={`relative z-10 w-full py-3.5 rounded-2xl font-black text-white text-sm border-[3px] ${
                  scratchResult.rewards.isBonusLevel
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 border-amber-300/50 card-shadow-gold'
                    : 'bg-gradient-to-r from-pink-500 via-violet-500 to-indigo-500 border-pink-300/50 card-shadow-violet'
                }`}>
                Continue to Level {scratchResult.rewards.nextLevel} →
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
function CollectionTab({ cards, onGift }: { cards: CardData[], onGift: (card: CardData) => void }) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const FlipCard = require('@/components/FlipCard').default

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="text-5xl mb-3">📚</div>
        <p className="text-white/50 text-sm">Scratch cards to build your collection</p>
      </div>
    )
  }

  // Group cards by template name — stack duplicates
  const grouped = new Map<string, { representative: CardData; count: number; duplicates: CardData[] }>()
  for (const card of cards) {
    const key = card.cardTemplate.name
    if (!grouped.has(key)) {
      grouped.set(key, { representative: card, count: 1, duplicates: [] })
    } else {
      const g = grouped.get(key)!
      g.count++
      if (card.isDuplicate) g.duplicates.push(card)
    }
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from(grouped.values()).map(({ representative: card, count, duplicates }) => (
        <div key={card.id} className="space-y-1.5 relative">
          {/* Stacked shadow cards behind for count > 1 */}
          {count >= 3 && (
            <div className="absolute inset-0 rounded-2xl border border-purple-400/20 bg-purple-900/20"
              style={{ transform: 'rotate(4deg) translateY(4px)', zIndex: 0 }} />
          )}
          {count >= 2 && (
            <div className="absolute inset-0 rounded-2xl border border-purple-400/20 bg-purple-900/20"
              style={{ transform: 'rotate(2deg) translateY(2px)', zIndex: 0 }} />
          )}

          <div className="relative" style={{ zIndex: 1 }}>
            <FlipCard name={card.cardTemplate.name} emoji={card.cardTemplate.imageEmoji}
              rarity={card.cardTemplate.rarity} collected={true} source={card.source} />

            {/* Count badge */}
            {count > 1 && (
              <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-full px-2 py-0.5 border border-white/20">
                <span className="text-white text-[10px] font-black">×{count}</span>
              </div>
            )}
          </div>

          {/* Gift button — shows if any duplicates available */}
          {duplicates.length > 0 && (
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => onGift(duplicates[0])}
              className="w-full py-1.5 rounded-xl bg-amber-500/15 text-amber-300 text-xs font-bold border border-amber-400/25">
              🎁 Gift ({duplicates.length} extra{duplicates.length > 1 ? 's' : ''})
            </motion.button>
          )}
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    q: '🃏 How do I earn scratch cards?',
    a: 'Share your referral link. Every time someone fills in their name and phone on your link, you get a scratch card. You also get a free welcome card when you sign up!',
  },
  {
    q: '🎯 How do levels work?',
    a: 'Each level needs a certain number of unique yoga pose cards. Level 1 needs 2, Level 2 needs 3, and so on. Scratch your cards to collect new poses and advance!',
  },
  {
    q: '⭐ What are Bonus Levels?',
    a: 'Levels 5 and 10 are Bonus Levels. Complete them to earn 1000 points and extra yoga days — much bigger rewards than regular levels!',
  },
  {
    q: '🎁 How do I gift a duplicate card?',
    a: 'If you scratch a card you already have, it becomes a duplicate (marked ⚡). Tap "Gift" on any duplicate and pick a friend from your friends list to send it to them.',
  },
  {
    q: '🙏 How do I request a card from a friend?',
    a: 'On the Cards tab, uncollected slots show an "Ask Friend" button. Tap it to send a request notification to a friend. They\'ll see it in their Activity tab and can gift you a duplicate if they have one.',
  },
  {
    q: '🗺️ What is the Journey Map?',
    a: 'The Map tab shows a Candy Crush-style path of all 10 levels. You can see where your friends are on the journey and add new friends from there.',
  },
  {
    q: '✨ What are Points and Yoga Days?',
    a: 'Points are your score — earned by completing levels. Yoga Days are free class credits earned as rewards. They stack up as you progress through levels.',
  },
  {
    q: '🔗 Can I earn from someone else\'s referral link?',
    a: 'No — you only earn scratch cards from your own referral link when someone signs up using it. Make sure to share your unique link from the Home tab!',
  },
]

function FaqSection({ showFaq, onToggle }: { showFaq: boolean; onToggle: () => void }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">📖</span>
          <span className="text-white font-bold text-sm">How it Works — Rules & FAQ</span>
        </div>
        <motion.span
          animate={{ rotate: showFaq ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-white/40 text-sm"
        >
          ▼
        </motion.span>
      </button>

      <AnimatePresence>
        {showFaq && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/8 divide-y divide-white/5">
              {FAQ_ITEMS.map((item, i) => (
                <div key={i}>
                  <button
                    onClick={() => setOpenIndex(openIndex === i ? null : i)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left gap-3"
                  >
                    <span className="text-white/80 text-xs font-semibold flex-1">{item.q}</span>
                    <motion.span
                      animate={{ rotate: openIndex === i ? 180 : 0 }}
                      transition={{ duration: 0.15 }}
                      className="text-white/30 text-xs shrink-0"
                    >
                      ▼
                    </motion.span>
                  </button>
                  <AnimatePresence>
                    {openIndex === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <p className="px-4 pb-3 text-white/50 text-xs leading-relaxed">{item.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="text-4xl">🧘</motion.div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
