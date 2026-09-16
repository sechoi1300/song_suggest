'use client'

import ReviewForm from './ReviewForm'
import ReviewList from './ReviewList'
import { ExistingRankedAlbum } from './HeadToHeadRanker'
import { getTierFromScore } from '@/lib/beli'

interface ReviewWithUser {
  id: string
  userId: string
  rating: number
  rank?: number | null
  tier?: string | null
  favoriteTracks?: string[]
  skipTrack?: string | null
  vibes?: string[]
  listenAgain?: string | null
  listenedWith?: string | null
  reviewText?: string | null
  createdAt: Date | string
  user: {
    id: string
    name?: string | null
    image?: string | null
    email: string
  }
}

interface AlbumDetailProps {
  album: {
    id: string
    title: string
    artist: string[]
    releaseDate: Date | string
    releaseYear?: number | null
    length?: string | null
    numSongs?: number | null
    genres: string[]
    coverImageUrl?: string | null
    tracklist?: string[]
    description?: string
    averageRating?: number
    reviewCount?: number
    reviews: ReviewWithUser[]
  }
  userReview?: ReviewWithUser | null
  existingRankedAlbums?: ExistingRankedAlbum[]
  isBookmarked?: boolean
}

export default function AlbumDetail({
  album,
  userReview,
  existingRankedAlbums = [],
  isBookmarked = false,
}: AlbumDetailProps) {
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const tier = album.averageRating ? getTierFromScore(album.averageRating) : null

  return (
    <div className="space-y-8">
      {/* Hero Album Card */}
      <div className="relative bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        {/* Ambient glow from album colors */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
          {/* Album artwork with vinyl edge */}
          <div className="relative group mx-auto md:mx-0 flex-shrink-0">
            {/* Vinyl record poking out effect */}
            <div className="absolute top-2 left-6 w-56 sm:w-64 h-56 sm:h-64 rounded-full bg-slate-950 border-4 border-slate-800 shadow-2xl flex items-center justify-center transition-transform duration-500 group-hover:translate-x-8">
              <div className="w-20 h-20 rounded-full border border-slate-800 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-violet-500" />
              </div>
            </div>

            {/* Album Cover Sleeve */}
            {album.coverImageUrl ? (
              <img
                src={album.coverImageUrl}
                alt={album.title}
                className="relative z-10 w-56 sm:w-64 h-56 sm:h-64 rounded-2xl object-cover shadow-2xl border border-slate-700/60"
              />
            ) : (
              <div className="relative z-10 w-56 sm:w-64 h-56 sm:h-64 rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-fuchsia-600 flex items-center justify-center shadow-2xl border border-slate-700">
                <span className="text-white text-7xl font-black">{album.title.charAt(0)}</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 w-full">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {album.releaseYear && (
                <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {album.releaseYear}
                </span>
              )}
              {tier && (
                <span
                  className={`text-xs font-bold px-3 py-0.5 rounded-full border ${tier.badgeBg} ${tier.borderColor} ${tier.textColor}`}
                >
                  ★ {tier.label}
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
              {album.title}
            </h1>
            <p className="text-xl text-violet-300 font-semibold mb-4">
              {Array.isArray(album.artist) ? album.artist.join(', ') : album.artist}
            </p>

            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-5 text-xs text-slate-400 mb-5 pb-4 border-b border-slate-800">
              <div>
                <span className="text-slate-500">Released:</span>{' '}
                <span className="text-slate-200 font-medium">{formatDate(album.releaseDate)}</span>
              </div>
              {album.length && (
                <div>
                  <span className="text-slate-500">Length:</span>{' '}
                  <span className="text-slate-200 font-medium">{album.length}</span>
                </div>
              )}
              {album.numSongs && (
                <div>
                  <span className="text-slate-500">Tracks:</span>{' '}
                  <span className="text-slate-200 font-medium">{album.numSongs}</span>
                </div>
              )}
            </div>

            {/* Genres */}
            {album.genres && album.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-6">
                {album.genres.map((genre, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-medium rounded-lg border border-slate-700/60 transition-colors"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {/* Score summary */}
            <div className="flex items-center space-x-3 bg-slate-950/60 border border-slate-800 rounded-2xl p-4 w-fit">
              {album.averageRating !== undefined ? (
                <>
                  <div className="text-center pr-4 border-r border-slate-800">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Community Score
                    </div>
                    <div className="flex items-baseline space-x-1 mt-0.5">
                      <span className="text-3xl font-black text-white">
                        {album.averageRating.toFixed(1)}
                      </span>
                      <span className="text-xs text-slate-500 font-semibold">/ 10</span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400">
                    Based on{' '}
                    <span className="font-semibold text-slate-200">{album.reviewCount ?? 0}</span>{' '}
                    {album.reviewCount === 1 ? 'rating' : 'ratings'} on Song Suggest
                  </div>
                </>
              ) : (
                <div className="text-sm text-slate-400">
                  No community ratings yet. Be the first to log this album!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tracklist Preview */}
      {album.tracklist && album.tracklist.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
            <span>🎼 Tracklist ({album.tracklist.length} tracks)</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {album.tracklist.map((track, i) => (
              <div
                key={i}
                className="flex items-center space-x-3 px-3 py-2 rounded-xl bg-slate-950/50 border border-slate-800/60 text-xs"
              >
                <span className="w-5 font-mono text-slate-500 text-right">{i + 1}</span>
                <span className="text-slate-200 font-medium truncate">{track}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Beli Rating & Ranking Form */}
      <div>
        <ReviewForm
          album={album}
          initialReview={userReview || null}
          existingRankedAlbums={existingRankedAlbums}
          isBookmarked={isBookmarked}
        />
      </div>

      {/* Community Reviews List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-white tracking-tight">
            Community Rankings ({album.reviews.length})
          </h2>
          <span className="text-xs text-slate-400">Sorted by newest</span>
        </div>
        <ReviewList reviews={album.reviews} albumId={album.id} />
      </div>
    </div>
  )
}
