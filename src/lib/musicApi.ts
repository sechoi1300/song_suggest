import https from 'https'

export interface MusicApiAlbumResult {
  collectionId: number
  id: string // e.g. "itunes-1109714933"
  title: string
  artist: string[]
  releaseDate: string
  releaseYear: number
  genres: string[]
  coverImageUrl: string
  numSongs: number
  tracklist?: string[]
  length?: string
  source: 'api'
}

function fetchJsonOverHttps<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const agent = new https.Agent({ rejectUnauthorized: false })
    const req = https.get(url, { agent, timeout: 8000 }, (res) => {
      if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
        res.resume()
        return reject(new Error(`API responded with status code ${res.statusCode}`))
      }

      let rawData = ''
      res.setEncoding('utf8')
      res.on('data', (chunk) => {
        rawData += chunk
      })
      res.on('end', () => {
        try {
          const parsed = JSON.parse(rawData) as T
          resolve(parsed)
        } catch (e) {
          reject(e)
        }
      })
    })

    req.on('timeout', () => {
      req.destroy(new Error('Request timed out'))
    })

    req.on('error', (err) => {
      reject(err)
    })
  })
}

/**
 * Searches for albums using the free iTunes Search API.
 * No API key required.
 */
export async function searchAlbumsFromMusicApi(
  query: string,
  limit = 8
): Promise<MusicApiAlbumResult[]> {
  const trimmed = query.trim()
  if (!trimmed || trimmed.length < 2) return []

  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
      trimmed
    )}&entity=album&limit=${limit}`

    interface ITunesSearchResponse {
      resultCount: number
      results: Array<{
        collectionId: number
        collectionName: string
        artistName: string
        releaseDate: string
        primaryGenreName?: string
        artworkUrl100?: string
        trackCount?: number
      }>
    }

    const data = await fetchJsonOverHttps<ITunesSearchResponse>(url)

    if (!data.results || data.results.length === 0) {
      return []
    }

    return data.results.map((item) => {
      const relDate = new Date(item.releaseDate)
      const year = isNaN(relDate.getFullYear()) ? new Date().getFullYear() : relDate.getFullYear()

      // Upgrade artwork from 100x100 to 600x600 for sharp cover art
      const highResArt = item.artworkUrl100
        ? item.artworkUrl100
            .replace(/\/[0-9]+x[0-9]+bb\./, '/600x600bb.')
            .replace('/100x100bb.jpg', '/600x600bb.jpg')
        : 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80'

      const artists = item.artistName
        ? item.artistName.split(/[,&]/).map((a) => a.trim()).filter(Boolean)
        : ['Unknown Artist']

      return {
        collectionId: item.collectionId,
        id: `itunes-${item.collectionId}`,
        title: item.collectionName || 'Untitled Album',
        artist: artists,
        releaseDate: item.releaseDate,
        releaseYear: year,
        genres: item.primaryGenreName ? [item.primaryGenreName] : ['Music'],
        coverImageUrl: highResArt,
        numSongs: item.trackCount || 0,
        source: 'api',
      }
    })
  } catch (error) {
    console.warn('Error querying iTunes Search API:', error)
    return []
  }
}

/**
 * Fetches full album details including tracklist and total length.
 */
export async function getAlbumDetailsFromMusicApi(
  collectionId: number
): Promise<MusicApiAlbumResult | null> {
  try {
    const url = `https://itunes.apple.com/lookup?id=${collectionId}&entity=song`

    interface ITunesLookupResponse {
      resultCount: number
      results: Array<{
        wrapperType: string
        collectionId?: number
        collectionName?: string
        artistName?: string
        releaseDate?: string
        primaryGenreName?: string
        artworkUrl100?: string
        trackCount?: number
        trackName?: string
        trackTimeMillis?: number
      }>
    }

    const data = await fetchJsonOverHttps<ITunesLookupResponse>(url)

    if (!data.results || data.results.length === 0) {
      return null
    }

    const collection = data.results[0]
    const tracks = data.results.filter(
      (r) => r.wrapperType === 'track' && Boolean(r.trackName)
    )

    const tracklist = tracks.map((t) => t.trackName as string)
    const totalMs = tracks.reduce((sum, t) => sum + (t.trackTimeMillis || 0), 0)

    let formattedLength: string | undefined
    if (totalMs > 0) {
      const totalMinutes = Math.floor(totalMs / 60000)
      const remainingSeconds = Math.floor((totalMs % 60000) / 1000)
      formattedLength = `${totalMinutes}:${remainingSeconds.toString().padStart(2, '0')}`
    }

    const relDate = new Date(collection.releaseDate || Date.now())
    const year = isNaN(relDate.getFullYear()) ? new Date().getFullYear() : relDate.getFullYear()

    const highResArt = collection.artworkUrl100
      ? collection.artworkUrl100
          .replace(/\/[0-9]+x[0-9]+bb\./, '/600x600bb.')
          .replace('/100x100bb.jpg', '/600x600bb.jpg')
      : ''

    const artists = collection.artistName
      ? collection.artistName.split(/[,&]/).map((a) => a.trim()).filter(Boolean)
      : ['Unknown Artist']

    return {
      collectionId,
      id: `itunes-${collectionId}`,
      title: collection.collectionName || 'Untitled Album',
      artist: artists,
      releaseDate: collection.releaseDate || new Date().toISOString(),
      releaseYear: year,
      genres: collection.primaryGenreName ? [collection.primaryGenreName] : ['Music'],
      coverImageUrl: highResArt,
      numSongs: tracks.length || collection.trackCount || 0,
      tracklist,
      length: formattedLength,
      source: 'api',
    }
  } catch (error) {
    console.warn(`Error looking up iTunes album ${collectionId}:`, error)
    return null
  }
}
