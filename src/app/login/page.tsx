'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { sanitizePhoneInput } from '@/lib/phone'

const COUNTRY_CODES = [
  { label: 'India', code: '+91' },
  { label: 'United States', code: '+1' },
  { label: 'United Kingdom', code: '+44' },
  { label: 'United Arab Emirates', code: '+971' },
  { label: 'Canada', code: '+1' },
  { label: 'Australia', code: '+61' },
  { label: 'Singapore', code: '+65' },
]

export default function LoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [countryCode, setCountryCode] = useState('+91')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ phone: sanitizePhoneInput(phone), countryCode }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      router.push('/dashboard')
    } catch { setError('Something went wrong') } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-[#fdf8ff] flex flex-col items-center justify-center px-5">
      {/* Soft blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="candy-blob absolute w-64 h-64" style={{background:'rgba(167,139,250,0.18)',top:'-50px',right:'-40px',borderRadius:'40% 60% 70% 30% / 40% 50% 60% 50%'}}/>
        <div className="candy-blob absolute w-48 h-48" style={{background:'rgba(244,114,182,0.14)',bottom:'5%',left:'-30px',borderRadius:'60% 40% 30% 70% / 60% 30% 70% 40%',animationDelay:'2s'}}/>
        <div className="candy-blob absolute w-56 h-56" style={{background:'rgba(52,211,153,0.1)',top:'40%',left:'-50px',borderRadius:'50% 60% 40% 70% / 50% 40% 60% 50%',animationDelay:'1s'}}/>
        {['15%,8%','82%,22%','6%,52%','88%,58%','50%,90%'].map((pos, i) => (
          <div key={i} className="absolute candy-sparkle font-black" style={{left:pos.split(',')[0],top:pos.split(',')[1],animationDelay:`${i*0.45}s`,fontSize:'12px',color:['#a78bfa','#fbbf24','#34d399','#f472b6','#60a5fa'][i]}}>✦</div>
        ))}
      </div>

      <motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{duration:0.4}} className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <motion.div className="text-6xl mb-3 candy-float inline-block" style={{filter:'drop-shadow(0 0 16px rgba(167,139,250,0.4))'}}>🧘</motion.div>
          <h1 className="text-3xl font-black" style={{
            background:'linear-gradient(135deg,#7c3aed,#ec4899,#d97706)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text'
          }}>Welcome Back!</h1>
          <p className="text-purple-600/80 text-sm mt-1 font-semibold">Enter your phone to continue</p>
        </div>

        <div className="candy-card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-violet-200 text-xs font-black uppercase tracking-wider mb-2 block">📱 Country & Phone Number</label>
              <div className="grid grid-cols-[130px_1fr] gap-2">
                <select
                  value={countryCode}
                  onChange={e => setCountryCode(e.target.value)}
                  className="pastel-input"
                >
                  {COUNTRY_CODES.map((country) => (
                    <option key={`${country.label}-${country.code}`} value={country.code}>
                      {country.label} ({country.code})
                    </option>
                  ))}
                </select>
                <input
                  type="tel" placeholder="9876543210"
                  value={phone} onChange={e => setPhone(sanitizePhoneInput(e.target.value))}
                  required
                  className="pastel-input"
                />
              </div>
            </div>
            {error && (
              <motion.p initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}}
                className="text-red-300 text-xs text-center bg-red-500/20 border border-red-400/30 rounded-xl py-2 px-3 font-semibold">
                {error}
              </motion.p>
            )}
            <motion.button whileTap={{y:4,boxShadow:'0 1px 0 #4c1d95'}} type="submit" disabled={loading || !phone.trim()}
              className="btn-candy-violet w-full py-4 text-base mt-2 disabled:opacity-50">
              {loading ? 'Signing in…' : '🎮 Play Now!'}
            </motion.button>
          </form>
        </div>

        <p className="text-center text-purple-500/80 text-xs mt-6 font-semibold">
          New here?{' '}<Link href="/register" className="text-amber-600 hover:text-amber-500 transition-colors font-black">Join the Quest →</Link>
        </p>
      </motion.div>
    </div>
  )
}
