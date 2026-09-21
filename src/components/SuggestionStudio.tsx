'use client'

import { useState } from 'react'
import Link from 'next/link'
import { getAlbumSuggestions, AlbumSuggestion, SuggestionCriteria } from '@/app/actions/suggest'
import { getTierFromScore, BELI_VIBES } from '@/lib/beli'

interface SuggestionStudioProps {
  initialSuggestions: AlbumSuggestion[]
  hasQueue: boolean
}

export default function SuggestionStudio({
  initialSuggestions,
  hasQueue,
}: SuggestionStudioProps) {
  const [suggestions, setSuggestions] = useState<AlbumSuggestion[]>(initialSuggestions)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedVibe, setSelectedVibe] = useState<string>('')
  const [onlyQueue, setOnlyQueue] = useState(false)
  const [selectedGenre, setSelectedGenre] = useState('ALL')
  const [surprisePick, setSurprisePick] = useState<AlbumSuggestion | null>(null)

  const handleFetch = async (newCriteria: SuggestionCriteria) => {
    setIsLoading(true)
    const results = await getAlbumSuggestions(newCriteria)
    setSuggestions(results)
    setIsLoading(false)
  }

  const handleSurpriseSpin = () => {
    if (suggestions.length === 0) return
    const randomPick = suggestions[Math.floor(Math.random() * suggestions.length)]
    setSurprisePick(randomPick)
  }

  return (
    <div className="space-y-8">
      {/* Studio Header & Surprise Me Button */}
      <div className="relative bg-[#F5F1E9] border border-[#E3DCCE] rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#EAE4D9] text-stone-800 text-xs font-medium mb-3 border border-[#D9D1C3]">
            <span>✨ AI & Taste-Profile Music Matchmaker</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">
            Album Suggestion Engine
          </h1>
          <p className="text-stone-600 text-sm mt-2 leading-relaxed">
            Personalized album discovery modeled on your highest-rated albums, standout genres, and Beli leaderboard tastes.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              type="button"
              onClick={handleSurpriseSpin}
              className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-50 font-medium text-sm shadow-xs transition-colors cursor-pointer flex items-center space-x-2"
            >
              <span>🎲 Spin the Record (Surprise Me)</span>
            </button>

            {hasQueue && (
              <button
                type="button"
                onClick={() => {
                  const nextOnly = !onlyQueue
                  setOnlyQueue(nextOnly)
                  handleFetch({ onlyFromQueue: nextOnly, genre: selectedGenre, mood: selectedVibe })
                }}
                className={`px-4 py-2.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                  onlyQueue
                    ? 'bg-[#EAE4D9] text-stone-900 border-[#D9D1C3]'
                    : 'bg-white text-stone-700 border-[#EAE4D9] hover:bg-[#FAF7F2]'
                }`}
              >
                <span>{onlyQueue ? '✓ Queue Only Active' : '🔖 Pick from my Queue'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Surprise Spotlight Modal / Card */}
      {surprisePick && (
        <div className="bg-white border-2 border-stone-800 rounded-3xl p-6 sm:p-8 shadow-md relative animate-in fade-in slide-in-from-top-4 duration-300">
          <button
            type="button"
            onClick={() => setSurprisePick(null)}
            className="absolute top-4 right-4 text-stone-400 hover:text-stone-900 text-sm cursor-pointer p-1"
          >
            ✕ Close
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            {surprisePick.album.coverImageUrl ? (
              <img
                src={surprisePick.album.coverImageUrl}
                alt={surprisePick.album.title}
                className="w-32 h-32 rounded-2xl object-cover shadow-sm border border-[#EAE4D9] flex-shrink-0"
              />
            ) : (
              <div className="w-32 h-32 rounded-2xl bg-[#EAE4D9] flex items-center justify-center text-stone-700 text-3xl font-bold flex-shrink-0">
                {surprisePick.album.title.charAt(0)}
              </div>
            )}
            <div className="flex-1 text-center sm:text-left">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Your Chosen Listen for Today
              </span>
              <h3 className="text-2xl font-black text-stone-900 mt-1">{surprisePick.album.title}</h3>
              <p className="text-sm text-stone-600 font-medium">
                {Array.isArray(surprisePick.album.artist)
                  ? surprisePick.album.artist.join(', ')
                  : surprisePick.album.artist}
              </p>
              <p className="text-xs text-stone-500 mt-2">{surprisePick.matchReason}</p>

              <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-4">
                <Link
                  href={`/albums/${surprisePick.album.id}`}
                  className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-50 font-medium text-xs shadow-xs transition-colors cursor-pointer"
                >
                  Listen, Rate & Rank Now 🎧
                </Link>
                <button
                  type="button"
                  onClick={handleSurpriseSpin}
                  className="px-4 py-2 rounded-xl bg-[#F5F1E9] hover:bg-[#EAE4D9] text-stone-800 text-xs font-medium border border-[#EAE4D9] transition-colors cursor-pointer"
                >
                  Spin Again 🎲
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mood / Vibe Filter Selector */}
      <div className="bg-white border border-[#EAE4D9] rounded-2xl p-5 shadow-xs">
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">
          Filter by Mood or Setting
        </label>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => {
              setSelectedVibe('')
              handleFetch({ mood: undefined, genre: selectedGenre, onlyFromQueue: onlyQueue })
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer border ${
              selectedVibe === ''
                ? 'bg-stone-900 text-stone-50 border-stone-900 shadow-xs'
                : 'bg-[#FAF7F2] text-stone-600 border-[#EAE4D9] hover:text-stone-900'
            }`}
          >
            All Vibes
          </button>
          {BELI_VIBES.map((vibe) => {
            const isSelected = selectedVibe === vibe
            return (
              <button
                key={vibe}
                type="button"
                onClick={() => {
                  setSelectedVibe(vibe)
                  handleFetch({ mood: vibe, genre: selectedGenre, onlyFromQueue: onlyQueue })
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer border ${
                  isSelected
                    ? 'bg-stone-900 text-stone-50 border-stone-900 shadow-xs'
                    : 'bg-[#FAF7F2] text-stone-600 border-[#EAE4D9] hover:border-stone-400 hover:text-stone-900'
                }`}
              >
                #{vibe}
              </button>
            )
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-[#EAE4D9]">
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
            Filter by Genre
          </label>
          <div className="flex flex-wrap gap-1.5">
            {['ALL', 'Hip Hop', 'R&B', 'Rock', 'Electronic', 'Pop'].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => {
                  setSelectedGenre(g)
                  handleFetch({ mood: selectedVibe || undefined, genre: g, onlyFromQueue: onlyQueue })
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                  selectedGenre === g
                    ? 'bg-stone-900 text-stone-50 border-stone-900 shadow-xs'
                    : 'bg-[#FAF7F2] text-stone-600 border-[#EAE4D9] hover:text-stone-900'
                }`}
              >
                {g === 'ALL' ? 'All Genres' : g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Suggestions Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black text-stone-900">Recommended For You</h2>
          <span className="text-xs text-stone-400 font-mono">
            {suggestions.length} recommendations generated
          </span>
        </div>

        {isLoading ? (
          <div className="text-center py-16 bg-white border border-[#EAE4D9] rounded-3xl">
            <div className="w-8 h-8 border-2 border-stone-800 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-stone-500 text-sm">Matching against your taste profile...</p>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-16 bg-white border border-[#EAE4D9] rounded-3xl p-8">
            <span className="text-4xl mb-2 block">🎵</span>
            <p className="text-stone-800 font-bold">No recommendations found for this filter</p>
            <p className="text-stone-500 text-xs mt-1">Try selecting a different vibe or clearing filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestions.map((item) => {
              const tier = item.album.averageRating
                ? getTierFromScore(item.album.averageRating)
                : null

              return (
                <div
                  key={item.album.id}
                  className="group bg-white border border-[#EAE4D9] hover:border-stone-400 rounded-2xl p-5 transition-all shadow-xs hover:shadow-md flex flex-col justify-between"
                >
                  <div>
                    {/* Top match score row */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-1.5 text-xs font-semibold text-stone-800 bg-[#F4EFE6] px-2.5 py-0.5 rounded-full border border-[#E5DEC7]">
                        <span>⚡ {item.matchScore}% Match</span>
                      </div>
                      {tier && item.album.averageRating !== undefined && (
                        <div
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${tier.badgeBg} ${tier.borderColor} ${tier.textColor}`}
                        >
                          ★ {item.album.averageRating.toFixed(1)} {tier.label}
                        </div>
                      )}
                    </div>

                    <div className="flex items-start space-x-4">
                      <Link href={`/albums/${item.album.id}`} className="flex-shrink-0">
                        {item.album.coverImageUrl ? (
                          <img
                            src={item.album.coverImageUrl}
                            alt={item.album.title}
                            className="w-20 h-20 rounded-xl object-cover shadow-xs border border-[#EAE4D9] group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-xl bg-[#EAE4D9] text-stone-700 flex items-center justify-center text-2xl font-bold">
                            {item.album.title.charAt(0)}
                          </div>
                        )}
                      </Link>

                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/albums/${item.album.id}`}
                          className="text-base font-bold text-stone-900 hover:text-stone-700 transition-colors block truncate"
                        >
                          {item.album.title}
                        </Link>
                        <p className="text-xs text-stone-500 font-medium truncate">
                          {Array.isArray(item.album.artist)
                            ? item.album.artist.join(', ')
                            : item.album.artist}
                        </p>

                        <p className="text-xs text-stone-600 mt-2 line-clamp-2 leading-relaxed">
                          💡 {item.matchReason}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="pt-4 mt-4 border-t border-[#F0EAE1] flex items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1">
                      {item.album.genres?.slice(0, 2).map((g: string) => (
                        <span
                          key={g}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-[#FAF7F2] text-stone-600 border border-[#EAE4D9]"
                        >
                          {g}
                        </span>
                      ))}
                    </div>

                    <Link
                      href={`/albums/${item.album.id}`}
                      className="px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-50 text-xs font-medium transition-colors shadow-xs cursor-pointer whitespace-nowrap"
                    >
                      Rate & Rank 🎧
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
