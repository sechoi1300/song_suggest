import { NextRequest, NextResponse } from 'next/server'
import { getAlbumDetailsFromMusicApi, searchAlbumsFromMusicApi } from '@/lib/musicApi'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const idStr = searchParams.get('id') || ''
  const title = searchParams.get('title') || ''
  const artist = searchParams.get('artist') || ''

  let collectionId = parseInt(idStr.replace('itunes-', ''), 10)

  // If ID is not a direct numeric iTunes ID, search by title and artist
  if (isNaN(collectionId) && title) {
    try {
      const searchResults = await searchAlbumsFromMusicApi(`${title} ${artist}`.trim(), 1)
      if (searchResults && searchResults.length > 0 && searchResults[0].collectionId) {
        collectionId = searchResults[0].collectionId
      }
    } catch (e) {
      console.warn('Error finding album by title/artist:', e)
    }
  }

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
