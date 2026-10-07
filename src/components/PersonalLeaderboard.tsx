'use client'

import { useState } from 'react'
import Link from 'next/link'
import { reorderUserRankedReviews, deleteReview } from '@/app/actions/reviews'
import { getTierFromScore, BELI_TIERS, calculateScoreFromRankPlacement } from '@/lib/beli'

export interface RankedAlbumItem {
  id: string // reviewId
  albumId: string
  rating: number // score
  rank: number | null
  tier: string | null
  favoriteTracks: string[]
  skipTrack: string | null
  vibes: string[]
  listenAgain: string | null
  listenedWith: string | null
  reviewText: string | null
  createdAt: Date | string
  album: {
    id: string
    title: string
    artist: string[]
    coverImageUrl: string | null
    genres: string[]
    releaseYear?: number | null
  }
}

interface PersonalLeaderboardProps {
  initialReviews: RankedAlbumItem[]
}

export default function PersonalLeaderboard({ initialReviews }: PersonalLeaderboardProps) {
  const [reviews, setReviews] = useState<RankedAlbumItem[]>(initialReviews)
  const [selectedTierFilter, setSelectedTierFilter] = useState<string>('ALL')
  const [search, setSearch] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  // Move album up in rank
  const handleMove = async (index: number, direction: 'UP' | 'DOWN') => {
    if (direction === 'UP' && index === 0) return
    if (direction === 'DOWN' && index === reviews.length - 1) return

    const newReviews = [...reviews]
    const targetIndex = direction === 'UP' ? index - 1 : index + 1
    const [movedItem] = newReviews.splice(index, 1)
    newReviews.splice(targetIndex, 0, movedItem)

    // Calculate updated rank and recalculate rating/tier for moved item based on new neighbors
    const otherScores = newReviews
      .filter((_, idx) => idx !== targetIndex)
      .map((r) => r.rating)
    const newScore = calculateScoreFromRankPlacement(targetIndex + 1, otherScores)
    const newTier = getTierFromScore(newScore).tier

    const updated = newReviews.map((item, idx) => {
      if (idx === targetIndex) {
        return {
          ...item,
          rank: idx + 1,
          rating: newScore,
          tier: newTier,
        }
      }
      return {
        ...item,
        rank: idx + 1,
      }
    })

    setReviews(updated)
    setIsUpdating(true)
    const res = await reorderUserRankedReviews(updated.map((r) => r.id))
    if (res.success && res.reviews) {
      setReviews((res.reviews as unknown) as RankedAlbumItem[])
    }
    setIsUpdating(false)
  }

  const handleDelete = async (reviewId: string, albumId: string) => {
    if (!confirm('Remove this album from your personal leaderboard?')) return

    const remaining = reviews.filter((r) => r.id !== reviewId)
    const reordered = remaining.map((r, i) => ({ ...r, rank: i + 1 }))
    setReviews(reordered)

    await deleteReview(reviewId, albumId)
  }

  // Filtered views
  const filtered = reviews.filter((r) => {
    if (selectedTierFilter !== 'ALL') {
      const tierInfo = getTierFromScore(r.rating)
      if (tierInfo.tier !== selectedTierFilter) return false
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      const matchTitle = r.album.title.toLowerCase().includes(q)
      const matchArtist = r.album.artist.some((a) => a.toLowerCase().includes(q))
      if (!matchTitle && !matchArtist) return false
    }
    return true
  })

  if (reviews.length === 0) {
    return (
      <div className="text-center py-16 bg-white border border-[#EAE4D9] rounded-2xl p-8">
        <p className="text-stone-900 font-medium text-sm">No albums ranked yet</p>
        <p className="text-stone-500 text-xs mt-1 mb-5">
          Rate albums to build your personal leaderboard.
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-50 text-xs font-medium transition-colors"
        >
          Discover Albums
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filtering & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ranked albums..."
            className="w-full px-3 py-1.5 bg-white border border-[#D9D1C3] rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-400 placeholder-stone-400"
          />
        </div>

        {/* Tier Filter Chips */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
          <button
            type="button"
            onClick={() => setSelectedTierFilter('ALL')}
            className={`px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer border ${
              selectedTierFilter === 'ALL'
                ? 'bg-stone-900 text-stone-50 border-stone-900 font-medium'
                : 'bg-white text-stone-600 border-[#DDD5C7] hover:border-stone-400'
            }`}
          >
            All ({reviews.length})
          </button>
          {Object.values(BELI_TIERS).map((t) => {
            const count = reviews.filter((r) => getTierFromScore(r.rating).tier === t.tier).length
            if (count === 0) return null
            const isSelected = selectedTierFilter === t.tier
            return (
              <button
                key={t.tier}
                type="button"
                onClick={() => setSelectedTierFilter(t.tier)}
                className={`px-2 py-1 rounded-md text-xs transition-colors cursor-pointer border ${
                  isSelected
                    ? 'bg-stone-900 text-stone-50 border-stone-900 font-medium'
                    : 'bg-white text-stone-600 border-[#DDD5C7] hover:border-stone-400'
                }`}
              >
                {t.label} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="space-y-2">
        {filtered.map((item, index) => {
          const tier = getTierFromScore(item.rating)
          const actualRank = item.rank ?? index + 1

          return (
            <div
              key={item.id}
              className="group bg-white border border-[#EAE4D9] hover:border-stone-400 rounded-xl p-3 transition-colors flex items-center gap-3"
            >
              {/* Rank */}
              <div className="flex-shrink-0 w-7 text-center font-mono font-medium text-xs text-stone-400">
                {actualRank}
              </div>

              {/* Album Artwork */}
              <Link href={`/albums/${item.album.id}`} className="flex-shrink-0">
                {item.album.coverImageUrl ? (
                  <img
                    src={item.album.coverImageUrl}
                    alt={item.album.title}
                    className="w-12 h-12 rounded-lg object-cover border border-[#EAE4D9]"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-[#EAE4D9] text-stone-700 flex items-center justify-center text-sm font-medium">
                    {item.album.title.charAt(0)}
                  </div>
                )}
              </Link>

              {/* Album info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-1.5">
                  <Link
                    href={`/albums/${item.album.id}`}
                    className="text-xs font-medium text-stone-900 hover:text-stone-600 transition-colors truncate"
                  >
                    {item.album.title}
                  </Link>
                  {item.album.releaseYear && (
                    <span className="text-[11px] font-mono text-stone-400">
                      ({item.album.releaseYear})
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-stone-500 truncate">
                  {Array.isArray(item.album.artist)
                    ? item.album.artist.join(', ')
                    : item.album.artist}
                </p>

                {item.favoriteTracks && item.favoriteTracks.length > 0 && (
                  <div className="mt-1">
                    <span className="text-[10px] text-stone-500">
                      ★ {item.favoriteTracks[0]}
                      {item.favoriteTracks.length > 1 && ` +${item.favoriteTracks.length - 1}`}
                    </span>
                  </div>
                )}
              </div>

              {/* Score & Tier */}
              <div className="flex-shrink-0 text-right">
                <span className="text-base font-semibold text-stone-900">{item.rating.toFixed(1)}</span>
                <span className="text-[10px] text-stone-400 font-mono ml-0.5">/10</span>
                <div className="text-[10px] text-stone-500 font-medium">
                  {tier.label}
                </div>
              </div>

              {/* Order Controls */}
              <div className="flex-shrink-0 flex flex-col items-center space-y-0.5 pl-1.5 border-l border-[#F0EAE1]">
                <button
                  type="button"
                  onClick={() => handleMove(index, 'UP')}
                  disabled={index === 0 || isUpdating}
                  title="Move up"
                  className="w-5 h-5 rounded hover:bg-[#FAF7F2] text-stone-400 hover:text-stone-900 flex items-center justify-center text-[10px] disabled:opacity-20 cursor-pointer"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => handleMove(index, 'DOWN')}
                  disabled={index === reviews.length - 1 || isUpdating}
                  title="Move down"
                  className="w-5 h-5 rounded hover:bg-[#FAF7F2] text-stone-400 hover:text-stone-900 flex items-center justify-center text-[10px] disabled:opacity-20 cursor-pointer"
                >
                  ▼
                </button>
              </div>

              {/* Delete button */}
              <button
                type="button"
                onClick={() => handleDelete(item.id, item.albumId)}
                title="Remove"
                className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-stone-700 text-xs px-1 transition-opacity cursor-pointer"
              >
                ✕
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
