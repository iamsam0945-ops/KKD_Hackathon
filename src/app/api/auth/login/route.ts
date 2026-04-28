import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json()

    const user = await prisma.user.findUnique({ where: { phone } })
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
