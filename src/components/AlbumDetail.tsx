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

function normalizeTrackName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s*[\(\[](feat\.|ft\.|featuring|with|remaster|version|deluxe|edit|live|bonus).*?[\)\]]/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim()
}

export default function AlbumDetail({
  album,
  userReview,
  existingRankedAlbums = [],
  isBookmarked = false,
}: AlbumDetailProps) {
  const [playingTrack, setPlayingTrack] = useState<string | null>(null)
  const [trackProgress, setTrackProgress] = useState<number>(0)
  const [currentTime, setCurrentTime] = useState<number>(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const [tracklist, setTracklist] = useState<string[]>(() => {
    if (album.tracklist && album.tracklist.length > 0) return album.tracklist
    if (album.tracks && album.tracks.length > 0) return album.tracks.map((t) => t.name)
    return []
  })

  const buildPreviewMap = (tracks: Array<{ name: string; previewUrl?: string }>) => {
    const map: Record<string, string> = {}
    tracks.forEach((t, i) => {
      if (t.previewUrl) {
        const safeUrl = t.previewUrl.startsWith('/api/music/proxy-audio')
          ? t.previewUrl
          : `/api/music/proxy-audio?url=${encodeURIComponent(t.previewUrl)}`

        map[t.name.toLowerCase().trim()] = safeUrl
        const norm = normalizeTrackName(t.name)
        if (norm) {
          map[`norm_${norm}`] = safeUrl
        }
        map[`idx_${i}`] = safeUrl
      }
    })
    return map
  }

  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>(() =>
    album.tracks && album.tracks.length > 0 ? buildPreviewMap(album.tracks) : {}
  )

  const tier = album.averageRating ? getTierFromScore(album.averageRating) : null

  // Fetch audio preview URLs for tracklist if needed
  useEffect(() => {
    const fetchUrl = album.id.startsWith('itunes-')
      ? `/api/music/details?id=${encodeURIComponent(album.id)}`
      : `/api/music/details?title=${encodeURIComponent(album.title)}&artist=${encodeURIComponent(
          album.artist[0] || ''
        )}`

    fetch(fetchUrl)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.album) {
          if (data.album.tracks && data.album.tracks.length > 0) {
            setPreviewUrls(buildPreviewMap(data.album.tracks))
          }
          if (data.album.tracklist?.length > 0) {
            setTracklist((prev) => (prev.length === 0 ? data.album.tracklist : prev))
          }
        }
      })
      .catch((err) => console.warn('Could not load track audio previews:', err))
  }, [album.id, album.title, album.artist])

  const getTrackPreviewUrl = (trackTitle: string, index: number): string | undefined => {
    const exact = previewUrls[trackTitle.toLowerCase().trim()]
    if (exact) return exact

    const norm = normalizeTrackName(trackTitle)
    if (norm && previewUrls[`norm_${norm}`]) {
      return previewUrls[`norm_${norm}`]
    }

    if (previewUrls[`idx_${index}`]) {
      return previewUrls[`idx_${index}`]
    }

    return undefined
  }

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

  const handleTogglePlay = (trackTitle: string, index: number) => {
    const url = getTrackPreviewUrl(trackTitle, index)
    if (!url) return

    if (playingTrack === trackTitle) {
      audioRef.current?.pause()
      handleStopAudio()
    } else {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = url
        audioRef.current.currentTime = 0
        setTrackProgress(0)
        setCurrentTime(0)
        const playPromise = audioRef.current.play()
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('Audio play error:', err)
            handleStopAudio()
          })
        }
      }
      setPlayingTrack(trackTitle)
    }
  }

  return (
    <div className="space-y-8">
      {/* Album Header */}
      <div className="bg-white border border-[#EAE4D9] rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start">
          {/* Album Cover */}
          <div className="w-48 sm:w-56 aspect-square rounded-xl overflow-hidden bg-[#EAE4D9] border border-[#EAE4D9] shadow-xs flex-shrink-0 mx-auto sm:mx-0">
            {album.coverImageUrl ? (
              <img
                src={album.coverImageUrl}
                alt={album.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-stone-400 text-5xl font-bold">
                {album.title.charAt(0)}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 w-full space-y-3">
            <div>
              <div className="flex items-center space-x-2 text-xs text-stone-500 mb-1">
                {album.releaseYear && <span>{album.releaseYear}</span>}
                {album.genres && album.genres[0] && (
                  <>
                    <span>·</span>
                    <span>{album.genres.join(', ')}</span>
                  </>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-semibold text-stone-900 tracking-tight">
                {album.title}
              </h1>
              <p className="text-base sm:text-lg text-stone-600 font-medium">
                {Array.isArray(album.artist) ? album.artist.join(', ') : album.artist}
              </p>
            </div>

            {/* Quick stats */}
            <div className="flex items-center space-x-4 text-xs text-stone-500 pt-1">
              {album.numSongs && <span>{album.numSongs} tracks</span>}
              {album.length && (
                <>
                  <span>·</span>
                  <span>{album.length}</span>
                </>
              )}
            </div>

            {/* Score & Tier summary */}
            <div className="pt-2 flex items-center space-x-3">
              {album.averageRating !== undefined ? (
                <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#FAF7F2] border border-[#EAE4D9]">
                  <span className="text-base font-bold text-stone-900">
                    ★ {album.averageRating.toFixed(1)}
                  </span>
                  <span className="text-xs text-stone-400">/ 10</span>
                  {tier && (
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${tier.badgeBg} ${tier.borderColor} ${tier.textColor}`}>
                      {tier.label}
                    </span>
                  )}
                  <span className="text-xs text-stone-400 pl-1">
                    ({album.reviewCount ?? 0} {album.reviewCount === 1 ? 'rating' : 'ratings'})
                  </span>
                </div>
              ) : (
                <span className="text-xs text-stone-400">No ratings yet</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tracklist with Audio Previews */}
      {tracklist && tracklist.length > 0 && (
        <div className="bg-white border border-[#EAE4D9] rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-stone-900">
              Tracklist
            </h3>
            {playingTrack && (
              <div className="flex items-center space-x-2 text-xs text-stone-600 animate-in fade-in">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="truncate max-w-[140px] sm:max-w-xs">{playingTrack}</span>
                <span className="font-mono text-[10px] text-stone-400">
                  {Math.floor(currentTime)}s / 30s
                </span>
                <button
                  type="button"
                  onClick={handleStopAudio}
                  className="text-stone-400 hover:text-stone-700 ml-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          <audio
            ref={audioRef}
            preload="metadata"
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleStopAudio}
            onError={handleStopAudio}
            className="hidden"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {tracklist.map((track, i) => {
              const url = getTrackPreviewUrl(track, i)
              const isPlaying = playingTrack === track

              return (
                <div
                  key={i}
                  className={`relative overflow-hidden flex items-center justify-between space-x-3 px-3 py-2 rounded-lg border text-xs transition-colors ${
                    isPlaying
                      ? 'bg-[#EAE4D9] border-stone-400 text-stone-900 font-medium'
                      : 'bg-[#FAF7F2] border-[#EAE4D9] text-stone-700'
                  }`}
                >
                  {/* Progress background fill */}
                  {isPlaying && (
                    <div
                      className="absolute inset-y-0 left-0 bg-stone-300/40 pointer-events-none transition-[width] duration-150 ease-linear"
                      style={{ width: `${trackProgress}%` }}
                    />
                  )}

                  {/* Progress bar line */}
                  {isPlaying && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-stone-300/60 overflow-hidden pointer-events-none">
                      <div
                        className="h-full bg-stone-800 transition-[width] duration-150 ease-linear"
                        style={{ width: `${trackProgress}%` }}
                      />
                    </div>
                  )}

                  <div className="relative z-10 flex items-center space-x-2 min-w-0">
                    <span className="w-4 font-mono text-stone-400 text-right flex-shrink-0 text-[11px]">
                      {i + 1}
                    </span>
                    <span className="truncate">{track}</span>
                  </div>

                  {url && (
                    <div className="relative z-10 flex items-center space-x-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleTogglePlay(track, i)}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                          isPlaying
                            ? 'bg-stone-900 text-stone-50'
                            : 'bg-white hover:bg-stone-200 text-stone-600 border border-[#D9D1C3]'
                        }`}
                      >
                        {isPlaying ? 'Pause' : 'Play'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Rating & Ranking Form */}
      <div>
        <ReviewForm
          album={album}
          initialReview={userReview || null}
          existingRankedAlbums={existingRankedAlbums}
          isBookmarked={isBookmarked}
        />
      </div>

      {/* Community Reviews List */}
      <div className="bg-white border border-[#EAE4D9] rounded-2xl p-6 sm:p-8 shadow-xs">
        <h2 className="text-lg font-semibold text-stone-900 mb-4">
          Reviews ({album.reviews.length})
        </h2>
        <ReviewList reviews={album.reviews} albumId={album.id} />
      </div>
    </div>
  )
}
