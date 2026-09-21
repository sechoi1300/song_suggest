import { NextRequest, NextResponse } from 'next/server'
import { getAlbumDetailsFromMusicApi } from '@/lib/musicApi'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const idStr = searchParams.get('id') || ''
  const collectionId = parseInt(idStr.replace('itunes-', ''), 10)

  if (isNaN(collectionId)) {
    return NextResponse.json({ error: 'Invalid collection id' }, { status: 400 })
  }

  try {
    const details = await getAlbumDetailsFromMusicApi(collectionId)
    if (!details) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 })
    }
    return NextResponse.json({ album: details })
  } catch (error) {
    console.error('Error in details route:', error)
    return NextResponse.json({ error: 'Failed to fetch details' }, { status: 500 })
  }
}
