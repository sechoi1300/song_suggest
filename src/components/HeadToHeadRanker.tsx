'use client'

import { useState } from 'react'
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
    <div className="bg-[#F5F1E9] border border-[#E3DCCE] rounded-2xl p-6 shadow-xs relative">
      {/* Header */}
      <div className="text-center mb-6 relative">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#EAE4D9] border border-[#D9D1C3] text-stone-800 text-xs font-medium mb-2">
          <span>⚔️ Head-to-Head Ranking</span>
          <span>•</span>
          <span>Match {round} of ~{estimatedRounds}</span>
        </div>
        <h3 className="text-2xl font-black text-stone-900 tracking-tight">
          Which album do you prefer?
        </h3>
        <p className="text-stone-600 text-sm mt-1">
          Pick your favorite to pinpoint where it slots into your personal leaderboard.
        </p>
      </div>

      {/* VS Matchup Arena */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
        {/* Left: Current New Album */}
        <button
          type="button"
          onClick={() => handleChoice('CURRENT')}
          className="group relative bg-white hover:bg-stone-50 border border-[#EAE4D9] hover:border-stone-400 rounded-2xl p-5 text-left transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] flex flex-col justify-between cursor-pointer shadow-xs"
        >
          <div className="flex items-center space-x-4 mb-4">
            {currentAlbum.coverImageUrl ? (
              <img
                src={currentAlbum.coverImageUrl}
                alt={currentAlbum.title}
                className="w-20 h-20 rounded-xl object-cover shadow-sm border border-[#EAE4D9]"
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-[#EAE4D9] flex items-center justify-center text-stone-700 text-2xl font-bold">
                {currentAlbum.title.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <span className="inline-block text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded bg-[#EAE4D9] text-stone-800 mb-1">
                New Album
              </span>
              <h4 className="text-lg font-bold text-stone-900 truncate group-hover:text-stone-700 transition-colors">
                {currentAlbum.title}
              </h4>
              <p className="text-sm text-stone-500 truncate">
                {Array.isArray(currentAlbum.artist)
                  ? currentAlbum.artist.join(', ')
                  : currentAlbum.artist}
              </p>
            </div>
          </div>

          <div className="w-full py-2.5 px-4 rounded-xl bg-stone-900 group-hover:bg-stone-800 text-stone-50 font-medium text-sm text-center transition-all shadow-xs">
            Prefer {currentAlbum.title} 👍
          </div>
        </button>

        {/* Center VS Badge */}
        <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#EAE4D9] border-2 border-white items-center justify-center font-bold text-xs text-stone-700 z-10 shadow-xs">
          VS
        </div>

        {/* Right: Existing Leaderboard Competitor */}
        <button
          type="button"
          onClick={() => handleChoice('OPPONENT')}
          className="group relative bg-white hover:bg-stone-50 border border-[#EAE4D9] hover:border-stone-400 rounded-2xl p-5 text-left transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] flex flex-col justify-between cursor-pointer shadow-xs"
        >
          <div className="flex items-center space-x-4 mb-4">
            {opponent.coverImageUrl ? (
              <img
                src={opponent.coverImageUrl}
                alt={opponent.title}
                className="w-20 h-20 rounded-xl object-cover shadow-sm border border-[#EAE4D9]"
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-[#EAE4D9] flex items-center justify-center text-stone-700 text-2xl font-bold">
                {opponent.title.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-xs font-semibold text-stone-800 bg-[#EAE4D9] px-2 py-0.5 rounded">
                  Rank #{opponent.rank}
                </span>
                <span className="text-xs font-semibold text-stone-700">
                  ★ {opponent.rating.toFixed(1)}
                </span>
              </div>
              <h4 className="text-lg font-bold text-stone-900 truncate group-hover:text-stone-700 transition-colors">
                {opponent.title}
              </h4>
              <p className="text-sm text-stone-500 truncate">
                {Array.isArray(opponent.artist) ? opponent.artist.join(', ') : opponent.artist}
              </p>
            </div>
          </div>

          <div className="w-full py-2.5 px-4 rounded-xl bg-stone-900 group-hover:bg-stone-800 text-stone-50 font-medium text-sm text-center transition-all shadow-xs">
            Prefer {opponent.title} 👍
          </div>
        </button>
      </div>

      {/* Footer controls */}
      <div className="mt-6 pt-4 border-t border-[#EAE4D9] flex items-center justify-between text-xs text-stone-500">
        <button
          type="button"
          onClick={handleSkipOrEven}
          className="hover:text-stone-900 transition-colors cursor-pointer"
        >
          They are about equal (Tie)
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
          >
            Switch to Manual Rating
          </button>
        )}
      </div>
    </div>
  )
}
