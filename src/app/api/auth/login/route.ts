import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/auth'
import { cookies } from 'next/headers'
import { normalizePhone } from '@/lib/phone'

export async function POST(request: NextRequest) {
  try {
    const { phone, countryCode } = await request.json()
    const normalizedPhone = normalizePhone(phone, countryCode)
    if (!normalizedPhone) {
      return NextResponse.json({ error: 'Please enter a valid phone number' }, { status: 400 })
    }

    const user = await prisma.user.findFirst({
      where: { OR: [{ phone: normalizedPhone }, { phone }] },
    })
    if (!user) return NextResponse.json({ error: 'No account found with that phone number' }, { status: 401 })

    const token = signToken({ userId: user.id, username: user.username })
    const cookieStore = await cookies()
    cookieStore.set('token', token, { httpOnly: true, maxAge: 60 * 60 * 24 * 7, path: '/' })

    return NextResponse.json({ success: true, user: { id: user.id, name: user.name, username: user.username, referralToken: user.referralToken } })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
