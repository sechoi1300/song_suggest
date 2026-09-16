'use client'

import { useState } from 'react'
import {
  calculateScoreFromRankPlacement,
  getTierFromScore,
  BELI_TIERS,
  TierInfo,
} from '@/lib/beli'

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

  // Current comparison candidate index
  const midIndex = Math.floor((low + high) / 2)
  const opponent = existingAlbums[midIndex]

  // Total comparisons needed ~ ceil(log2(N))
  const estimatedRounds = Math.max(1, Math.ceil(Math.log2(existingAlbums.length + 1)))

  const handleChoice = (winner: 'CURRENT' | 'OPPONENT') => {
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
      // newLow is 0-based index where current album should be placed
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
    // Places it right next to opponent with equal or slightly lower score
    const finalRank = midIndex + 1
    const calculatedScore = Number(opponent.rating.toFixed(1))
    onRankDetermined({ rank: finalRank, score: calculatedScore })
  }

  if (!opponent) {
    return null
  }

  return (
    <div className="bg-slate-900 border border-violet-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute -top-24 -left-24 w-60 h-60 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-fuchsia-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="text-center mb-6 relative">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold mb-2">
          <span>⚔️ Head-to-Head Ranking</span>
          <span>•</span>
          <span>Match {round} of ~{estimatedRounds}</span>
        </div>
        <h3 className="text-2xl font-black text-white tracking-tight">
          Which album do you prefer?
        </h3>
        <p className="text-slate-400 text-sm mt-1">
          Pick your favorite to pinpoint where it slots into your personal leaderboard.
        </p>
      </div>

      {/* VS Matchup Arena */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
        {/* Left: Current New Album */}
        <button
          type="button"
          onClick={() => handleChoice('CURRENT')}
          className="group relative bg-slate-950/80 hover:bg-violet-950/30 border border-slate-800 hover:border-violet-500/60 rounded-2xl p-5 text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.99] flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center space-x-4 mb-4">
            {currentAlbum.coverImageUrl ? (
              <img
                src={currentAlbum.coverImageUrl}
                alt={currentAlbum.title}
                className="w-20 h-20 rounded-xl object-cover shadow-lg border border-slate-700/50"
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white text-2xl font-black">
                {currentAlbum.title.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <span className="inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 mb-1">
                New Album
              </span>
              <h4 className="text-lg font-bold text-white truncate group-hover:text-violet-300 transition-colors">
                {currentAlbum.title}
              </h4>
              <p className="text-sm text-slate-400 truncate">
                {Array.isArray(currentAlbum.artist)
                  ? currentAlbum.artist.join(', ')
                  : currentAlbum.artist}
              </p>
            </div>
          </div>

          <div className="w-full py-2.5 px-4 rounded-xl bg-violet-600/20 group-hover:bg-violet-600 text-violet-300 group-hover:text-white font-semibold text-sm text-center transition-all border border-violet-500/30">
            Prefer {currentAlbum.title} 👍
          </div>
        </button>

        {/* Center VS Badge */}
        <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-700 items-center justify-center font-black text-xs text-slate-300 z-10 shadow-xl">
          VS
        </div>

        {/* Right: Existing Leaderboard Competitor */}
        <button
          type="button"
          onClick={() => handleChoice('OPPONENT')}
          className="group relative bg-slate-950/80 hover:bg-slate-800/60 border border-slate-800 hover:border-slate-600 rounded-2xl p-5 text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.99] flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center space-x-4 mb-4">
            {opponent.coverImageUrl ? (
              <img
                src={opponent.coverImageUrl}
                alt={opponent.title}
                className="w-20 h-20 rounded-xl object-cover shadow-lg border border-slate-700/50"
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white text-2xl font-black">
                {opponent.title.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                  Rank #{opponent.rank}
                </span>
                <span className="text-xs font-bold text-slate-300">
                  ★ {opponent.rating.toFixed(1)}
                </span>
              </div>
              <h4 className="text-lg font-bold text-white truncate group-hover:text-slate-200 transition-colors">
                {opponent.title}
              </h4>
              <p className="text-sm text-slate-400 truncate">
                {Array.isArray(opponent.artist) ? opponent.artist.join(', ') : opponent.artist}
              </p>
            </div>
          </div>

          <div className="w-full py-2.5 px-4 rounded-xl bg-slate-800 group-hover:bg-slate-700 text-slate-300 group-hover:text-white font-semibold text-sm text-center transition-all border border-slate-700">
            Prefer {opponent.title} 👍
          </div>
        </button>
      </div>

      {/* Footer controls */}
      <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <button
          type="button"
          onClick={handleSkipOrEven}
          className="hover:text-white transition-colors cursor-pointer"
        >
          They are about equal (Tie)
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
          >
            Switch to Manual Rating
          </button>
        )}
      </div>
    </div>
  )
}
