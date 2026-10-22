'use server'

import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAlbums } from './albums'

export interface SuggestionCriteria {
  mood?: string
  genre?: string
  maxDurationMinutes?: number
  onlyFromQueue?: boolean
}

export interface SuggestedAlbum {
  id: string
  title: string
  artist: string[]
  releaseDate: Date
  releaseYear?: number | null
  length?: string | null
  numSongs?: number | null
  genres: string[]
  coverImageUrl?: string | null
  tracklist?: string[]
  averageRating?: number
  reviews?: { rating: number }[]
}

export interface AlbumSuggestion {
  album: SuggestedAlbum
  matchScore: number // 0-100%
  matchReason: string
}

export async function getAlbumSuggestions(
  criteria?: SuggestionCriteria
): Promise<AlbumSuggestion[]> {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    // Fetch user's rated albums & queue
    const userRatedAlbumIds = new Set<string>()
    const topGenres = new Map<string, number>()
    const topArtists = new Set<string>()
    const queueAlbumIds = new Set<string>()

    if (userId) {
      try {
        const userReviews = await prisma.review.findMany({
          where: { userId },
          include: {
            album: {
              select: {
                artist: true,
                genres: true,
              },
            },
          },
        })

        userReviews.forEach((r) => {
          userRatedAlbumIds.add(r.albumId)
          if (r.rating >= 8.0) {
            r.album.artist.forEach((a) => topArtists.add(a.toLowerCase()))
            r.album.genres.forEach((g) => {
              topGenres.set(g.toLowerCase(), (topGenres.get(g.toLowerCase()) || 0) + 1)
            })
          }
        })

        const queue = await prisma.wantToListen.findMany({
          where: { userId },
          select: { albumId: true },
        })
        queue.forEach((q) => queueAlbumIds.add(q.albumId))
      } catch {}
    }

    const ratedIds = Array.from(userRatedAlbumIds)
    const queueIds = Array.from(queueAlbumIds)

    // Push filtering into database query (exclude already rated IDs and filter by genre)
    const dbWhere: {
      id?: { notIn?: string[]; in?: string[] }
      genres?: { has: string }
    } = {}

    if (criteria?.onlyFromQueue) {
      dbWhere.id = {
        in: queueIds,
        ...(ratedIds.length > 0 ? { notIn: ratedIds } : {}),
      }
    } else if (ratedIds.length > 0) {
      dbWhere.id = { notIn: ratedIds }
    }

    if (criteria?.genre && criteria.genre !== 'ALL') {
      dbWhere.genres = { has: criteria.genre }
    }

    let candidates: SuggestedAlbum[] = []
    try {
      candidates = (await prisma.album.findMany({
        where: dbWhere,
        take: 30,
        orderBy: { averageRating: 'desc' },
      })) as unknown as SuggestedAlbum[]
    } catch {}

    // Include current chart discoveries while retaining saved catalog recommendations.
    if (!criteria?.onlyFromQueue) {
      let chartCandidates = (await getAlbums()).filter((a) => !userRatedAlbumIds.has(a.id))
      if (criteria?.genre && criteria.genre !== 'ALL') {
        const g = criteria.genre.toLowerCase()
        chartCandidates = chartCandidates.filter((a) =>
          a.genres.some((ag: string) => ag.toLowerCase() === g)
        )
      }
      candidates = Array.from(new Map([...chartCandidates, ...candidates].map((album) => [album.id, album])).values())
    }

    // Score candidates
    const scored: AlbumSuggestion[] = candidates.map((album) => {
      let score = 50 // base match score
      const reasons: string[] = []

      // Calculate rating FIRST so database-backed albums receive the community bonus properly
      const effectiveRating =
        album.averageRating !== undefined && album.averageRating !== null
          ? album.averageRating
          : album.reviews && album.reviews.length > 0
          ? album.reviews.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / album.reviews.length
          : undefined

      // In queue?
      if (queueAlbumIds.has(album.id)) {
        score += 25
        reasons.push('Saved in your Want to Listen queue')
      }

      // Shared top artists?
      const sharesArtist = album.artist.some((art: string) =>
        topArtists.has(art.toLowerCase())
      )
      if (sharesArtist) {
        score += 20
        reasons.push(`You love other albums by ${album.artist[0]}`)
      }

      // Shared top genres?
      let matchingGenreCount = 0
      album.genres.forEach((g: string) => {
        if (topGenres.has(g.toLowerCase())) {
          matchingGenreCount++
        }
      })
      if (matchingGenreCount > 0) {
        score += Math.min(25, matchingGenreCount * 10)
        reasons.push(`Matches your favorite genre: ${album.genres[0]}`)
      }

      // Community rating boost - evaluated after rating calculation so database-backed albums receive it properly
      if (effectiveRating !== undefined && effectiveRating >= 9.0) {
        score += 15
        reasons.push(`Community Masterpiece (${effectiveRating.toFixed(1)}/10)`)
      }

      if (reasons.length === 0) {
        reasons.push(`Explore ${album.genres[0] || 'Music'}`)
      }

      return {
        album: {
          ...album,
          averageRating: effectiveRating === undefined ? undefined : Number(effectiveRating.toFixed(1)),
        },
        matchScore: Math.min(99, Math.max(65, score)),
        matchReason: reasons.slice(0, 2).join(' • '),
      }
    })

    // Sort by matchScore descending
    scored.sort((a, b) => b.matchScore - a.matchScore)

    return scored.slice(0, 8)
  } catch (error) {
    console.error('Error generating suggestions:', error)
    return []
  }
}
