'use client'

import { useState, useRef } from 'react'
import { calculateScoreFromRankPlacement } from '@/lib/beli'

export interface ExistingRankedAlbum {
  albumId: string
  title: string
  artist: string[]
  coverImageUrl: string | null
  rank: number
  rating: number
}

interface HeadToHeadRankerProps {
  currentAlbum: {
    id: string
    title: string
    artist: string[]
    coverImageUrl?: string | null
  }
  existingAlbums: ExistingRankedAlbum[] // Sorted ascending by rank (1, 2, 3...)
  onRankDetermined: (result: { rank: number; score: number }) => void
  onCancel?: () => void
}

export default function HeadToHeadRanker({
  currentAlbum,
  existingAlbums,
  onRankDetermined,
  onCancel,
}: HeadToHeadRankerProps) {
  // Binary search boundaries: indices in existingAlbums array
  const [low, setLow] = useState(0)
  const [high, setHigh] = useState(existingAlbums.length - 1)
  const [round, setRound] = useState(1)

  // Audio preview state
  const [playingAlbumId, setPlayingAlbumId] = useState<string | null>(null)
  const [previewTrackTitle, setPreviewTrackTitle] = useState<string | null>(null)
  const [playbackProgress, setPlaybackProgress] = useState<number>(0)
  const [albumPreviews, setAlbumPreviews] = useState<
    Record<string, { trackName: string; previewUrl: string } | null>
  >({})
  const [loadingPreviewId, setLoadingPreviewId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Current comparison candidate index
  const midIndex = Math.floor((low + high) / 2)
  const opponent = existingAlbums[midIndex]

  // Total comparisons needed ~ ceil(log2(N))
  const estimatedRounds = Math.max(1, Math.ceil(Math.log2(existingAlbums.length + 1)))

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const cur = audioRef.current.currentTime || 0
      const dur = audioRef.current.duration || 30
      setPlaybackProgress(Math.min(100, (cur / dur) * 100))
    }
  }

  const stopAudio = () => {
    audioRef.current?.pause()
    setPlayingAlbumId(null)
    setPreviewTrackTitle(null)
    setPlaybackProgress(0)
  }

  const handleChoice = (winner: 'CURRENT' | 'OPPONENT') => {
    stopAudio()
    let newLow = low
    let newHigh = high

    if (winner === 'CURRENT') {
      // Current album is preferred over opponent -> rank is strictly better (lower numerical rank)
      newHigh = midIndex - 1
    } else {
      // Opponent is preferred -> current album rank is worse (higher numerical rank)
      newLow = midIndex + 1
    }

    if (newLow > newHigh) {
      // Found the insertion rank!
      const finalRank = newLow + 1 // 1-based rank
      const existingScores = existingAlbums.map((a) => a.rating)
      const calculatedScore = calculateScoreFromRankPlacement(finalRank, existingScores)
      onRankDetermined({ rank: finalRank, score: calculatedScore })
    } else {
      setLow(newLow)
      setHigh(newHigh)
      setRound((prev) => prev + 1)
    }
  }

  const handleSkipOrEven = () => {
    stopAudio()
    const finalRank = midIndex + 1
    const calculatedScore = Number(opponent.rating.toFixed(1))
    onRankDetermined({ rank: finalRank, score: calculatedScore })
  }

  const handlePlayPreview = async (
    e: React.MouseEvent,
    album: { id: string; title: string; artist: string[] }
  ) => {
    e.stopPropagation()

    if (playingAlbumId === album.id) {
      stopAudio()
      return
    }

    let preview = albumPreviews[album.id]
    if (preview === undefined) {
      setLoadingPreviewId(album.id)
      try {
        let fetchUrl = ''
        if (album.id.startsWith('itunes-')) {
          fetchUrl = `/api/music/details?id=${encodeURIComponent(album.id)}`
        } else {
          fetchUrl = `/api/music/details?title=${encodeURIComponent(
            album.title
          )}&artist=${encodeURIComponent(album.artist[0] || '')}`
        }
        const res = await fetch(fetchUrl)
        if (res.ok) {
          const data = await res.json()
          let foundPreviewUrl: string | undefined
          let foundTrackName = 'Sample Track'

          if (data.album?.tracks && data.album.tracks.length > 0) {
            const firstWithAudio = data.album.tracks.find((t: { previewUrl?: string }) =>
              Boolean(t.previewUrl)
            )
            if (firstWithAudio) {
              foundPreviewUrl = firstWithAudio.previewUrl
              foundTrackName = firstWithAudio.name
            }
          }

          if (foundPreviewUrl) {
            const safeUrl = foundPreviewUrl.startsWith('/api/music/proxy-audio')
              ? foundPreviewUrl
              : `/api/music/proxy-audio?url=${encodeURIComponent(foundPreviewUrl)}`
            preview = { trackName: foundTrackName, previewUrl: safeUrl }
          } else {
            preview = null
          }
        }
      } catch (err) {
        console.warn('Could not load preview for album:', err)
        preview = null
      } finally {
        setLoadingPreviewId(null)
      }
      setAlbumPreviews((prev) => ({ ...prev, [album.id]: preview }))
    }

    if (preview?.previewUrl) {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = preview.previewUrl
        audioRef.current.currentTime = 0
        setPlaybackProgress(0)
        const p = audioRef.current.play()
        if (p !== undefined) {
          p.catch((err) => {
            console.warn('Preview play error:', err)
            stopAudio()
          })
        }
      }
      setPlayingAlbumId(album.id)
      setPreviewTrackTitle(preview.trackName)
    }
  }

  if (!opponent) {
    return null
  }

  return (
    <div className="bg-[#F5F1E9] border border-[#E3DCCE] rounded-2xl p-6 shadow-xs relative">
      <audio
        ref={audioRef}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onEnded={stopAudio}
        onError={() => stopAudio()}
        className="hidden"
      />

      {/* Header */}
      <div className="text-center mb-6">
        <span className="text-xs font-mono text-stone-400 uppercase tracking-wider block mb-1">
          Round {round} of {estimatedRounds}
        </span>
        <h3 className="text-xl sm:text-2xl font-semibold text-stone-900 tracking-tight">
          Which album do you prefer?
        </h3>
      </div>

      {/* VS Matchup Arena */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
        {/* Left: Current New Album */}
        <button
          type="button"
          onClick={() => handleChoice('CURRENT')}
          className="group relative bg-white hover:bg-stone-50 border border-[#EAE4D9] hover:border-stone-400 rounded-2xl p-5 text-left transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] flex flex-col justify-between cursor-pointer shadow-xs"
        >
          <div>
            <div className="flex items-center space-x-4 mb-4">
              {currentAlbum.coverImageUrl ? (
                <img
                  src={currentAlbum.coverImageUrl}
                  alt={currentAlbum.title}
                  className="w-18 h-18 rounded-xl object-cover shadow-xs border border-[#EAE4D9]"
                />
              ) : (
                <div className="w-18 h-18 rounded-xl bg-[#EAE4D9] flex items-center justify-center text-stone-700 text-2xl font-bold">
                  {currentAlbum.title.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <span className="inline-block text-[10px] font-medium tracking-wide px-2 py-0.5 rounded bg-[#FAF7F2] text-stone-600 mb-1 border border-[#EAE4D9]">
                  New
                </span>
                <h4 className="text-base font-semibold text-stone-900 truncate group-hover:text-stone-700 transition-colors">
                  {currentAlbum.title}
                </h4>
                <p className="text-xs text-stone-500 truncate">
                  {Array.isArray(currentAlbum.artist)
                    ? currentAlbum.artist.join(', ')
                    : currentAlbum.artist}
                </p>
              </div>
            </div>

            {/* Inline 30s Audio Preview Button with Progress Bar */}
            <div className="mb-4">
              <span
                onClick={(e) => handlePlayPreview(e, currentAlbum)}
                className={`relative overflow-hidden inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  playingAlbumId === currentAlbum.id
                    ? 'bg-[#EAE4D9] text-stone-900 border border-stone-400 shadow-xs'
                    : 'bg-[#FAF7F2] hover:bg-[#EAE4D9] text-stone-700 border border-[#D9D1C3]'
                }`}
              >
                {/* Subtle darker progress background fill */}
                {playingAlbumId === currentAlbum.id && (
                  <div
                    className="absolute inset-y-0 left-0 bg-stone-300/50 pointer-events-none transition-[width] duration-150 ease-linear"
                    style={{ width: `${playbackProgress}%` }}
                  />
                )}
                {/* Darker progress bar line along the bottom */}
                {playingAlbumId === currentAlbum.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-stone-300/70 overflow-hidden pointer-events-none">
                    <div
                      className="h-full bg-stone-900 transition-[width] duration-150 ease-linear"
                      style={{ width: `${playbackProgress}%` }}
                    />
                  </div>
                )}

                <span className="relative z-10 flex items-center space-x-1.5">
                  {loadingPreviewId === currentAlbum.id ? (
                    <span className="w-3 h-3 border-2 border-stone-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>{playingAlbumId === currentAlbum.id ? 'Pause' : 'Play Preview'}</span>
                  )}
                  {playingAlbumId === currentAlbum.id && previewTrackTitle && (
                    <span className="truncate max-w-[130px] text-stone-700 font-normal text-[11px]">
                      · {previewTrackTitle}
                    </span>
                  )}
                </span>
              </span>
            </div>
          </div>

          <div className="w-full py-2 px-4 rounded-xl bg-stone-900 group-hover:bg-stone-800 text-stone-50 font-medium text-xs text-center transition-all shadow-xs">
            Select
          </div>
        </button>

        {/* Center VS Badge */}
        <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#EAE4D9] border-2 border-white items-center justify-center font-bold text-[10px] text-stone-500 z-10 shadow-xs">
          VS
        </div>

        {/* Right: Existing Leaderboard Competitor */}
        <button
          type="button"
          onClick={() => handleChoice('OPPONENT')}
          className="group relative bg-white hover:bg-stone-50 border border-[#EAE4D9] hover:border-stone-400 rounded-2xl p-5 text-left transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] flex flex-col justify-between cursor-pointer shadow-xs"
        >
          <div>
            <div className="flex items-center space-x-4 mb-4">
              {opponent.coverImageUrl ? (
                <img
                  src={opponent.coverImageUrl}
                  alt={opponent.title}
                  className="w-18 h-18 rounded-xl object-cover shadow-xs border border-[#EAE4D9]"
                />
              ) : (
                <div className="w-18 h-18 rounded-xl bg-[#EAE4D9] flex items-center justify-center text-stone-700 text-2xl font-bold">
                  {opponent.title.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs text-stone-500 font-mono">
                    #{opponent.rank}
                  </span>
                  <span className="text-xs font-semibold text-stone-700">
                    ★ {opponent.rating.toFixed(1)}
                  </span>
                </div>
                <h4 className="text-base font-semibold text-stone-900 truncate group-hover:text-stone-700 transition-colors">
                  {opponent.title}
                </h4>
                <p className="text-sm text-stone-500 truncate">
                  {Array.isArray(opponent.artist) ? opponent.artist.join(', ') : opponent.artist}
                </p>
              </div>
            </div>

            {/* Inline 30s Audio Preview Button with Progress Bar */}
            <div className="mb-4">
              <span
                onClick={(e) =>
                  handlePlayPreview(e, {
                    id: opponent.albumId,
                    title: opponent.title,
                    artist: opponent.artist,
                  })
                }
                className={`relative overflow-hidden inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  playingAlbumId === opponent.albumId
                    ? 'bg-[#EAE4D9] text-stone-900 border border-stone-400 shadow-xs'
                    : 'bg-[#FAF7F2] hover:bg-[#EAE4D9] text-stone-700 border border-[#D9D1C3]'
                }`}
              >
                {/* Subtle darker progress background fill */}
                {playingAlbumId === opponent.albumId && (
                  <div
                    className="absolute inset-y-0 left-0 bg-stone-300/50 pointer-events-none transition-[width] duration-150 ease-linear"
                    style={{ width: `${playbackProgress}%` }}
                  />
                )}
                {/* Darker progress bar line along the bottom */}
                {playingAlbumId === opponent.albumId && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-stone-300/70 overflow-hidden pointer-events-none">
                    <div
                      className="h-full bg-stone-900 transition-[width] duration-150 ease-linear"
                      style={{ width: `${playbackProgress}%` }}
                    />
                  </div>
                )}

                <span className="relative z-10 flex items-center space-x-1.5">
                  {loadingPreviewId === opponent.albumId ? (
                    <span className="w-3 h-3 border-2 border-stone-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>{playingAlbumId === opponent.albumId ? 'Pause' : 'Play Preview'}</span>
                  )}
                  {playingAlbumId === opponent.albumId && previewTrackTitle && (
                    <span className="truncate max-w-[130px] text-stone-700 font-normal text-[11px]">
                      · {previewTrackTitle}
                    </span>
                  )}
                </span>
              </span>
            </div>
          </div>

          <div className="w-full py-2 px-4 rounded-xl bg-stone-900 group-hover:bg-stone-800 text-stone-50 font-medium text-xs text-center transition-all shadow-xs">
            Select
          </div>
        </button>
      </div>

      {/* Footer controls */}
      <div className="mt-6 pt-4 border-t border-[#EAE4D9] flex items-center justify-between text-xs text-stone-400">
        <button
          type="button"
          onClick={handleSkipOrEven}
          className="hover:text-stone-700 transition-colors cursor-pointer"
        >
          Equal / Skip
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="hover:text-stone-700 transition-colors cursor-pointer"
          >
            Manual rating
          </button>
        )}
      </div>
    </div>
  )
}
