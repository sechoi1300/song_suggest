import { NextRequest, NextResponse } from 'next/server'
import { searchAlbumAutocomplete } from '@/app/actions/albums'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ results: [] })
  }

  try {
    const results = await searchAlbumAutocomplete(query)
    return NextResponse.json({ results })
  } catch (error) {
    console.error('Error in autocomplete route:', error)
    return NextResponse.json({ results: [] }, { status: 500 })
  }
}
