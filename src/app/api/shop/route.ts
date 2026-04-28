import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth'
import { PRODUCTS } from '@/lib/products'

export async function GET() {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const redemptions = await prisma.redemption.findMany({
    where: { userId: session.userId },
    orderBy: { redeemedAt: 'desc' },
  })

  return NextResponse.json({ products: PRODUCTS, redemptions })
}

interface ShippingAddress {
  name: string
  phone: string
  address: string
  city: string
  state: string
  pincode: string
}

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { productId, shippingAddress } = body as { productId?: string; shippingAddress?: ShippingAddress }
  if (!productId) return NextResponse.json({ error: 'Missing productId' }, { status: 400 })

  const product = PRODUCTS.find(p => p.id === productId)
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  // Physical products require shipping address
  if (!product.digital) {
    if (!shippingAddress) return NextResponse.json({ error: 'Shipping address required for physical products' }, { status: 400 })
    const { name, phone, address, city, state, pincode } = shippingAddress
    if (!name || !phone || !address || !city || !state || !pincode) {
      return NextResponse.json({ error: 'All shipping address fields are required' }, { status: 400 })
    }
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  if (user.points < product.pointCost) {
    return NextResponse.json({ error: 'Insufficient points' }, { status: 400 })
  }

  const [updatedUser, redemption] = await prisma.$transaction([
    prisma.user.update({
      where: { id: session.userId },
      data: { points: { decrement: product.pointCost } },
    }),
    prisma.redemption.create({
      data: {
        userId: session.userId,
        productId: product.id,
        pointsSpent: product.pointCost,
        shipName: shippingAddress?.name ?? null,
        shipPhone: shippingAddress?.phone ?? null,
        shipAddress: shippingAddress?.address ?? null,
        shipCity: shippingAddress?.city ?? null,
        shipState: shippingAddress?.state ?? null,
        shipPincode: shippingAddress?.pincode ?? null,
      },
    }),
  ])

  // Fire-and-forget webhook to Google Sheets (physical orders only)
  if (!product.digital && shippingAddress && process.env.GOOGLE_SHEETS_WEBHOOK_URL) {
    const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL
    const payload = JSON.stringify({
      timestamp: new Date().toISOString(),
      orderId: redemption.id,
      userName: user.name,
      userPhone: user.phone,
      productName: product.name,
      pointsSpent: product.pointCost,
      shipName: shippingAddress.name,
      shipPhone: shippingAddress.phone,
      shipAddress: shippingAddress.address,
      shipCity: shippingAddress.city,
      shipState: shippingAddress.state,
      shipPincode: shippingAddress.pincode,
    })
    fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    }).catch(() => { /* fire and forget */ })
  }

  return NextResponse.json({ success: true, points: updatedUser.points, redemption })
}
