'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', phone: '', username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/register', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      router.push('/dashboard?welcome=1')
    } catch { setError('Something went wrong') } finally { setLoading(false) }
  }

  const fields1 = [
    { key:'name', label:'👤 Full Name', placeholder:'Arjun Sharma', type:'text', autoComplete:'name' },
    { key:'phone', label:'📱 Phone Number', placeholder:'9876543210', type:'tel', autoComplete:'off' },
  ]
  const fields2 = [
    { key:'username', label:'🎮 Username', placeholder:'arjun_yoga', type:'text', autoComplete:'off' },
    { key:'password', label:'🔐 Password', placeholder:'••••••••', type:'password', autoComplete:'new-password' },
  ]

  return (
    <div className="min-h-screen bg-[#0d0824] flex flex-col items-center justify-center px-5">
      <motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{duration:0.4}} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <motion.div className="text-6xl mb-4 candy-float inline-block">🎁</motion.div>
          <h1 className="text-3xl font-black text-white" style={{textShadow:'0 0 16px rgba(167,139,250,0.7)'}}>Join YogaQuest!</h1>
          <p className="text-violet-300 text-sm mt-1 font-semibold">Get your first scratch card FREE</p>
        </div>

        {/* Step indicator - candy style */}
        <div className="flex items-center gap-2 justify-center mb-6">
          {[1,2].map(s => (
            <motion.div key={s} animate={{
              background: step >= s ? 'linear-gradient(135deg,#a78bfa,#7c3aed)' : 'rgba(255,255,255,0.1)',
              width: step === s ? 48 : 20,
            }} className="h-3 rounded-full" transition={{duration:0.3}} />
          ))}
        </div>

        <div className="candy-card p-6">
          <form onSubmit={step===2?handleSubmit:e=>{e.preventDefault();setStep(2)}} className="space-y-4">
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{opacity:0,x:step===2?28:-28}} animate={{opacity:1,x:0}} exit={{opacity:0,x:step===2?-28:28}}
                transition={{type:'spring',stiffness:300,damping:28}} className="space-y-4">
                {(step===1?fields1:fields2).map(field => (
                  <div key={field.key}>
                    <label className="text-violet-300 text-xs font-black uppercase tracking-wider mb-2 block">{field.label}</label>
                    <div className="relative">
                      <input
                        type={field.key==='password'?(showPassword?'text':'password'):field.type}
                        placeholder={field.placeholder}
                        value={form[field.key as keyof typeof form]}
                        onChange={e=>setForm(f=>({...f,[field.key]:e.target.value}))}
                        autoComplete={field.autoComplete} required
                        className={`w-full bg-black/30 border-2 border-violet-500/40 rounded-2xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-violet-400 transition-all text-sm font-semibold ${field.key==='password'?'pr-11':''}`}
                      />
                      {field.key==='password' && (
                        <button type="button" onClick={()=>setShowPassword(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-violet-300 hover:text-white transition-colors text-sm">{showPassword?'🙈':'👁️'}</button>
                      )}
                    </div>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>

            {error && <motion.p initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} className="text-red-400 text-xs text-center bg-red-500/10 border border-red-500/30 rounded-xl py-2 px-3 font-semibold">{error}</motion.p>}

            <div className="flex gap-3 pt-1">
              {step===2 && (
                <motion.button whileTap={{y:4}} type="button" onClick={()=>setStep(1)}
                  className="px-5 py-3.5 rounded-2xl border-2 border-violet-500/40 text-violet-300 text-sm font-black hover:border-violet-400 transition-colors bg-black/20">
                  ← Back
                </motion.button>
              )}
              <motion.button whileTap={{y:5,boxShadow:step===2?'0 1px 0 #047857':'0 1px 0 #3b0764'}} type="submit" disabled={loading}
                className={`flex-1 py-3.5 text-base disabled:opacity-50 ${step===1?'btn-candy-violet':'btn-candy-green'}`}>
                {loading?'Creating…':step===1?'Continue →':'🎉 Start Quest!'}
              </motion.button>
            </div>
          </form>
        </div>

        <p className="text-center text-violet-400/60 text-xs mt-6 font-semibold">
          Already playing?{' '}<Link href="/login" className="text-amber-400 hover:text-amber-300 font-black">Sign in →</Link>
        </p>
      </motion.div>
    </div>
  )
}
