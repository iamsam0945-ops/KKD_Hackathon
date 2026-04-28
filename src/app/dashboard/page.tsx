'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
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

const FRIEND_COLORS = ['#a78bfa','#f472b6','#34d399','#fbbf24','#60a5fa','#c084fc','#22d3ee','#fb923c']
function avatarColor(name: string) {
  return FRIEND_COLORS[(name.charCodeAt(0) + name.charCodeAt(name.length - 1)) % FRIEND_COLORS.length]
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
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
  const [giftLoadingId, setGiftLoadingId] = useState<string | null>(null)
  const [giftSentId, setGiftSentId] = useState<string | null>(null)

  const [requestCardName, setRequestCardName] = useState<string | null>(null)
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
      fetch('/api/auth/me'), fetch('/api/levels'), fetch('/api/cards'),
      fetch('/api/friends'), fetch('/api/notifications'),
    ])
    if (!meRes.ok) { router.push('/login'); return }
    const [me, level, cardsData, friendsData, notifData] = await Promise.all([
      meRes.json(), levelRes.json(), cardsRes.json(), friendsRes.json(), notifRes.json()
    ])
    setUser(me.user); setLevelData(level); setCards(cardsData.cards)
    setFriends(friendsData.friends ?? []); setIncoming(friendsData.incoming ?? [])
    setNotifications(notifData.notifications ?? []); setUnreadCount(notifData.unreadCount ?? 0)
  }

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    if (!requestCardName) { setFriendsWithDuplicate([]); return }
    fetch(`/api/cards/friends-with-duplicate?cardName=${encodeURIComponent(requestCardName)}`)
      .then(r => r.json()).then(d => setFriendsWithDuplicate(d.friends ?? [])).catch(() => setFriendsWithDuplicate([]))
  }, [requestCardName])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  async function openNotifications() {
    setTab('notifications')
    const notifRes = await fetch('/api/notifications')
    if (notifRes.ok) {
      const notifData = await notifRes.json()
      setNotifications(notifData.notifications ?? [])
      if ((notifData.unreadCount ?? 0) > 0) {
        await fetch('/api/notifications', { method: 'PATCH' })
        setUnreadCount(0)
        setNotifications((notifData.notifications ?? []).map((n: NotificationData) => ({ ...n, read: true })))
      } else { setUnreadCount(0) }
    }
  }

  async function handleGiftFromNotif(notifId: string, duplicateCardId: string | null, recipientUsername: string, cardName: string) {
    setGiftingNotifId(notifId)
    try {
      const res = await fetch('/api/cards/gift', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: duplicateCardId ?? undefined, cardName, recipientUsername }),
      })
      if (res.ok) { setGiftedNotifIds(prev => new Set(prev).add(notifId)); await loadData() }
    } finally { setGiftingNotifId(null) }
  }

  async function handleAddFriend() {
    if (!addUsername.trim()) return
    setAddLoading(true); setAddMsg('')
    const res = await fetch('/api/friends', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: addUsername.trim() }),
    })
    const data = await res.json()
    setAddMsg(res.ok ? `Request sent to ${data.targetName}!` : data.error)
    if (res.ok) { setAddUsername(''); loadData() }
    setAddLoading(false)
  }

  async function handleFriendResponse(friendshipId: string, action: 'accept' | 'reject') {
    const res = await fetch('/api/friends', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ friendshipId, action }),
    })
    if (!res.ok) { const err = await res.json().catch(() => ({})); console.error('Friend response failed:', res.status, err); return }
    loadData()
  }

  async function handleGiftToFriend(friend: FriendData) {
    if (!giftCard) return
    setGiftLoadingId(friend.id)
    const res = await fetch('/api/cards/gift', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId: giftCard.id, recipientUsername: friend.username }),
    })
    if (res.ok) { setGiftSentId(friend.id); setTimeout(() => { setGiftCard(null); setGiftSentId(null); loadData() }, 1200) }
    setGiftLoadingId(null)
  }

  async function handleCardRequest(friend: { id: string; username: string }, duplicateCardId?: string | null) {
    setRequestLoadingId(friend.id)
    try {
      const res = await fetch('/api/cards/request', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: friend.id, cardName: requestCardName, duplicateCardId: duplicateCardId ?? undefined }),
      })
      if (res.ok) { setRequestSentId(friend.id); setTimeout(() => { setRequestCardName(null); setRequestSentId(null); setFriendsWithDuplicate([]) }, 1400) }
      else { const err = await res.json().catch(() => ({})); console.error('Card request failed:', res.status, err) }
    } catch (e) { console.error('Card request error:', e) }
    setRequestLoadingId(null)
  }

  const unscratchedCards = cards.filter(c => c.status === 'UNSCRATCHED')
  const scratchedCards   = cards.filter(c => c.status === 'SCRATCHED')
  const duplicateCards   = scratchedCards.filter(c => c.isDuplicate)

  if (!user || !levelData) {
    return (
      <div className="min-h-screen bg-[#0d0824] flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="text-4xl">🧘</motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0d0824] pb-24">

      {/* ── Welcome Modal ── */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.7, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.7, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24, bounce: 0.5 }}
              className="candy-card p-7 max-w-sm w-full text-center">
              <motion.div animate={{ rotate: [0, -15, 15, -10, 10, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }} className="text-6xl mb-4">🎁</motion.div>
              <h2 className="text-xl font-black text-white mb-2" style={{textShadow:'0 0 12px rgba(167,139,250,0.6)'}}>Welcome to YogaQuest!</h2>
              <p className="text-violet-300/70 text-sm mb-5 font-semibold">You&apos;ve received your first scratch card. Share your link to earn more!</p>
              <div className="rounded-2xl p-4 mb-5" style={{background:'rgba(139,92,246,0.15)',border:'2px solid rgba(139,92,246,0.4)'}}>
                <p className="text-violet-200 font-black text-base">🃏 1 Welcome Card</p>
                <p className="text-violet-400/60 text-xs mt-1 font-semibold">Scratch it to reveal your first yoga pose!</p>
              </div>
              <motion.button whileTap={{y:5,boxShadow:'0 1px 0 #3b0764'}}
                onClick={() => { setShowWelcome(false); setTab('scratch') }}
                className="btn-candy-violet w-full py-4 text-base">
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
            <motion.div initial={{ scale: 0.85, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85, y: 24 }}
              transition={{ type: 'spring', stiffness: 280, damping: 26 }}
              className="candy-card p-6 max-w-sm w-full">
              <h3 className="text-white font-black text-base mb-1">👥 Add Friend</h3>
              <p className="text-violet-400/60 text-xs mb-4 font-semibold">Enter their username to send a request</p>

              {incoming.length > 0 && (
                <div className="mb-4 space-y-2 relative z-10">
                  <p className="text-violet-400 text-xs font-black uppercase tracking-wide">Incoming Requests</p>
                  {incoming.map(req => (
                    <div key={req.friendshipId} className="flex items-center gap-3 rounded-2xl p-3"
                      style={{background:'rgba(0,0,0,0.3)',border:'2px solid rgba(139,92,246,0.25)'}}>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black text-white shrink-0"
                        style={{ background: avatarColor(req.name), boxShadow:`0 0 10px ${avatarColor(req.name)}88` }}>
                        {req.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-black truncate">{req.name}</p>
                        <p className="text-violet-400/60 text-xs">@{req.username} · L{req.currentLevel}</p>
                      </div>
                      <div className="flex gap-1.5">
                        <motion.button whileTap={{y:3,boxShadow:'0 1px 0 #047857'}}
                          onClick={() => { handleFriendResponse(req.friendshipId, 'accept'); setShowAddFriend(false) }}
                          className="btn-candy-green px-2.5 py-1 text-xs">Accept</motion.button>
                        <motion.button whileTap={{y:3}}
                          onClick={() => { handleFriendResponse(req.friendshipId, 'reject'); setShowAddFriend(false) }}
                          className="px-2.5 py-1 rounded-xl text-xs font-black text-violet-400 border-2 border-violet-500/30 bg-black/20">Decline</motion.button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <input type="text" placeholder="e.g. arjun_yoga"
                value={addUsername} onChange={e => setAddUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddFriend()}
                className="w-full bg-black/30 border-2 border-violet-500/40 rounded-2xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-violet-400 transition-all text-sm font-semibold mb-3" />
              {addMsg && (
                <p className={`text-xs text-center mb-3 font-black ${addMsg.includes('sent') ? 'text-emerald-400' : 'text-red-400'}`}>{addMsg}</p>
              )}
              <div className="flex gap-2">
                <motion.button whileTap={{y:3}} onClick={() => { setShowAddFriend(false); setAddMsg('') }}
                  className="flex-1 py-3 rounded-2xl border-2 border-violet-500/40 text-violet-300 text-sm font-black bg-black/20">Close</motion.button>
                <motion.button whileTap={{y:5,boxShadow:'0 1px 0 #3b0764'}} onClick={handleAddFriend} disabled={addLoading || !addUsername.trim()}
                  className="flex-1 btn-candy-violet py-3 text-sm disabled:opacity-50">
                  {addLoading ? '...' : 'Send Request'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Gift Modal ── */}
      <AnimatePresence>
        {giftCard && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => { setGiftCard(null); setGiftSentId(null) }}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              onClick={e => e.stopPropagation()}
              className="rounded-t-3xl p-5 w-full max-w-lg max-h-[70vh] flex flex-col"
              style={{background:'linear-gradient(180deg,#2d1b69 0%,#1e0f4a 50%,#130930 100%)',border:'2px solid rgba(167,139,250,0.35)',borderBottom:'none'}}>
              <div className="w-10 h-1 rounded-full bg-violet-400/30 mx-auto mb-4" />
              <h3 className="text-white font-black text-base mb-0.5">🎁 Gift Card</h3>
              <p className="text-violet-400/60 text-xs mb-4 font-semibold">
                Gifting <span className="text-violet-200 font-black">{giftCard.cardTemplate.imageEmoji} {giftCard.cardTemplate.name}</span>
              </p>

              {friends.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-violet-400/60 text-sm mb-4 font-semibold">No friends yet</p>
                  <motion.button whileTap={{y:5,boxShadow:'0 1px 0 #3b0764'}}
                    onClick={() => { setGiftCard(null); setShowAddFriend(true) }}
                    className="btn-candy-violet px-5 py-2.5 text-sm">Add Friends</motion.button>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-2 pb-2">
                  {friends.map(f => {
                    const isSent = giftSentId === f.id
                    const isLoading = giftLoadingId === f.id
                    return (
                      <div key={f.id} className="flex items-center gap-3 rounded-2xl p-3"
                        style={{background:'rgba(0,0,0,0.3)',border:'2px solid rgba(139,92,246,0.2)'}}>
                        <div className="w-11 h-11 rounded-full flex items-center justify-center text-base font-black text-white shrink-0"
                          style={{ background: avatarColor(f.name), boxShadow:`0 0 12px ${avatarColor(f.name)}66` }}>{f.name[0]}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-black truncate">{f.name}</p>
                          <p className="text-violet-400/60 text-xs">@{f.username} · L{f.currentLevel}</p>
                        </div>
                        <motion.button whileTap={{y:isSent?0:4,boxShadow:isSent?'none':'0 1px 0 #047857'}}
                          onClick={() => !isSent && !isLoading && handleGiftToFriend(f)}
                          disabled={isLoading || !!giftSentId}
                          className={`shrink-0 px-4 py-2 rounded-xl text-xs font-black transition-all disabled:opacity-60 ${
                            isSent ? 'bg-emerald-500/20 text-emerald-300 border-2 border-emerald-400/40' :
                            'btn-candy-green py-2 px-4'
                          }`}>
                          {isSent ? '✅ Sent!' : isLoading ? '...' : '🎁 Gift'}
                        </motion.button>
                      </div>
                    )
                  })}
                </div>
              )}
              <motion.button whileTap={{y:3}} onClick={() => { setGiftCard(null); setGiftSentId(null) }}
                className="mt-3 w-full py-3 rounded-2xl border-2 border-violet-500/30 text-violet-400 text-sm font-black bg-black/20">
                Cancel
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Card Request Modal ── */}
      <AnimatePresence>
        {requestCardName !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => { setRequestCardName(null); setRequestSentId(null); setFriendsWithDuplicate([]) }}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              onClick={e => e.stopPropagation()}
              className="rounded-t-3xl p-5 w-full max-w-lg max-h-[75vh] flex flex-col"
              style={{background:'linear-gradient(180deg,#2d1b69 0%,#1e0f4a 50%,#130930 100%)',border:'2px solid rgba(167,139,250,0.35)',borderBottom:'none'}}>
              <div className="w-10 h-1 rounded-full bg-violet-400/30 mx-auto mb-4" />
              <div className="flex items-center gap-3 rounded-2xl p-3 mb-4"
                style={{background:'rgba(139,92,246,0.15)',border:'2px solid rgba(139,92,246,0.3)'}}>
                <span className="text-3xl">{requestCardEmoji}</span>
                <div>
                  <p className="text-violet-400 text-[10px] uppercase tracking-wider font-black">I need this card</p>
                  <p className="text-white font-black text-base">{requestCardName}</p>
                </div>
              </div>
              <p className="text-violet-400/60 text-xs mb-3 font-semibold">
                Friends with 🟢 have a spare — tap <span className="text-emerald-400 font-black">Request Gift</span>. Others get a nudge.
              </p>

              {friends.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-violet-400/60 text-sm font-semibold">Add friends to request cards from them</p>
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
                      <div key={f.id} className={`flex items-center gap-3 rounded-2xl p-3 border-2 transition-all ${
                        hasDuplicate ? 'border-emerald-400/40' : 'border-violet-500/20'
                      }`} style={{background:hasDuplicate?'rgba(52,211,153,0.08)':'rgba(0,0,0,0.3)'}}>
                        <div className="relative shrink-0">
                          <div className="w-11 h-11 rounded-full flex items-center justify-center text-base font-black text-white"
                            style={{ background: avatarColor(f.name), boxShadow:`0 0 10px ${avatarColor(f.name)}66` }}>{f.name[0]}</div>
                          {hasDuplicate && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center text-[9px] text-white font-black border-2 border-[#0d0824]">✓</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-black truncate">{f.name}</p>
                          <p className={`text-xs font-semibold ${hasDuplicate ? 'text-emerald-400' : 'text-violet-400/60'}`}>
                            {fwdInfo === undefined ? '...' : hasDuplicate ? 'Has spare · can gift!' : "Doesn't have it"}
                          </p>
                        </div>
                        <motion.button whileTap={{y:isSent?0:4}}
                          onClick={() => !isSent && !isLoading && handleCardRequest(f, dupCardId)}
                          disabled={isLoading || !!requestSentId}
                          className={`shrink-0 px-3 py-2 rounded-xl text-xs font-black transition-all disabled:opacity-60 ${
                            isSent ? 'bg-emerald-500/20 text-emerald-300 border-2 border-emerald-400/40' :
                            hasDuplicate ? 'btn-candy-green py-2 px-3' :
                            'border-2 border-violet-500/30 text-violet-300 bg-black/20'
                          }`}>
                          {isSent ? '✅ Sent!' : isLoading ? '...' : hasDuplicate ? '🎁 Request Gift' : '🙏 Ask'}
                        </motion.button>
                      </div>
                    )
                  })}
                </div>
              )}
              <motion.button whileTap={{y:3}} onClick={() => { setRequestCardName(null); setRequestSentId(null); setFriendsWithDuplicate([]) }}
                className="mt-3 w-full py-3 rounded-2xl border-2 border-violet-500/30 text-violet-400 text-sm font-black bg-black/20">
                Cancel
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div className="sticky top-0 z-40 px-4 py-2.5" style={{background:'linear-gradient(180deg,rgba(13,8,36,0.97),rgba(13,8,36,0.92))',borderBottom:'2px solid rgba(139,92,246,0.3)',backdropFilter:'blur(12px)'}}>
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <motion.span animate={{ rotate: [0, -12, 12, 0] }} transition={{ duration: 3, repeat: Infinity }} className="text-2xl">🧘</motion.span>
            <span className="font-black text-base" style={{
              background:'linear-gradient(135deg,#c4b5fd,#f472b6,#fbbf24)',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text'
            }}>YogaQuest</span>
            {incoming.length > 0 && (
              <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
                className="w-5 h-5 rounded-full text-white text-[9px] flex items-center justify-center font-black"
                style={{background:'linear-gradient(135deg,#f472b6,#ec4899)',boxShadow:'0 2px 8px rgba(236,72,153,0.6)'}}>
                {incoming.length}
              </motion.span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <motion.div whileTap={{scale:0.9}} className="badge-coin text-xs">
              <span>🪙</span><span>{user.points}</span>
            </motion.div>
            <motion.div whileTap={{scale:0.9}} className="badge-heart text-xs">
              <span>❤️</span><span>{user.yogaDays}d</span>
            </motion.div>
            <motion.button whileTap={{y:2}} onClick={handleLogout} className="text-violet-400/40 text-[10px] ml-0.5 font-black hover:text-violet-300 transition-colors">Exit</motion.button>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className={`max-w-lg mx-auto pt-4 ${tab === 'map' ? 'px-0' : 'px-4'}`}>
        <AnimatePresence mode="wait">

          {/* HOME */}
          {tab === 'home' && (
            <motion.div key="home" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
              {/* Greeting card */}
              <div className="candy-card p-4 flex items-center gap-3">
                <motion.div
                  animate={{ boxShadow: [`0 0 0px ${avatarColor(user.name)}44`, `0 0 18px ${avatarColor(user.name)}88`, `0 0 0px ${avatarColor(user.name)}44`] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                  className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-black text-white shrink-0"
                  style={{ background: avatarColor(user.name) }}>
                  {user.name[0]}
                </motion.div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-black text-base">Hey, {user.name.split(' ')[0]}! 👋</p>
                  <p className="text-violet-400/60 text-xs font-semibold">@{user.username} · Level {user.currentLevel}</p>
                </div>
                {unscratchedCards.length > 0 && (
                  <motion.div animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 1.3, repeat: Infinity }}
                    className="shrink-0 rounded-full px-3 py-1.5 text-xs font-black text-white cursor-pointer"
                    style={{background:'linear-gradient(135deg,#a78bfa,#7c3aed)',boxShadow:'0 4px 0 #3b0764, 0 6px 14px rgba(109,40,217,0.5)'}}
                    onClick={() => setTab('scratch')}>
                    {unscratchedCards.length} 🃏
                  </motion.div>
                )}
              </div>

              {/* CC-style Chapter / Episode card */}
              <motion.div whileTap={{ y: 3 }} onClick={() => setTab('map')}
                className="rounded-3xl p-4 cursor-pointer relative overflow-hidden"
                style={{background:'linear-gradient(135deg,#1e0a5e 0%,#3b1298 40%,#2d1b69 100%)',border:'2px solid rgba(167,139,250,0.5)',boxShadow:'0 6px 0 #1a0845, 0 8px 24px rgba(109,40,217,0.4)'}}>
                {/* Background sparkles */}
                {['12%,20%','80%,15%','70%,75%','20%,70%'].map((pos, i) => (
                  <span key={i} className="absolute text-yellow-200 candy-sparkle pointer-events-none" style={{left:pos.split(',')[0],top:pos.split(',')[1],fontSize:'10px',opacity:0.4,animationDelay:`${i*0.4}s`}}>✦</span>
                ))}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-violet-300/60 text-[10px] font-black uppercase tracking-widest">
                      {levelData.currentLevel <= 5 ? 'Chapter 1' : 'Chapter 2'}
                    </p>
                    <p className="text-white font-black text-base">
                      {levelData.currentLevel <= 5 ? '🌱 The Foundation' : '🏔️ The Ascent'}
                    </p>
                    <p className="text-violet-300/50 text-xs font-semibold mt-0.5">
                      {levelData.levelConfig.isBonusLevel ? '⭐ BONUS LEVEL!' : `Level ${levelData.currentLevel} of 10`}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex gap-1">
                      {[1,2,3].map(s => {
                        const thresh = s === 1 ? 1 : s === 2 ? 3 : 5
                        const lit = levelData.completedLevels.filter(l => l <= (levelData.currentLevel <= 5 ? 5 : 10) && l >= (levelData.currentLevel <= 5 ? 1 : 6)).length >= thresh
                        return (
                          <motion.span key={s} animate={lit ? { scale:[1,1.2,1] } : {}} transition={{duration:1.5,repeat:Infinity,delay:s*0.2}}
                            className="text-xl" style={{filter:lit?'drop-shadow(0 0 6px #fbbf24)':'none',opacity:lit?1:0.2}}>⭐</motion.span>
                        )
                      })}
                    </div>
                    <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.2, repeat: Infinity }} className="text-violet-300/60 text-sm">🗺️→</motion.span>
                  </div>
                </div>
                <div className="mt-3 h-2.5 bg-black/40 rounded-full overflow-hidden border border-violet-500/20">
                  <motion.div className="h-full rounded-full" style={{background:'linear-gradient(90deg,#c4b5fd,#a78bfa,#7c3aed)'}}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((levelData.uniqueCollected / levelData.uniqueNeeded) * 100, 100)}%` }}
                    transition={{ duration: 1.4 }} />
                </div>
                <div className="flex justify-between mt-1.5">
                  <p className="text-violet-400/50 text-[10px] font-semibold">{levelData.uniqueCollected}/{levelData.uniqueNeeded} cards</p>
                  <p className="text-violet-400/50 text-[10px] font-semibold">{Math.round((levelData.uniqueCollected/levelData.uniqueNeeded)*100)}%</p>
                </div>
              </motion.div>

              {/* Scratch banner */}
              {unscratchedCards.length > 0 && (
                <motion.div initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  whileTap={{ y: 3 }}
                  className="rounded-3xl p-4 cursor-pointer"
                  style={{background:'linear-gradient(135deg,#2d1b00 0%,#4a2e00 50%,#3d2400 100%)',border:'2px solid rgba(251,191,36,0.5)',boxShadow:'0 6px 0 #92400e, 0 8px 24px rgba(245,158,11,0.4)'}}
                  onClick={() => setTab('scratch')}>
                  <div className="flex items-center gap-4">
                    <motion.div animate={{ rotate: [-8, 8, -8], scale: [1, 1.12, 1] }} transition={{ duration: 1.8, repeat: Infinity }} className="text-4xl">🃏</motion.div>
                    <div className="flex-1">
                      <p className="text-amber-200 font-black text-base">{unscratchedCards.length} scratch card{unscratchedCards.length > 1 ? 's' : ''} waiting!</p>
                      <p className="text-amber-300/60 text-xs font-semibold">Tap to reveal yoga poses ✨</p>
                    </div>
                    <motion.span animate={{ x: [0, 5, 0] }} transition={{ duration: 1.2, repeat: Infinity }} className="text-amber-400 text-xl">→</motion.span>
                  </div>
                </motion.div>
              )}

              {/* Friends row */}
              <div className="candy-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-violet-400 text-xs font-black uppercase tracking-wider">👥 Friends</p>
                  <motion.button whileTap={{ y: 3, boxShadow: '0 1px 0 #3b0764' }} onClick={() => setShowAddFriend(true)}
                    className="btn-candy-violet text-[10px] px-2.5 py-1 flex items-center gap-1">
                    ➕ Add {incoming.length > 0 && <span className="bg-white/20 rounded-full px-1.5 text-[9px] font-black">{incoming.length}</span>}
                  </motion.button>
                </div>
                {friends.length === 0 ? (
                  <p className="text-violet-400/40 text-xs text-center py-3 font-semibold">No friends yet — add some to see them on the map!</p>
                ) : (
                  <div className="flex gap-4 overflow-x-auto pb-1">
                    {friends.map(f => (
                      <div key={f.id} className="flex flex-col items-center gap-1.5 shrink-0">
                        <div className="w-11 h-11 rounded-full border-2 border-[#0d0824] flex items-center justify-center text-sm font-black text-white"
                          style={{ background: avatarColor(f.name), boxShadow:`0 0 12px ${avatarColor(f.name)}66` }}>{f.name[0]}</div>
                        <p className="text-white/70 text-[10px] font-black">{f.name.split(' ')[0]}</p>
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full" style={{background:'rgba(139,92,246,0.2)',color:'#a78bfa',border:'1px solid rgba(139,92,246,0.3)'}}>L{f.currentLevel}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <ReferralShare referralToken={user.referralToken} referralCount={user.referralCount} totalReferrals={user.totalReferrals} userName={user.name} />

              {duplicateCards.length > 0 && (
                <div className="rounded-3xl p-4" style={{background:'linear-gradient(135deg,#2d1b00 0%,#1a1000 100%)',border:'2px solid rgba(251,191,36,0.4)',boxShadow:'0 4px 20px rgba(245,158,11,0.2)'}}>
                  <p className="text-amber-300 font-black text-sm mb-3">⚡ {duplicateCards.length} Duplicate{duplicateCards.length > 1 ? 's' : ''} — Gift to Friends!</p>
                  <div className="space-y-2">
                    {duplicateCards.slice(0, 3).map(card => (
                      <div key={card.id} className="flex items-center gap-3 rounded-2xl p-3"
                        style={{background:'rgba(0,0,0,0.3)',border:'1.5px solid rgba(251,191,36,0.2)'}}>
                        <motion.span animate={{ rotate: [0, 8, -8, 0] }} transition={{ duration: 2, repeat: Infinity }} className="text-2xl">{card.cardTemplate.imageEmoji}</motion.span>
                        <span className="text-white/80 text-sm flex-1 font-semibold">{card.cardTemplate.name}</span>
                        <motion.button whileTap={{y:4,boxShadow:'0 1px 0 #92400e'}} onClick={() => setGiftCard(card)}
                          className="btn-candy-gold px-3 py-1.5 text-xs">
                          🎁 Gift
                        </motion.button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <FaqSection showFaq={showFaq} onToggle={() => setShowFaq(v => !v)} />
            </motion.div>
          )}

          {/* SCRATCH */}
          {tab === 'scratch' && (
            <motion.div key="scratch" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <ScratchTab cards={unscratchedCards} onDone={loadData} />
            </motion.div>
          )}

          {/* COLLECTION */}
          {tab === 'collection' && (
            <motion.div key="collection" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
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
                  setRequestCardName(cardName); setRequestCardEmoji(cardEmoji)
                }}
              />
              {scratchedCards.filter(c => c.cardTemplate.level !== levelData.currentLevel).length > 0 && (
                <div className="mt-6 space-y-3">
                  <p className="text-violet-400/40 text-xs uppercase tracking-wide font-black">All collected cards</p>
                  <CollectionTab cards={scratchedCards} onGift={setGiftCard} />
                </div>
              )}
            </motion.div>
          )}

          {/* MAP */}
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
            <motion.div key="notifications" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="space-y-3 pb-4">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-white font-black text-base" style={{textShadow:'0 0 10px rgba(167,139,250,0.4)'}}>🔔 Notifications</h2>
                {notifications.length > 0 && <span className="text-violet-400/50 text-xs font-semibold">{notifications.length} total</span>}
              </div>
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="text-5xl mb-4 candy-float">🔔</div>
                  <p className="text-white font-black mb-1">All caught up!</p>
                  <p className="text-violet-400/50 text-sm font-semibold">Level ups, friend activity and gifts will appear here.</p>
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

                  const typeStyles: Record<string, { border: string; bg: string; iconBg: string; icon: string }> = {
                    LEVEL_UP:        { border:'rgba(251,191,36,0.4)',  bg:'rgba(251,191,36,0.08)',  iconBg:'rgba(251,191,36,0.15)',  icon:'🏆' },
                    FRIEND_ACCEPTED: { border:'rgba(52,211,153,0.4)',  bg:'rgba(52,211,153,0.08)',  iconBg:'rgba(52,211,153,0.15)',  icon:'🤝' },
                    FRIEND_REJECTED: { border:'rgba(239,68,68,0.3)',   bg:'rgba(239,68,68,0.06)',   iconBg:'rgba(239,68,68,0.12)',   icon:'❌' },
                    CARD_REQUEST:    { border:'rgba(139,92,246,0.4)',  bg:'rgba(139,92,246,0.08)',  iconBg:'rgba(139,92,246,0.15)',  icon:'🙏' },
                  }
                  const ts = typeStyles[n.type] ?? { border:'rgba(139,92,246,0.25)', bg:'rgba(0,0,0,0.2)', iconBg:'rgba(139,92,246,0.1)', icon:'🎁' }

                  return (
                    <motion.div key={n.id}
                      initial={{ opacity: 0, x: -12, scale: 0.97 }} animate={{ opacity: 1, x: 0, scale: 1 }}
                      className="rounded-2xl p-4 transition-all"
                      style={{background:ts.bg,border:`2px solid ${ts.border}`}}>
                      <div className="flex gap-3 items-start">
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0"
                          style={{background:ts.iconBg}}>
                          {ts.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-black leading-tight ${n.read ? 'text-white/60' : 'text-white'}`}>{n.title}</p>
                          <p className="text-violet-300/50 text-xs mt-0.5 leading-relaxed font-semibold">{displayBody}</p>
                          <p className="text-violet-400/40 text-[10px] mt-1.5 font-semibold">{timeAgo(n.createdAt)}</p>
                          {canGift && (
                            <motion.button whileTap={{y:alreadyGifted?0:4,boxShadow:alreadyGifted?'none':'0 1px 0 #3b0764'}}
                              disabled={!!giftingNotifId || alreadyGifted}
                              onClick={() => handleGiftFromNotif(n.id, action.duplicateCardId ?? null, action.requesterUsername, action.cardName)}
                              className={`mt-2.5 w-full py-2.5 rounded-xl text-xs font-black transition-all ${
                                alreadyGifted
                                  ? 'bg-emerald-500/20 text-emerald-300 border-2 border-emerald-400/30'
                                  : 'btn-candy-violet py-2.5'
                              }`}>
                              {alreadyGifted ? '✅ Gifted!' : giftingNotifId === n.id ? '✨ Gifting…' : `🎁 Gift ${action.cardName} to ${action.requesterName}`}
                            </motion.button>
                          )}
                        </div>
                        {!n.read && (
                          <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                            className="w-2.5 h-2.5 rounded-full shrink-0 mt-1"
                            style={{background:'linear-gradient(135deg,#a78bfa,#7c3aed)',boxShadow:'0 0 8px rgba(139,92,246,0.6)'}} />
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
      <div className="fixed bottom-3 left-0 right-0 z-40 px-4">
        <div className="max-w-sm mx-auto backdrop-blur-xl rounded-[28px] px-1.5 py-1.5 flex gap-0.5"
          style={{background:'linear-gradient(135deg,rgba(22,8,60,0.97),rgba(13,8,36,0.99))',border:'2px solid rgba(139,92,246,0.4)',boxShadow:'0 8px 0 rgba(0,0,0,0.5), 0 12px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)'}}>
          {([
            { key: 'home' as const,         emoji: '🏠', label: 'Home',     badge: 0,                    onClick: () => setTab('home') },
            { key: 'scratch' as const,       emoji: '🃏', label: 'Scratch',  badge: unscratchedCards.length, onClick: () => setTab('scratch') },
            { key: 'collection' as const,    emoji: '📚', label: 'Cards',    badge: 0,                    onClick: () => setTab('collection') },
            { key: 'map' as const,           emoji: '🗺️', label: 'Map',      badge: incoming.length,      onClick: () => setTab('map') },
            { key: 'notifications' as const, emoji: '🔔', label: 'Alerts',   badge: unreadCount,          onClick: openNotifications },
          ]).map(item => (
            <motion.button key={item.key} onClick={item.onClick}
              whileTap={{ scale: 0.85, y: 2 }}
              className="flex-1 py-2 flex flex-col items-center gap-0.5 relative rounded-[22px] transition-all duration-150"
              style={tab === item.key ? {
                background:'linear-gradient(180deg,#c4b5fd 0%,#8b5cf6 30%,#7c3aed 100%)',
                boxShadow:'0 5px 0 #3b0764, 0 7px 16px rgba(109,40,217,0.55)',
                border:'1.5px solid #ddd6fe',
              } : {border:'1.5px solid transparent'}}>
              <motion.span className="text-xl leading-none"
                animate={tab === item.key ? { y: [0, -3, 0], scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 1.4, repeat: Infinity }}>
                {item.emoji}
              </motion.span>
              <span className={`text-[8px] font-black tracking-wide ${tab === item.key ? 'text-white' : 'text-violet-400/40'}`}>{item.label}</span>
              {item.badge > 0 && (
                <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1, repeat: Infinity }}
                  className="absolute -top-1 right-0.5 w-4 h-4 rounded-full text-white text-[9px] flex items-center justify-center font-black border-2 border-[#0d0824]"
                  style={{background:'linear-gradient(135deg,#f472b6,#ec4899)',boxShadow:'0 2px 8px rgba(236,72,153,0.6)'}}>
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
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const FlipCard = require('@/components/FlipCard').default

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <motion.div animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }} transition={{ duration: 2.5, repeat: Infinity }} className="text-7xl mb-5">🎴</motion.div>
        <p className="text-white font-black text-xl mb-2">No cards to scratch</p>
        <p className="text-violet-400/50 text-sm font-semibold">Share your referral link to earn more cards!</p>
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
    <div className="flex flex-col items-center py-6 space-y-5">
      {/* Progress dots - candy style */}
      <div className="flex gap-2">
        {cards.map((_, i) => (
          <motion.div key={i}
            animate={i === currentIndex ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
            className={`h-3 rounded-full transition-all duration-300 ${
              i === currentIndex
                ? 'w-8'
                : i < currentIndex
                ? 'w-3 bg-emerald-400'
                : 'w-3'
            }`}
            style={i === currentIndex ? {
              background:'linear-gradient(90deg,#a78bfa,#7c3aed)',
              boxShadow:'0 0 10px rgba(139,92,246,0.6)'
            } : i < currentIndex ? {} : {background:'rgba(255,255,255,0.1)'}}
          />
        ))}
      </div>
      <p className="text-violet-400/60 text-sm font-black">Card {currentIndex + 1} of {cards.length}</p>

      {current && !scratchResult && (
        <ScratchCard key={current.id} cardId={current.id} emoji={current.cardTemplate.imageEmoji}
          name={current.cardTemplate.name} rarity={current.cardTemplate.rarity}
          isDuplicate={current.isDuplicate} onScratched={handleScratched} />
      )}

      <AnimatePresence>
        {scratchResult && !showReward && (
          <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', bounce: 0.45, duration: 0.6 }}
            className="text-center space-y-4 w-full max-w-[260px]">
            {/* Cinematic FlipCard revealed */}
            <div className="w-full">
              <FlipCard
                name={scratchResult.card.cardTemplate.name}
                emoji={scratchResult.card.cardTemplate.imageEmoji}
                rarity={scratchResult.card.cardTemplate.rarity as 'COMMON'|'RARE'|'EPIC'}
                collected={true}
                source="REFERRAL"
              />
            </div>
            {/* Progress */}
            <p className="text-violet-400/60 text-xs font-semibold">
              {scratchResult.uniqueCollected}/{scratchResult.uniqueNeeded} unique cards this level
            </p>
            <motion.button whileTap={{y:5,boxShadow:'0 1px 0 #3b0764'}} onClick={nextCard}
              className="btn-candy-violet w-full py-4 text-sm">
              {currentIndex < cards.length - 1 ? 'Next Card →' : '✅ Done!'}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Level up modal */}
      <AnimatePresence>
        {showReward && scratchResult?.rewards && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', bounce: 0.55, duration: 0.7 }}
              className={`rounded-3xl p-7 max-w-sm w-full text-center ${
                scratchResult.rewards.isBonusLevel
                  ? ''
                  : 'candy-card'
              }`}
              style={scratchResult.rewards.isBonusLevel ? {
                background:'linear-gradient(135deg,#fef08a 0%,#fbbf24 40%,#d97706 100%)',
                border:'3px solid #fef9c3',
                boxShadow:'0 8px 0 #92400e, 0 12px 40px rgba(245,158,11,0.6)'
              } : {}}>
              <motion.div animate={{ rotate: [0, -15, 15, 0], scale: [1, 1.35, 1] }}
                transition={{ duration: 1.5, repeat: 2 }} className="text-7xl mb-3">
                {scratchResult.rewards.isBonusLevel ? '🏆' : '🎉'}
              </motion.div>
              <h2 className={`text-2xl font-black mb-1 ${scratchResult.rewards.isBonusLevel ? 'text-amber-900' : 'text-white'}`}
                style={scratchResult.rewards.isBonusLevel ? {textShadow:'0 2px 4px rgba(255,255,255,0.3)'} : {textShadow:'0 0 12px rgba(167,139,250,0.5)'}}>
                {scratchResult.rewards.isBonusLevel ? 'BONUS LEVEL!' : 'Level Up!'}
              </h2>
              <p className={`text-sm mb-5 font-black ${scratchResult.rewards.isBonusLevel ? 'text-amber-800' : 'text-violet-300/70'}`}>
                You completed Level {scratchResult.rewards.nextLevel - 1}! 🎊
              </p>
              <div className="space-y-2.5 mb-5">
                <div className={`rounded-2xl p-3 flex items-center gap-3 ${
                  scratchResult.rewards.isBonusLevel ? 'bg-black/15' : ''
                }`} style={scratchResult.rewards.isBonusLevel ? {} : {background:'rgba(251,191,36,0.12)',border:'2px solid rgba(251,191,36,0.3)'}}>
                  <span className="text-2xl">✨</span>
                  <span className={`font-black ${scratchResult.rewards.isBonusLevel ? 'text-amber-900' : 'text-white'}`}>+{scratchResult.rewards.points} Points</span>
                  <span className={`text-xs ml-auto ${scratchResult.rewards.isBonusLevel ? 'text-amber-700' : 'text-violet-400/60'}`}>≈ ₹{(scratchResult.rewards.points / 10).toFixed(0)}</span>
                </div>
                <div className={`rounded-2xl p-3 flex items-center gap-3 ${
                  scratchResult.rewards.isBonusLevel ? 'bg-black/15' : ''
                }`} style={scratchResult.rewards.isBonusLevel ? {} : {background:'rgba(52,211,153,0.12)',border:'2px solid rgba(52,211,153,0.3)'}}>
                  <span className="text-2xl">💚</span>
                  <span className={`font-black ${scratchResult.rewards.isBonusLevel ? 'text-amber-900' : 'text-white'}`}>+{scratchResult.rewards.yogaDays} Yoga Days</span>
                  <span className={`text-xs ml-auto ${scratchResult.rewards.isBonusLevel ? 'text-amber-700' : 'text-emerald-400/60'}`}>FREE access</span>
                </div>
              </div>
              <motion.button whileTap={{y:scratchResult.rewards.isBonusLevel?4:5,boxShadow:scratchResult.rewards.isBonusLevel?'0 1px 0 #92400e':'0 1px 0 #3b0764'}}
                onClick={nextCard}
                className={`w-full py-4 rounded-2xl font-black text-base ${
                  scratchResult.rewards.isBonusLevel
                    ? 'btn-candy-gold'
                    : 'btn-candy-violet'
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
        <div className="text-5xl mb-3 candy-float">📚</div>
        <p className="text-violet-400/50 text-sm font-semibold">Scratch cards to build your collection</p>
      </div>
    )
  }

  const grouped = new Map<string, { representative: CardData; count: number; duplicates: CardData[] }>()
  for (const card of cards) {
    const key = card.cardTemplate.name
    if (!grouped.has(key)) grouped.set(key, { representative: card, count: 1, duplicates: [] })
    else { const g = grouped.get(key)!; g.count++; if (card.isDuplicate) g.duplicates.push(card) }
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from(grouped.values()).map(({ representative: card, count, duplicates }) => (
        <div key={card.id} className="space-y-1.5">
          <div className="relative">
            <FlipCard name={card.cardTemplate.name} emoji={card.cardTemplate.imageEmoji}
              rarity={card.cardTemplate.rarity} collected={true} source={card.source} />
            {count > 1 && (
              <div className="absolute top-2 left-2 rounded-full px-2 py-0.5 shadow-lg"
                style={{background:'rgba(13,8,36,0.85)',border:'1.5px solid rgba(167,139,250,0.4)'}}>
                <span className="text-violet-300 text-[10px] font-black">×{count}</span>
              </div>
            )}
          </div>
          {duplicates.length > 0 && (
            <motion.button whileTap={{y:4,boxShadow:'0 1px 0 #92400e'}} onClick={() => onGift(duplicates[0])}
              className="btn-candy-gold w-full py-1.5 text-xs">
              🎁 Gift ({duplicates.length} extra)
            </motion.button>
          )}
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  { q: '🃏 How do I earn scratch cards?', a: 'Share your referral link. Every time someone fills in their name and phone on your link, you get a scratch card. You also get a free welcome card when you sign up!' },
  { q: '🎯 How do levels work?', a: 'Each level needs a certain number of unique yoga pose cards. Level 1 needs 2, Level 2 needs 3, and so on. Scratch your cards to collect new poses and advance!' },
  { q: '⭐ What are Bonus Levels?', a: 'Levels 5 and 10 are Bonus Levels. Complete them to earn 1000 points and extra yoga days — much bigger rewards than regular levels!' },
  { q: '🎁 How do I gift a duplicate card?', a: 'If you scratch a card you already have, it becomes a duplicate. Tap "Gift" on any duplicate and pick a friend from your friends list to send it to them.' },
  { q: '🙏 How do I request a card from a friend?', a: "On the Cards tab, uncollected slots show an \"Ask Friend\" button. Tap it to send a request. They'll see it in Activity and can gift you a duplicate if they have one." },
  { q: '🗺️ What is the Journey Map?', a: 'The Map tab shows a Candy Crush-style path of all 10 levels. See where your friends are and add new friends from there.' },
  { q: '✨ What are Points and Yoga Days?', a: 'Points are your score — earned by completing levels. Yoga Days are free class credits earned as rewards. They stack up as you progress.' },
]

function FaqSection({ showFaq, onToggle }: { showFaq: boolean; onToggle: () => void }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="candy-card overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-4 py-3.5 text-left">
        <div className="flex items-center gap-2">
          <span className="text-lg">📖</span>
          <span className="text-white font-black text-sm">How it Works — FAQ</span>
        </div>
        <motion.span animate={{ rotate: showFaq ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-violet-400/50 text-sm">▼</motion.span>
      </button>

      <AnimatePresence>
        {showFaq && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }} className="overflow-hidden">
            <div style={{borderTop:'1px solid rgba(139,92,246,0.2)'}}>
              {FAQ_ITEMS.map((item, i) => (
                <div key={i} style={{borderBottom:'1px solid rgba(139,92,246,0.1)'}}>
                  <button onClick={() => setOpenIndex(openIndex === i ? null : i)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left gap-3">
                    <span className="text-violet-200 text-xs font-black flex-1">{item.q}</span>
                    <motion.span animate={{ rotate: openIndex === i ? 180 : 0 }} transition={{ duration: 0.15 }} className="text-violet-400/50 text-xs shrink-0">▼</motion.span>
                  </button>
                  <AnimatePresence>
                    {openIndex === i && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }} className="overflow-hidden">
                        <p className="px-4 pb-3 text-violet-300/60 text-xs leading-relaxed font-semibold">{item.a}</p>
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
      <div className="min-h-screen bg-[#0d0824] flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="text-4xl">🧘</motion.div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
