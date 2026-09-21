import https from 'https'

export interface MusicApiTrack {
  name: string
  previewUrl?: string
  trackTimeMillis?: number
}

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
  tracks?: MusicApiTrack[]
  previewUrl?: string
  length?: string
  source: 'api'
}

function httpsFallbackRequest<T>(url: string): Promise<T> {
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

async function fetchJsonFromApi<T>(url: string): Promise<T> {
  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      headers: {
        Accept: 'application/json',
      },
    })

    if (!res.ok) {
      throw new Error(`API responded with status code ${res.status}`)
    }

    return (await res.json()) as T
  } catch {
    // If native fetch fails (e.g. corporate proxy SSL certificate inspection with UNABLE_TO_GET_ISSUER_CERT_LOCALLY),
    // seamlessly fall back to https agent so search and discovery never break.
    return httpsFallbackRequest<T>(url)
  }
}

/**
 * Searches for albums using the free iTunes Search API with native fetch and Next.js caching.
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

    const data = await fetchJsonFromApi<ITunesSearchResponse>(url)

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
 * Fetches full album details including tracklist, 30-second audio preview URLs, and total length.
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
        previewUrl?: string
      }>
    }

    const data = await fetchJsonFromApi<ITunesLookupResponse>(url)

    if (!data.results || data.results.length === 0) {
      return null
    }

    const collection = data.results[0]
    const tracksRaw = data.results.filter(
      (r) => r.wrapperType === 'track' && Boolean(r.trackName)
    )

    const tracks: MusicApiTrack[] = tracksRaw.map((t) => ({
      name: t.trackName as string,
      previewUrl: t.previewUrl,
      trackTimeMillis: t.trackTimeMillis,
    }))

    const tracklist = tracks.map((t) => t.name)
    const totalMs = tracksRaw.reduce((sum, t) => sum + (t.trackTimeMillis || 0), 0)

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

    const firstPreviewUrl = tracks.find((t) => Boolean(t.previewUrl))?.previewUrl

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
      tracks,
      previewUrl: firstPreviewUrl,
      length: formattedLength,
      source: 'api',
    }
  } catch (error) {
    console.warn(`Error looking up iTunes album ${collectionId}:`, error)
    return null
  }
}

let cachedFeaturedAlbums: MusicApiAlbumResult[] | null = null
let lastFetchedTime = 0

/**
 * Fetches featured albums dynamically from the Music API across diverse artists & genres.
 */
export async function getFeaturedAlbumsFromApi(): Promise<MusicApiAlbumResult[]> {
  if (cachedFeaturedAlbums && Date.now() - lastFetchedTime < 1000 * 60 * 30) {
    return cachedFeaturedAlbums
  }

  const queries = [
    'Kendrick Lamar',
    'Radiohead',
    'Daft Punk',
    'Fleetwood Mac',
    'The Beatles',
    'Taylor Swift',
    'Billie Eilish',
    'Pink Floyd',
    'SZA',
  ]

  try {
    const results = await Promise.all(
      queries.map((q) => searchAlbumsFromMusicApi(q, 2))
    )

    const albums: MusicApiAlbumResult[] = []
    const seen = new Set<string>()

    for (const group of results) {
      for (const item of group) {
        if (!seen.has(item.id)) {
          seen.add(item.id)
          albums.push(item)
        }
      }
    }

    if (albums.length > 0) {
      cachedFeaturedAlbums = albums
      lastFetchedTime = Date.now()
      return albums
    }
  } catch (err) {
    console.warn('Failed to fetch live featured albums from API:', err)
  }

  return []
}
