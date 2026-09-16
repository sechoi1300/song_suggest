'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { saveBeliReview } from '@/app/actions/reviews'
import { toggleWantToListen } from '@/app/actions/wantToListen'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import HeadToHeadRanker, { ExistingRankedAlbum } from './HeadToHeadRanker'
import {
  getTierFromScore,
  BELI_VIBES,
  LISTEN_AGAIN_OPTIONS,
  LISTENED_WITH_OPTIONS,
} from '@/lib/beli'

interface ReviewFormProps {
  album: {
    id: string
    title: string
    artist: string[]
    coverImageUrl?: string | null
    tracklist?: string[]
  }
  initialReview?: {
    rating: number
    rank?: number | null
    tier?: string | null
    favoriteTracks?: string[]
    skipTrack?: string | null
    vibes?: string[]
    listenAgain?: string | null
    listenedWith?: string | null
    reviewText?: string | null
  } | null
  existingRankedAlbums?: ExistingRankedAlbum[]
  isBookmarked?: boolean
}

export default function ReviewForm({
  album,
  initialReview,
  existingRankedAlbums = [],
  isBookmarked = false,
}: ReviewFormProps) {
  const { data: session } = useSession()
  const router = useRouter()

  const [mode, setMode] = useState<'FORM' | 'HEAD_TO_HEAD'>('FORM')
  const [score, setScore] = useState<number>(initialReview?.rating ?? 8.5)
  const [targetRank, setTargetRank] = useState<number | undefined>(
    initialReview?.rank ?? undefined
  )
  const [favoriteTracks, setFavoriteTracks] = useState<string[]>(
    initialReview?.favoriteTracks ?? []
  )
  const [skipTrack, setSkipTrack] = useState<string>(initialReview?.skipTrack ?? '')
  const [vibes, setVibes] = useState<string[]>(initialReview?.vibes ?? [])
  const [listenAgain, setListenAgain] = useState<string>(
    initialReview?.listenAgain ?? 'ON_REPEAT'
  )
  const [listenedWith, setListenedWith] = useState<string>(
    initialReview?.listenedWith ?? 'Headphones 🎧'
  )
  const [reviewText, setReviewText] = useState(initialReview?.reviewText ?? '')

  const [bookmarked, setBookmarked] = useState(isBookmarked)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isQueueLoading, setIsQueueLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  if (!session) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-300">
        <span className="text-3xl mb-3 block">🎧</span>
        <h3 className="text-xl font-bold text-white mb-2">Want to rate & rank this album?</h3>
        <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">
          Sign in to place this album on your personal Beli leaderboard and unlock recommendations.
        </p>
        <Link
          href="/auth/signin"
          className="inline-flex items-center px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm shadow-lg shadow-violet-600/30 transition-all cursor-pointer"
        >
          Sign In / Quick Demo
        </Link>
      </div>
    )
  }

  const tier = getTierFromScore(score)

  const handleToggleVibe = (vibe: string) => {
    if (vibes.includes(vibe)) {
      setVibes(vibes.filter((v) => v !== vibe))
    } else {
      if (vibes.length < 5) {
        setVibes([...vibes, vibe])
      }
    }
  }

  const handleToggleFavoriteTrack = (track: string) => {
    if (favoriteTracks.includes(track)) {
      setFavoriteTracks(favoriteTracks.filter((t) => t !== track))
    } else {
      if (favoriteTracks.length < 4) {
        setFavoriteTracks([...favoriteTracks, track])
      }
    }
  }

  const handleRankDetermined = (result: { rank: number; score: number }) => {
    setTargetRank(result.rank)
    setScore(result.score)
    setMode('FORM')
    setSuccessMsg(`Ranked #${result.rank} with Beli score ${result.score}!`)
  }

  const handleToggleQueue = async () => {
    setIsQueueLoading(true)
    const res = await toggleWantToListen(album.id)
    if (res.success) {
      setBookmarked(res.isBookmarked ?? !bookmarked)
    }
    setIsQueueLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    setSuccessMsg('')

    const result = await saveBeliReview({
      albumId: album.id,
      score,
      targetRank,
      favoriteTracks,
      skipTrack: skipTrack || undefined,
      vibes,
      listenAgain,
      listenedWith,
      reviewText,
    })

    if (result.success) {
      setSuccessMsg('Album saved to your personal Beli leaderboard! 🎉')
      router.refresh()
    } else {
      setError(result.error || 'Failed to submit review')
    }

    setIsSubmitting(false)
  }

  if (mode === 'HEAD_TO_HEAD') {
    return (
      <HeadToHeadRanker
        currentAlbum={album}
        existingAlbums={existingRankedAlbums}
        onRankDetermined={handleRankDetermined}
        onCancel={() => setMode('FORM')}
      />
    )
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
      {/* Top action bar: Queue bookmark or Head to Head button */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-xl font-bold text-white">Rate & Rank Album</h3>
          <p className="text-xs text-slate-400">Add to your personal ranking & log listening notes</p>
        </div>
        <div className="flex items-center space-x-2">
          {existingRankedAlbums.length > 0 && (
            <button
              type="button"
              onClick={() => setMode('HEAD_TO_HEAD')}
              className="inline-flex items-center px-3.5 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600 text-violet-300 hover:text-white border border-violet-500/30 text-xs font-semibold transition-all cursor-pointer"
            >
              <span>⚔️ Head-to-Head Ranker</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleToggleQueue}
            disabled={isQueueLoading}
            className={`inline-flex items-center px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              bookmarked
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
            }`}
          >
            <span>{bookmarked ? '🔖 In Want to Listen' : '➕ Want to Listen'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 px-4 py-3 rounded-xl text-sm mb-4">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-xl text-sm mb-4">
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Beli Score Slider & Tier Badge */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Beli Score
              </span>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-4xl font-black text-white">{score.toFixed(1)}</span>
                <span className="text-slate-500 text-sm font-semibold">/ 10</span>
                {targetRank && (
                  <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-md bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    Leaderboard Rank #{targetRank}
                  </span>
                )}
              </div>
            </div>

            {/* Tier Pill */}
            <div
              className={`px-3 py-1.5 rounded-xl border flex items-center space-x-2 ${tier.badgeBg} ${tier.borderColor} ${tier.textColor}`}
            >
              <span className="text-sm font-black">★ {tier.label}</span>
              <span className="text-xs text-slate-400 hidden sm:inline">• {tier.sublabel}</span>
            </div>
          </div>

          <input
            type="range"
            min="0"
            max="10"
            step="0.1"
            value={score}
            onChange={(e) => {
              setScore(parseFloat(e.target.value))
              setTargetRank(undefined) // clear automatic matchup rank if manually tweaked
            }}
            className="w-full accent-violet-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
          />

          <div className="flex justify-between text-[11px] text-slate-500 mt-2 font-mono">
            <span>0.0 Skip</span>
            <span>6.0 Decent</span>
            <span>7.0 Good</span>
            <span>8.0 Great</span>
            <span>9.0+ Exceptional</span>
          </div>
        </div>

        {/* Favorite Standout Tracks */}
        {album.tracklist && album.tracklist.length > 0 && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Favorite Tracks (Select up to 4)
            </label>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 bg-slate-950/50 rounded-xl border border-slate-800">
              {album.tracklist.map((track, idx) => {
                const isSelected = favoriteTracks.includes(track)
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleToggleFavoriteTrack(track)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-violet-600 text-white shadow-sm shadow-violet-600/30 font-semibold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {isSelected ? '★ ' : ''}
                    {track}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Mood & Vibe Chips */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Vibe & Mood Tags (Select up to 5)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {BELI_VIBES.map((vibe) => {
              const isSelected = vibes.includes(vibe)
              return (
                <button
                  key={vibe}
                  type="button"
                  onClick={() => handleToggleVibe(vibe)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-fuchsia-600/20 text-fuchsia-300 border-fuchsia-500/50 font-bold'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {isSelected ? '✓ ' : ''}
                  {vibe}
                </button>
              )
            })}
          </div>
        </div>

        {/* Would Listen Again & Listened With */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Would Listen Again?
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {LISTEN_AGAIN_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setListenAgain(opt.value)}
                  className={`py-2 px-1 text-center rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                    listenAgain === opt.value
                      ? 'bg-violet-600 text-white border-violet-500 font-bold'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Listening Setting
            </label>
            <select
              value={listenedWith}
              onChange={(e) => setListenedWith(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              {LISTENED_WITH_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Review Notes / Hot Takes */}
        <div>
          <label htmlFor="reviewText" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Review / Hot Take (Optional)
          </label>
          <textarea
            id="reviewText"
            rows={3}
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder-slate-500"
            placeholder="What made this album special? Favorite moment or lyric?"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-violet-600/30 transition-all hover:scale-[1.005] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? 'Saving to Leaderboard...' : 'Save & Rank Album 🏆'}
        </button>
      </form>
    </div>
  )
}
