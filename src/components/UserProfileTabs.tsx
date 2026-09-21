'use client'

import { useState } from 'react'
import PersonalLeaderboard, { RankedAlbumItem } from './PersonalLeaderboard'
import WantToListenList, { WantToListenItem } from './WantToListenList'
import { BELI_TIERS, getTierFromScore } from '@/lib/beli'

interface UserProfileTabsProps {
  user: {
    name?: string | null
    email: string
    image?: string | null
  }
  rankedReviews: RankedAlbumItem[]
  wantToListenItems: WantToListenItem[]
}

export default function UserProfileTabs({
  user,
  rankedReviews,
  wantToListenItems,
}: UserProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<'LEADERBOARD' | 'QUEUE' | 'STATS'>('LEADERBOARD')

  // Calculate statistics
  const totalRanked = rankedReviews.length
  const avgScore =
    totalRanked > 0
      ? (
          rankedReviews.reduce((sum, r) => sum + r.rating, 0) / totalRanked
        ).toFixed(1)
      : '0.0'

  // Top genre
  const genreCounts: Record<string, number> = {}
  rankedReviews.forEach((r) => {
    r.album.genres?.forEach((g) => {
      genreCounts[g] = (genreCounts[g] || 0) + 1
    })
  })
  const topGenre =
    Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Eclectic'

  return (
    <div className="space-y-8">
      {/* Profile Header & Taste Stats */}
      <div className="relative bg-white border border-[#EAE4D9] rounded-3xl p-6 sm:p-8 shadow-xs overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          {/* Avatar */}
          {user.image ? (
            <img
              src={user.image}
              alt={user.name || 'User'}
              className="h-24 w-24 rounded-2xl object-cover border border-[#EAE4D9] shadow-xs"
            />
          ) : (
            <div className="h-24 w-24 rounded-2xl bg-[#EAE4D9] text-stone-700 flex items-center justify-center text-3xl font-bold shadow-xs">
              {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
            </div>
          )}

          {/* User Details & Badges */}
          <div className="flex-1 text-center sm:text-left">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#FAF7F2] border border-[#EAE4D9] text-stone-700 text-xs font-medium mb-2">
              <span>🎧 Beli Music Taste Profile</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900">{user.name || user.email.split('@')[0]}</h1>
            <p className="text-xs text-stone-500 mt-0.5">{user.email}</p>

            {/* Quick stats pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
              <div className="bg-[#FAF7F2] border border-[#EAE4D9] rounded-xl p-3 text-center sm:text-left">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 block">
                  Ranked Albums
                </span>
                <span className="text-xl font-black text-stone-900">{totalRanked}</span>
              </div>

              <div className="bg-[#FAF7F2] border border-[#EAE4D9] rounded-xl p-3 text-center sm:text-left">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 block">
                  Average Score
                </span>
                <span className="text-xl font-black text-stone-900">★ {avgScore}</span>
              </div>

              <div className="bg-[#FAF7F2] border border-[#EAE4D9] rounded-xl p-3 text-center sm:text-left">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 block">
                  Top Genre
                </span>
                <span className="text-base font-bold text-stone-800 truncate block">{topGenre}</span>
              </div>

              <div className="bg-[#FAF7F2] border border-[#EAE4D9] rounded-xl p-3 text-center sm:text-left">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 block">
                  Want to Listen
                </span>
                <span className="text-xl font-black text-stone-900">{wantToListenItems.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-[#EAE4D9] space-x-2">
        <button
          type="button"
          onClick={() => setActiveTab('LEADERBOARD')}
          className={`pb-4 px-4 text-sm font-medium border-b-2 transition-all cursor-pointer ${
            activeTab === 'LEADERBOARD'
              ? 'border-stone-900 text-stone-900 font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          🏆 My Ranked Leaderboard ({totalRanked})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('QUEUE')}
          className={`pb-4 px-4 text-sm font-medium border-b-2 transition-all cursor-pointer ${
            activeTab === 'QUEUE'
              ? 'border-stone-900 text-stone-900 font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          🔖 Want to Listen ({wantToListenItems.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('STATS')}
          className={`pb-4 px-4 text-sm font-medium border-b-2 transition-all cursor-pointer ${
            activeTab === 'STATS'
              ? 'border-stone-900 text-stone-900 font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          📊 Taste Breakdown
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'LEADERBOARD' && (
        <PersonalLeaderboard initialReviews={rankedReviews} />
      )}

      {activeTab === 'QUEUE' && (
        <WantToListenList initialItems={wantToListenItems} />
      )}

      {activeTab === 'STATS' && (
        <div className="bg-white border border-[#EAE4D9] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <h3 className="text-lg font-bold text-stone-900">Your Rating Tier Breakdown</h3>

          {totalRanked === 0 ? (
            <p className="text-stone-500 text-sm">No albums rated yet to generate statistics.</p>
          ) : (
            <div className="space-y-3">
              {Object.values(BELI_TIERS).map((tier) => {
                const count = rankedReviews.filter(
                  (r) => getTierFromScore(r.rating).tier === tier.tier
                ).length
                const percent = ((count / totalRanked) * 100).toFixed(0)

                return (
                  <div key={tier.tier} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className={`font-bold ${tier.textColor}`}>
                        ★ {tier.label} ({tier.sublabel})
                      </span>
                      <span className="text-stone-500 font-mono">
                        {count} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full h-3 bg-[#F3EDE2] rounded-full overflow-hidden border border-[#E5DEC7]">
                      <div
                        className={`h-full bg-gradient-to-r ${tier.color}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Top Genres Breakdown */}
          <div className="pt-6 border-t border-[#EAE4D9]">
            <h4 className="text-sm font-bold text-stone-900 mb-3">Favorite Genres</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(genreCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([genre, count]) => (
                  <div
                    key={genre}
                    className="px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#EAE4D9] flex items-center space-x-2 text-xs"
                  >
                    <span className="text-stone-700 font-medium">{genre}</span>
                    <span className="text-stone-900 font-bold">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
