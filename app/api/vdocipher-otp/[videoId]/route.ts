import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  // Only authenticated students can get video OTPs
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { videoId } = await params

  try {
    const response = await fetch(
      `https://dev.vdocipher.com/api/videos/${videoId}/otp`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Apisecret ${process.env.VDOCIPHER_API_SECRET}`,
        },
        body: JSON.stringify({ ttl: 300 }), // OTP valid for 5 minutes
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('VdoCipher OTP error:', errorText)
      return NextResponse.json(
        { error: 'Failed to generate video token' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error('VdoCipher OTP fetch failed:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
