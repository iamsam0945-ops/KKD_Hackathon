'use client'
import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

export default function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ name: '', phone: '', username: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function next(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.phone.trim()) return
    setError(''); setStep(2)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.username.trim()) return
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ ...form, referralToken: token }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Registration failed'); setLoading(false); return }
      router.push('/dashboard?welcome=1')
    } catch { setError('Something went wrong. Please try again.'); setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-[#0d0824] flex flex-col items-center justify-center px-5">
      <motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{duration:0.4}} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <motion.div animate={{rotate:[-15,15,-15],scale:[1,1.1,1]}} transition={{duration:2,repeat:Infinity}} className="text-6xl mb-4 inline-block">🃏</motion.div>
          <h1 className="text-3xl font-black" style={{
            background:'linear-gradient(135deg,#c4b5fd,#f472b6,#fbbf24)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text'
          }}>You&apos;re Invited!</h1>
          <p className="text-violet-300/70 text-sm mt-1 font-semibold">Sign up & get a FREE scratch card</p>
        </div>

        {/* Gift banner */}
        <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} transition={{delay:0.2,type:'spring'}}
          className="candy-card p-4 mb-5 flex items-center gap-3">
          <span className="text-3xl candy-sparkle">🎁</span>
          <p className="text-violet-200 text-sm font-bold">Your friend earns a card when you join — and so do you!</p>
        </motion.div>

        {/* Step dots */}
        <div className="flex items-center gap-2 justify-center mb-5">
          {[1,2].map(s => (
            <motion.div key={s} animate={{background:step>=s?'linear-gradient(135deg,#a78bfa,#7c3aed)':'rgba(255,255,255,0.1)', width:step===s?48:20}}
              className="h-3 rounded-full" transition={{duration:0.3}} />
          ))}
        </div>

        <div className="candy-card p-6">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.form key="s1" initial={{opacity:0,x:-28}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-28}}
                transition={{type:'spring',stiffness:300,damping:28}} onSubmit={next} className="space-y-4">
                <p className="text-violet-400/60 text-xs text-center font-bold uppercase tracking-wider">Step 1 of 2</p>
                {[
                  {key:'name', label:'👤 Your Name', placeholder:'Priya Kapoor', type:'text'},
                  {key:'phone', label:'📱 Phone Number', placeholder:'9876543210', type:'tel'},
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-violet-300 text-xs font-black uppercase tracking-wider mb-2 block">{f.label}</label>
                    <input type={f.type} placeholder={f.placeholder} value={form[f.key as keyof typeof form]}
                      onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} required
                      className="w-full bg-black/30 border-2 border-violet-500/40 rounded-2xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-violet-400 text-sm font-semibold transition-all" />
                  </div>
                ))}
                <motion.button whileTap={{y:5,boxShadow:'0 1px 0 #3b0764'}} type="submit"
                  className="btn-candy-violet w-full py-4 text-base mt-2">Continue →</motion.button>
              </motion.form>
            ) : (
              <motion.form key="s2" initial={{opacity:0,x:28}} animate={{opacity:1,x:0}} exit={{opacity:0,x:28}}
                transition={{type:'spring',stiffness:300,damping:28}} onSubmit={handleSubmit} className="space-y-4">
                <p className="text-violet-400/60 text-xs text-center font-bold uppercase tracking-wider">Step 2 of 2</p>
                <div>
                  <label className="text-violet-300 text-xs font-black uppercase tracking-wider mb-2 block">🎮 Username</label>
                  <input type="text" placeholder="priya_yoga" value={form.username}
                    onChange={e=>setForm(f=>({...f,username:e.target.value}))} autoComplete="off" required
                    className="w-full bg-black/30 border-2 border-violet-500/40 rounded-2xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-violet-400 text-sm font-semibold transition-all" />
                </div>
                {error && <motion.p initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} className="text-red-400 text-xs text-center bg-red-500/10 border border-red-500/30 rounded-xl py-2 px-3 font-semibold">{error}</motion.p>}
                <div className="flex gap-3">
                  <motion.button whileTap={{y:4}} type="button" onClick={()=>{setStep(1);setError('')}}
                    className="px-5 py-3.5 rounded-2xl border-2 border-violet-500/40 text-violet-300 text-sm font-black bg-black/20">← Back</motion.button>
                  <motion.button whileTap={{y:5,boxShadow:'0 1px 0 #047857'}} type="submit" disabled={loading}
                    className="btn-candy-green flex-1 py-3.5 text-base disabled:opacity-50">
                    {loading ? 'Joining…' : '🎉 Join & Play!'}
                  </motion.button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-violet-400/40 text-xs mt-6 font-semibold">No spam. Your info stays private.</p>
      </motion.div>
    </div>
  )
}
