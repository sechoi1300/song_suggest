import { NextRequest } from 'next/server'
import { proxyAppleAudio } from '@/lib/audioProxy'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  return proxyAppleAudio(request.nextUrl.searchParams.get('url'), request.headers.get('range'))
}
