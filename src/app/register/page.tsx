'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', phone: '', username: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/register', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      router.push('/dashboard?welcome=1')
    } catch { setError('Something went wrong') } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-[#fdf8ff] flex flex-col items-center justify-center px-5">
      {/* Soft blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="candy-blob absolute w-64 h-64" style={{background:'rgba(167,139,250,0.18)',top:'-40px',left:'-40px',borderRadius:'60% 40% 30% 70% / 60% 30% 70% 40%'}}/>
        <div className="candy-blob absolute w-52 h-52" style={{background:'rgba(251,191,36,0.14)',top:'30%',right:'-40px',borderRadius:'40% 60% 70% 30% / 40% 50% 60% 50%',animationDelay:'1.5s'}}/>
        <div className="candy-blob absolute w-44 h-44" style={{background:'rgba(244,114,182,0.14)',bottom:'8%',left:'-30px',borderRadius:'50% 60% 40% 70%',animationDelay:'3s'}}/>
      </div>

      <motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{duration:0.4}} className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <motion.div className="text-6xl mb-4 candy-float inline-block">🎁</motion.div>
          <h1 className="text-3xl font-black" style={{
            background:'linear-gradient(135deg,#7c3aed,#ec4899,#d97706)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text'
          }}>Join YogaQuest!</h1>
          <p className="text-purple-600/80 text-sm mt-1 font-semibold">Get your first scratch card FREE</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 justify-center mb-6">
          {[1,2].map(s => (
            <motion.div key={s} animate={{
              background: step >= s ? 'linear-gradient(135deg,#a78bfa,#7c3aed)' : 'rgba(167,139,250,0.25)',
              width: step === s ? 48 : 20,
            }} className="h-3 rounded-full" transition={{duration:0.3}} />
          ))}
        </div>

        <div className="candy-card p-6">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.form key="s1" initial={{opacity:0,x:-28}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-28}}
                transition={{type:'spring',stiffness:300,damping:28}}
                onSubmit={e=>{e.preventDefault();setStep(2)}} className="space-y-4">
                <p className="text-violet-200/70 text-xs text-center font-bold uppercase tracking-wider">Step 1 of 2</p>
                {[
                  {key:'name', label:'👤 Full Name', placeholder:'Arjun Sharma', type:'text'},
                  {key:'phone', label:'📱 Phone Number', placeholder:'9876543210', type:'tel'},
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-violet-200 text-xs font-black uppercase tracking-wider mb-2 block">{f.label}</label>
                    <input type={f.type} placeholder={f.placeholder} value={form[f.key as keyof typeof form]}
                      onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} required
                      className="pastel-input" />
                  </div>
                ))}
                <motion.button whileTap={{y:4,boxShadow:'0 1px 0 #4c1d95'}} type="submit"
                  className="btn-candy-violet w-full py-4 text-base mt-2">Continue →</motion.button>
              </motion.form>
            ) : (
              <motion.form key="s2" initial={{opacity:0,x:28}} animate={{opacity:1,x:0}} exit={{opacity:0,x:28}}
                transition={{type:'spring',stiffness:300,damping:28}}
                onSubmit={handleSubmit} className="space-y-4">
                <p className="text-violet-200/70 text-xs text-center font-bold uppercase tracking-wider">Step 2 of 2</p>
                <div>
                  <label className="text-violet-200 text-xs font-black uppercase tracking-wider mb-2 block">🎮 Username</label>
                  <input type="text" placeholder="arjun_yoga" value={form.username}
                    onChange={e=>setForm(f=>({...f,username:e.target.value}))} autoComplete="off" required
                    className="pastel-input" />
                </div>
                {error && <motion.p initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} className="text-red-300 text-xs text-center bg-red-500/20 border border-red-400/30 rounded-xl py-2 px-3 font-semibold">{error}</motion.p>}
                <div className="flex gap-3">
                  <motion.button whileTap={{y:3}} type="button" onClick={()=>{setStep(1);setError('')}}
                    className="px-5 py-3.5 rounded-2xl border-2 border-violet-300/40 text-violet-100 text-sm font-black bg-white/10">← Back</motion.button>
                  <motion.button whileTap={{y:4,boxShadow:'0 1px 0 #047857'}} type="submit" disabled={loading}
                    className="btn-candy-green flex-1 py-3.5 text-base disabled:opacity-50">
                    {loading ? 'Creating…' : '🎉 Start Quest!'}
                  </motion.button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-purple-500/80 text-xs mt-6 font-semibold">
          Already playing?{' '}<Link href="/login" className="text-amber-600 hover:text-amber-500 font-black">Sign in →</Link>
        </p>
      </motion.div>
    </div>
  )
}
