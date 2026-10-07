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
    <div className="space-y-6">
      {/* Profile Header & Taste Stats */}
      <div className="bg-white border border-[#EAE4D9] rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar */}
          {user.image ? (
            <img
              src={user.image}
              alt={user.name || 'User'}
              className="h-20 w-20 rounded-xl object-cover border border-[#EAE4D9]"
            />
          ) : (
            <div className="h-20 w-20 rounded-xl bg-[#EAE4D9] text-stone-700 flex items-center justify-center text-2xl font-bold">
              {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
            </div>
          )}

          {/* User Details & Badges */}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900">{user.name || user.email.split('@')[0]}</h1>
            <p className="text-xs text-stone-400 mt-0.5">{user.email}</p>

            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
              <div className="bg-[#FAF7F2] border border-[#EAE4D9] rounded-lg p-2.5 text-center sm:text-left">
                <span className="text-[10px] font-medium uppercase tracking-wider text-stone-400 block">
                  Ranked
                </span>
                <span className="text-lg font-bold text-stone-900">{totalRanked}</span>
              </div>

              <div className="bg-[#FAF7F2] border border-[#EAE4D9] rounded-lg p-2.5 text-center sm:text-left">
                <span className="text-[10px] font-medium uppercase tracking-wider text-stone-400 block">
                  Average
                </span>
                <span className="text-lg font-bold text-stone-900">★ {avgScore}</span>
              </div>

              <div className="bg-[#FAF7F2] border border-[#EAE4D9] rounded-lg p-2.5 text-center sm:text-left">
                <span className="text-[10px] font-medium uppercase tracking-wider text-stone-400 block">
                  Top Genre
                </span>
                <span className="text-sm font-semibold text-stone-800 truncate block">{topGenre}</span>
              </div>

              <div className="bg-[#FAF7F2] border border-[#EAE4D9] rounded-lg p-2.5 text-center sm:text-left">
                <span className="text-[10px] font-medium uppercase tracking-wider text-stone-400 block">
                  Queue
                </span>
                <span className="text-lg font-bold text-stone-900">{wantToListenItems.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-[#EAE4D9] space-x-1 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('LEADERBOARD')}
          className={`pb-3 px-3.5 font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'LEADERBOARD'
              ? 'border-stone-900 text-stone-900 font-semibold'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          Leaderboard ({totalRanked})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('QUEUE')}
          className={`pb-3 px-3.5 font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'QUEUE'
              ? 'border-stone-900 text-stone-900 font-semibold'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          Queue ({wantToListenItems.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('STATS')}
          className={`pb-3 px-3.5 font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'STATS'
              ? 'border-stone-900 text-stone-900 font-semibold'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          Tiers
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
        <div className="bg-white border border-[#EAE4D9] rounded-2xl p-6 space-y-5 shadow-xs">
          <h3 className="text-sm font-semibold text-stone-900">Score Distribution</h3>

          {totalRanked === 0 ? (
            <p className="text-stone-400 text-xs">No albums rated yet.</p>
          ) : (
            <div className="space-y-2.5">
              {Object.values(BELI_TIERS).map((tier) => {
                const count = rankedReviews.filter(
                  (r) => getTierFromScore(r.rating).tier === tier.tier
                ).length
                const percent = totalRanked > 0 ? ((count / totalRanked) * 100).toFixed(0) : '0'

                return (
                  <div key={tier.tier} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className={`font-medium ${tier.textColor}`}>
                        ★ {tier.label}
                      </span>
                      <span className="text-stone-400 font-mono text-[11px]">
                        {count} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#F3EDE2] rounded-full overflow-hidden border border-[#E5DEC7]">
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
          {Object.keys(genreCounts).length > 0 && (
            <div className="pt-4 border-t border-[#EAE4D9]">
              <h4 className="text-xs font-semibold text-stone-700 mb-2.5">Genres</h4>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(genreCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([genre, count]) => (
                    <div
                      key={genre}
                      className="px-2.5 py-1 rounded-lg bg-[#FAF7F2] border border-[#EAE4D9] flex items-center space-x-1.5 text-xs"
                    >
                      <span className="text-stone-700 font-medium">{genre}</span>
                      <span className="text-stone-400 font-mono text-[11px]">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
