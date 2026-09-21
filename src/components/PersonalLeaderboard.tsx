'use client'

import { useState } from 'react'
import Link from 'next/link'
import { reorderUserRankedReviews, deleteReview } from '@/app/actions/reviews'
import { getTierFromScore, BELI_TIERS } from '@/lib/beli'

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

    // Re-assign ranks 1..N
    const updated = newReviews.map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }))

    setReviews(updated)
    setIsUpdating(true)
    await reorderUserRankedReviews(updated.map((r) => r.id))
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
      <div className="text-center py-16 bg-white border border-[#EAE4D9] rounded-3xl p-8 shadow-xs">
        <span className="text-5xl mb-3 block">🏆</span>
        <h3 className="text-xl font-bold text-stone-900 mb-2">No albums ranked yet</h3>
        <p className="text-stone-600 text-sm max-w-md mx-auto mb-6">
          Your personal Beli leaderboard is empty. Explore albums, rate them with Head-to-Head matchups, and watch your leaderboard come alive!
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-50 font-medium text-sm shadow-xs transition-colors cursor-pointer"
        >
          Discover & Rank Albums
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtering & Search Bar */}
      <div className="bg-[#F5F1E9] border border-[#E3DCCE] rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-3 flex items-center text-stone-400 text-xs">
            🔍
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your ranked albums..."
            className="w-full pl-8 pr-3 py-2 bg-white border border-[#D9D1C3] rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-400 placeholder-stone-400"
          />
        </div>

        {/* Tier Filter Chips */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedTierFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
              selectedTierFilter === 'ALL'
                ? 'bg-stone-900 text-stone-50 border-stone-900'
                : 'bg-white text-stone-600 border-[#DDD5C7] hover:text-stone-900'
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
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
                  isSelected
                    ? `${t.badgeBg} ${t.textColor} ${t.borderColor}`
                    : 'bg-white text-stone-600 border-[#DDD5C7] hover:text-stone-900'
                }`}
              >
                ★ {t.label} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="space-y-3">
        {filtered.map((item, index) => {
          const tier = getTierFromScore(item.rating)
          const actualRank = item.rank ?? index + 1

          // Rank styling medal badges
          let rankBadge = (
            <span className="font-mono text-stone-500 font-bold text-sm">#{actualRank}</span>
          )
          if (actualRank === 1) {
            rankBadge = (
              <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center font-black text-xs shadow-xs">
                🥇 1
              </span>
            )
          } else if (actualRank === 2) {
            rankBadge = (
              <span className="w-8 h-8 rounded-full bg-[#EAE4D9] text-stone-800 border border-[#D9D1C3] flex items-center justify-center font-black text-xs shadow-xs">
                🥈 2
              </span>
            )
          } else if (actualRank === 3) {
            rankBadge = (
              <span className="w-8 h-8 rounded-full bg-[#F3EDE2] text-[#615243] border border-[#E0D7C9] flex items-center justify-center font-black text-xs shadow-xs">
                🥉 3
              </span>
            )
          }

          return (
            <div
              key={item.id}
              className="group bg-white border border-[#EAE4D9] hover:border-stone-400 rounded-2xl p-4 transition-all flex items-center gap-4 shadow-xs"
            >
              {/* Rank Badge */}
              <div className="flex-shrink-0 w-9 flex items-center justify-center">
                {rankBadge}
              </div>

              {/* Album Artwork */}
              <Link href={`/albums/${item.album.id}`} className="flex-shrink-0">
                {item.album.coverImageUrl ? (
                  <img
                    src={item.album.coverImageUrl}
                    alt={item.album.title}
                    className="w-16 h-16 rounded-xl object-cover shadow-xs border border-[#EAE4D9] group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-[#EAE4D9] text-stone-700 flex items-center justify-center text-xl font-bold">
                    {item.album.title.charAt(0)}
                  </div>
                )}
              </Link>

              {/* Album info & Beli metadata */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/albums/${item.album.id}`}
                    className="text-base font-bold text-stone-900 hover:text-stone-700 transition-colors truncate"
                  >
                    {item.album.title}
                  </Link>
                  {item.album.releaseYear && (
                    <span className="text-[11px] font-mono text-stone-400">
                      ({item.album.releaseYear})
                    </span>
                  )}
                </div>

                <p className="text-xs text-stone-500 truncate">
                  {Array.isArray(item.album.artist)
                    ? item.album.artist.join(', ')
                    : item.album.artist}
                </p>

                {/* Standout tracks & vibes */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  {item.favoriteTracks && item.favoriteTracks.length > 0 && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-[#F4EFE6] text-stone-800 border border-[#E5DEC7]">
                      ★ {item.favoriteTracks[0]}
                      {item.favoriteTracks.length > 1 && ` +${item.favoriteTracks.length - 1}`}
                    </span>
                  )}

                  {item.vibes && item.vibes.length > 0 && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#FAF7F2] text-stone-600 border border-[#EAE4D9]">
                      #{item.vibes[0]}
                    </span>
                  )}

                  {item.listenedWith && (
                    <span className="text-[10px] text-stone-400 hidden sm:inline">
                      {item.listenedWith}
                    </span>
                  )}
                </div>
              </div>

              {/* Beli Score & Tier */}
              <div className="flex-shrink-0 text-right pr-2">
                <div className="flex items-baseline justify-end space-x-1">
                  <span className="text-2xl font-black text-stone-900">{item.rating.toFixed(1)}</span>
                  <span className="text-xs text-stone-400 font-semibold">/10</span>
                </div>
                <div
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border mt-0.5 inline-block ${tier.badgeBg} ${tier.borderColor} ${tier.textColor}`}
                >
                  {tier.label}
                </div>
              </div>

              {/* Order Controls (Move up / down) */}
              <div className="flex-shrink-0 flex flex-col items-center space-y-1 pl-2 border-l border-[#EAE4D9]">
                <button
                  type="button"
                  onClick={() => handleMove(index, 'UP')}
                  disabled={index === 0 || isUpdating}
                  title="Move up in rank"
                  className="w-7 h-7 rounded-lg bg-[#FAF7F2] hover:bg-[#EAE4D9] text-stone-600 hover:text-stone-900 border border-[#EAE4D9] flex items-center justify-center text-xs disabled:opacity-30 cursor-pointer transition-colors"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => handleMove(index, 'DOWN')}
                  disabled={index === reviews.length - 1 || isUpdating}
                  title="Move down in rank"
                  className="w-7 h-7 rounded-lg bg-[#FAF7F2] hover:bg-[#EAE4D9] text-stone-600 hover:text-stone-900 border border-[#EAE4D9] flex items-center justify-center text-xs disabled:opacity-30 cursor-pointer transition-colors"
                >
                  ▼
                </button>
              </div>

              {/* Delete button */}
              <button
                type="button"
                onClick={() => handleDelete(item.id, item.albumId)}
                title="Remove from leaderboard"
                className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-rose-600 text-sm px-1 transition-opacity cursor-pointer"
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
