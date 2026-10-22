import type { MusicApiAlbumResult } from './musicApi'

export const TOP_ALBUMS_URL = 'https://itunes.apple.com/us/rss/topalbums/limit=10/json'

interface ChartEntry {
  id: { attributes: { 'im:id': string } }
  'im:name': { label: string }
  'im:artist': { label: string }
  'im:releaseDate': { label: string }
  'im:image': Array<{ label: string }>
  'im:itemCount'?: { label: string }
  category?: { attributes: { label: string } }
}

export interface ITunesChartResponse {
  feed: {
    updated: { label: string }
    entry: ChartEntry[]
  }
}

export function parseTopAlbumsFeed(data: ITunesChartResponse) {
  if (!Array.isArray(data.feed?.entry) || data.feed.entry.length === 0) {
    throw new Error('Apple Top Albums feed is empty or invalid')
  }

  const albums: MusicApiAlbumResult[] = data.feed.entry.slice(0, 10).map((entry, index) => {
    const collectionId = Number(entry.id.attributes['im:id'])
    const date = new Date(entry['im:releaseDate'].label)
    if (!Number.isSafeInteger(collectionId) || collectionId <= 0 || !Number.isFinite(date.getTime())) {
      throw new Error('Invalid album metadata in Apple chart')
    }
    return {
      collectionId,
      id: `itunes-${collectionId}`,
      title: entry['im:name'].label,
      artist: [entry['im:artist'].label],
      releaseDate: date.toISOString(),
      releaseYear: date.getUTCFullYear(),
      genres: entry.category ? [entry.category.attributes.label] : [],
      coverImageUrl: entry['im:image'].at(-1)?.label.replace(/\/\d+x\d+bb\./, '/600x600bb.') || '',
      numSongs: Number(entry['im:itemCount']?.label) || 0,
      chartRank: index + 1,
      source: 'api',
    }
  })

  return { albums, updatedAt: data.feed.updated.label }
}
