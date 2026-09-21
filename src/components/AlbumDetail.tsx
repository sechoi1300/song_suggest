'use client'

import { useState, useEffect, useRef } from 'react'
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
    tracks?: Array<{ name: string; previewUrl?: string }>
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
  const [playingTrack, setPlayingTrack] = useState<string | null>(null)
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({})
  const [trackProgress, setTrackProgress] = useState<number>(0)
  const [currentTime, setCurrentTime] = useState<number>(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const tier = album.averageRating ? getTierFromScore(album.averageRating) : null

  // Fetch audio preview URLs for tracklist if from Apple Music / iTunes
  useEffect(() => {
    if (album.id.startsWith('itunes-')) {
      fetch(`/api/music/details?id=${encodeURIComponent(album.id)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.album?.tracks) {
            const map: Record<string, string> = {}
            data.album.tracks.forEach((t: { name: string; previewUrl?: string }) => {
              if (t.previewUrl) {
                map[t.name.toLowerCase().trim()] = t.previewUrl
              }
            })
            setPreviewUrls(map)
          }
        })
        .catch((err) => console.warn('Could not load track audio previews:', err))
    }
  }, [album.id])

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const cur = audioRef.current.currentTime || 0
      const dur = audioRef.current.duration || 30
      setCurrentTime(cur)
      setTrackProgress(Math.min(100, (cur / dur) * 100))
    }
  }

  const handleStopAudio = () => {
    setPlayingTrack(null)
    setTrackProgress(0)
    setCurrentTime(0)
  }

  const handleTogglePlay = (trackTitle: string, explicitPreviewUrl?: string) => {
    const url = explicitPreviewUrl || previewUrls[trackTitle.toLowerCase().trim()]
    if (!url) return

    if (playingTrack === trackTitle) {
      audioRef.current?.pause()
      handleStopAudio()
    } else {
      if (audioRef.current) {
        audioRef.current.src = url
        audioRef.current.currentTime = 0
        setTrackProgress(0)
        setCurrentTime(0)
        audioRef.current.play().catch((err) => console.warn('Audio play error:', err))
      }
      setPlayingTrack(trackTitle)
    }
  }

  return (
    <div className="space-y-8">
      {/* Hero Album Card */}
      <div className="relative bg-white border border-[#EAE4D9] rounded-3xl overflow-hidden p-6 sm:p-8 shadow-xs">
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
          {/* Album artwork with vinyl edge */}
          <div className="relative group mx-auto md:mx-0 flex-shrink-0">
            {/* Vinyl record poking out effect */}
            <div className="absolute top-2 left-6 w-56 sm:w-64 h-56 sm:h-64 rounded-full bg-stone-900 border-4 border-stone-800 shadow-xl flex items-center justify-center transition-transform duration-500 group-hover:translate-x-8">
              <div className="w-20 h-20 rounded-full border border-stone-700 flex items-center justify-center bg-[#EAE4D9]">
                <div className="w-5 h-5 rounded-full bg-stone-900" />
              </div>
            </div>

            {/* Album Cover Sleeve */}
            {album.coverImageUrl ? (
              <img
                src={album.coverImageUrl}
                alt={album.title}
                className="relative z-10 w-56 sm:w-64 h-56 sm:h-64 rounded-2xl object-cover shadow-md border border-[#EAE4D9]"
              />
            ) : (
              <div className="relative z-10 w-56 sm:w-64 h-56 sm:h-64 rounded-2xl bg-[#EAE4D9] flex items-center justify-center shadow-md border border-[#D9D1C3]">
                <span className="text-stone-600 text-7xl font-bold">{album.title.charAt(0)}</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 w-full">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {album.releaseYear && (
                <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-[#F3EDE2] text-stone-700 border border-[#E0D7C9]">
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

            <h1 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight mb-2">
              {album.title}
            </h1>
            <p className="text-xl text-stone-600 font-semibold mb-4">
              {Array.isArray(album.artist) ? album.artist.join(', ') : album.artist}
            </p>

            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-5 text-xs text-stone-500 mb-5 pb-4 border-b border-[#EAE4D9]">
              <div>
                <span className="text-stone-400">Released:</span>{' '}
                <span className="text-stone-800 font-medium">{formatDate(album.releaseDate)}</span>
              </div>
              {album.length && (
                <div>
                  <span className="text-stone-400">Length:</span>{' '}
                  <span className="text-stone-800 font-medium">{album.length}</span>
                </div>
              )}
              {album.numSongs && (
                <div>
                  <span className="text-stone-400">Tracks:</span>{' '}
                  <span className="text-stone-800 font-medium">{album.numSongs}</span>
                </div>
              )}
            </div>

            {/* Genres */}
            {album.genres && album.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-6">
                {album.genres.map((genre, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-[#F4EFE6] hover:bg-[#EAE4D9] text-stone-700 text-xs font-medium rounded-lg border border-[#E5DEC7] transition-colors"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {/* Score summary */}
            <div className="flex items-center space-x-3 bg-[#FAF7F2] border border-[#EAE4D9] rounded-2xl p-4 w-fit">
              {album.averageRating !== undefined ? (
                <>
                  <div className="text-center pr-4 border-r border-[#EAE4D9]">
                    <div className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                      Community Score
                    </div>
                    <div className="flex items-baseline space-x-1 mt-0.5">
                      <span className="text-3xl font-black text-stone-900">
                        {album.averageRating.toFixed(1)}
                      </span>
                      <span className="text-xs text-stone-400 font-medium">/ 10</span>
                    </div>
                  </div>
                  <div className="text-xs text-stone-500">
                    Based on{' '}
                    <span className="font-semibold text-stone-800">{album.reviewCount ?? 0}</span>{' '}
                    {album.reviewCount === 1 ? 'rating' : 'ratings'} on Song Suggest
                  </div>
                </>
              ) : (
                <div className="text-sm text-stone-500">
                  No community ratings yet. Be the first to log this album!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tracklist Preview with 30s Audio Previews */}
      {album.tracklist && album.tracklist.length > 0 && (
        <div className="bg-white border border-[#EAE4D9] rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-stone-900 flex items-center space-x-2">
              <span>🎼 Tracklist ({album.tracklist.length} tracks)</span>
            </h3>
            {playingTrack && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-stone-900 text-stone-100 text-xs rounded-full shadow-xs animate-in fade-in">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="truncate max-w-[140px] sm:max-w-xs font-medium">Playing: {playingTrack}</span>
                <span className="font-mono text-[10px] text-stone-400 tabular-nums">
                  {Math.floor(currentTime)}s / 30s
                </span>
                <button
                  type="button"
                  onClick={() => handleTogglePlay(playingTrack)}
                  className="hover:text-stone-300 font-bold ml-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          <audio
            ref={audioRef}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleStopAudio}
            onError={handleStopAudio}
            className="hidden"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {album.tracklist.map((track, i) => {
              const url = previewUrls[track.toLowerCase().trim()]
              const isPlaying = playingTrack === track

              return (
                <div
                  key={i}
                  className={`relative overflow-hidden flex items-center justify-between space-x-3 px-3.5 py-2.5 rounded-xl border text-xs transition-colors ${
                    isPlaying
                      ? 'bg-[#EAE4D9] border-stone-400 text-stone-900 font-semibold'
                      : 'bg-[#FAF7F2] border-[#EAE4D9] text-stone-800'
                  }`}
                >
                  {/* Subtle darker background tint filling up with playback */}
                  {isPlaying && (
                    <div
                      className="absolute inset-y-0 left-0 bg-stone-300/40 pointer-events-none transition-[width] duration-150 ease-linear"
                      style={{ width: `${trackProgress}%` }}
                    />
                  )}

                  {/* Progress bar line filling up along the bottom edge with a darker color */}
                  {isPlaying && (
                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-stone-300/60 overflow-hidden pointer-events-none">
                      <div
                        className="h-full bg-stone-800 transition-[width] duration-150 ease-linear rounded-r-full"
                        style={{ width: `${trackProgress}%` }}
                      />
                    </div>
                  )}

                  <div className="relative z-10 flex items-center space-x-2.5 min-w-0">
                    <span className="w-5 font-mono text-stone-400 text-right flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="truncate font-medium">{track}</span>
                  </div>

                  {url && (
                    <div className="relative z-10 flex items-center space-x-1.5 flex-shrink-0">
                      {isPlaying && (
                        <span className="font-mono text-[10px] text-stone-600 tabular-nums">
                          {Math.floor(currentTime)}s
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleTogglePlay(track, url)}
                        title={isPlaying ? 'Pause preview' : 'Listen to 30s audio preview'}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center space-x-1 transition-all cursor-pointer ${
                          isPlaying
                            ? 'bg-stone-900 text-stone-50 shadow-xs'
                            : 'bg-white hover:bg-stone-200 text-stone-700 border border-[#D9D1C3]'
                        }`}
                      >
                        <span>{isPlaying ? '⏸' : '▶'}</span>
                        <span className="hidden sm:inline">{isPlaying ? 'Pause' : '30s'}</span>
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
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
      <div className="bg-white border border-[#EAE4D9] rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-stone-900 tracking-tight">
            Community Rankings ({album.reviews.length})
          </h2>
          <span className="text-xs text-stone-400">Sorted by newest</span>
        </div>
        <ReviewList reviews={album.reviews} albumId={album.id} />
      </div>
    </div>
  )
}
