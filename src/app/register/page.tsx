'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { sanitizePhoneInput } from '@/lib/phone'
import { COUNTRIES } from '@/lib/countries'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', phone: '', countryCode: '+91', username: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const payload = {
        ...form,
        phone: sanitizePhoneInput(form.phone),
      }
      const res = await fetch('/api/auth/register', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      router.push('/dashboard?welcome=1')
    } catch { setError('Something went wrong') } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-[#0d0824] flex flex-col items-center justify-center px-5">
      <motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{duration:0.4}} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <motion.div className="text-6xl mb-4 candy-float inline-block">🎁</motion.div>
          <h1 className="text-3xl font-black" style={{
            background:'linear-gradient(135deg,#c4b5fd,#f472b6,#fbbf24)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text'
          }}>Join YogaQuest!</h1>
          <p className="text-violet-300/70 text-sm mt-1 font-semibold">Get your first scratch card FREE</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 justify-center mb-6">
          {[1,2].map(s => (
            <motion.div key={s} animate={{
              background: step >= s ? 'linear-gradient(135deg,#a78bfa,#7c3aed)' : 'rgba(255,255,255,0.1)',
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
                <p className="text-violet-400/60 text-xs text-center font-bold uppercase tracking-wider">Step 1 of 2</p>
                {[
                  {key:'name', label:'👤 Full Name', placeholder:'Arjun Sharma', type:'text'},
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-violet-300 text-xs font-black uppercase tracking-wider mb-2 block">{f.label}</label>
                    <input type={f.type} placeholder={f.placeholder} value={form[f.key as keyof typeof form]}
                      onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} required
                      className="w-full bg-black/30 border-2 border-violet-500/40 rounded-2xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-violet-400 transition-all text-sm font-semibold" />
                  </div>
                ))}
                <div>
                  <label className="text-violet-300 text-xs font-black uppercase tracking-wider mb-2 block">🌍 Country & Phone Number</label>
                  <div className="grid grid-cols-[130px_1fr] gap-2">
                    <select
                      value={form.countryCode}
                      onChange={e => setForm(p => ({ ...p, countryCode: e.target.value }))}
                      className="w-full bg-black/30 border-2 border-violet-500/40 rounded-2xl px-3 py-3 text-white focus:outline-none focus:border-violet-400 transition-all text-sm font-semibold"
                    >
                      {COUNTRIES.map((country) => (
                        <option key={country.iso2} value={country.dialCode}>
                          {country.flag} {country.name} ({country.dialCode})
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      placeholder="9876543210"
                      value={form.phone}
                      onChange={e => setForm(p => ({ ...p, phone: sanitizePhoneInput(e.target.value) }))}
                      required
                      className="w-full bg-black/30 border-2 border-violet-500/40 rounded-2xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-violet-400 transition-all text-sm font-semibold"
                    />
                  </div>
                </div>
                <motion.button whileTap={{y:5,boxShadow:'0 1px 0 #3b0764'}} type="submit"
                  className="btn-candy-violet w-full py-4 text-base mt-2">Continue →</motion.button>
              </motion.form>
            ) : (
              <motion.form key="s2" initial={{opacity:0,x:28}} animate={{opacity:1,x:0}} exit={{opacity:0,x:28}}
                transition={{type:'spring',stiffness:300,damping:28}}
                onSubmit={handleSubmit} className="space-y-4">
                <p className="text-violet-400/60 text-xs text-center font-bold uppercase tracking-wider">Step 2 of 2</p>
                <div>
                  <label className="text-violet-300 text-xs font-black uppercase tracking-wider mb-2 block">🎮 Username</label>
                  <input type="text" placeholder="arjun_yoga" value={form.username}
                    onChange={e=>setForm(f=>({...f,username:e.target.value}))} autoComplete="off" required
                    className="w-full bg-black/30 border-2 border-violet-500/40 rounded-2xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-violet-400 transition-all text-sm font-semibold" />
                </div>
                {error && <motion.p initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} className="text-red-400 text-xs text-center bg-red-500/10 border border-red-500/30 rounded-xl py-2 px-3 font-semibold">{error}</motion.p>}
                <div className="flex gap-3">
                  <motion.button whileTap={{y:4}} type="button" onClick={()=>{setStep(1);setError('')}}
                    className="px-5 py-3.5 rounded-2xl border-2 border-violet-500/40 text-violet-300 text-sm font-black bg-black/20">← Back</motion.button>
                  <motion.button whileTap={{y:5,boxShadow:'0 1px 0 #047857'}} type="submit" disabled={loading}
                    className="btn-candy-green flex-1 py-3.5 text-base disabled:opacity-50">
                    {loading ? 'Creating…' : '🎉 Start Quest!'}
                  </motion.button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-violet-400/60 text-xs mt-6 font-semibold">
          Already playing?{' '}<Link href="/login" className="text-amber-400 hover:text-amber-300 font-black">Sign in →</Link>
        </p>
      </motion.div>
    </div>
  )
}
