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
    <div className="space-y-6">
      {/* Studio Header & Surprise Me Button */}
      <div className="bg-[#F5F1E9] border border-[#E3DCCE] rounded-2xl p-6 shadow-xs">
        <div className="max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-semibold text-stone-900 tracking-tight">
            Suggestions
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            Albums recommended based on your ratings and favorite genres.
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-4">
            <button
              type="button"
              onClick={handleSurpriseSpin}
              className="px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-50 font-medium text-xs transition-colors cursor-pointer"
            >
              Surprise Me
            </button>

            {hasQueue && (
              <button
                type="button"
                onClick={() => {
                  const nextOnly = !onlyQueue
                  setOnlyQueue(nextOnly)
                  handleFetch({ onlyFromQueue: nextOnly, genre: selectedGenre, mood: selectedVibe })
                }}
                className={`px-3.5 py-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                  onlyQueue
                    ? 'bg-[#EAE4D9] text-stone-900 border-[#D9D1C3]'
                    : 'bg-white text-stone-700 border-[#EAE4D9] hover:bg-[#FAF7F2]'
                }`}
              >
                {onlyQueue ? 'Queue only' : 'From queue'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Surprise Spotlight Modal / Card */}
      {surprisePick && (
        <div className="bg-white border border-stone-300 rounded-2xl p-6 shadow-xs relative animate-in fade-in duration-200">
          <button
            type="button"
            onClick={() => setSurprisePick(null)}
            className="absolute top-4 right-4 text-stone-400 hover:text-stone-800 text-xs cursor-pointer p-1"
          >
            ✕
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-5">
            {surprisePick.album.coverImageUrl ? (
              <img
                src={surprisePick.album.coverImageUrl}
                alt={surprisePick.album.title}
                className="w-24 h-24 rounded-xl object-cover border border-[#EAE4D9] flex-shrink-0"
              />
            ) : (
              <div className="w-24 h-24 rounded-xl bg-[#EAE4D9] flex items-center justify-center text-stone-700 text-2xl font-bold flex-shrink-0">
                {surprisePick.album.title.charAt(0)}
              </div>
            )}
            <div className="flex-1 text-center sm:text-left space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
                Random Pick
              </span>
              <h3 className="text-xl font-bold text-stone-900">{surprisePick.album.title}</h3>
              <p className="text-xs text-stone-600 font-medium">
                {Array.isArray(surprisePick.album.artist)
                  ? surprisePick.album.artist.join(', ')
                  : surprisePick.album.artist}
              </p>
              <p className="text-xs text-stone-500 pt-0.5">{surprisePick.matchReason}</p>

              <div className="flex items-center gap-2 justify-center sm:justify-start pt-2">
                <Link
                  href={`/albums/${surprisePick.album.id}`}
                  className="px-3.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-50 font-medium text-xs transition-colors"
                >
                  View Album
                </Link>
                <button
                  type="button"
                  onClick={handleSurpriseSpin}
                  className="px-3 py-1.5 rounded-lg bg-[#F5F1E9] hover:bg-[#EAE4D9] text-stone-700 text-xs font-medium border border-[#EAE4D9] transition-colors cursor-pointer"
                >
                  Spin Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mood / Vibe Filter Selector */}
      <div className="bg-white border border-[#EAE4D9] rounded-2xl p-5 shadow-xs space-y-3">
        <div>
          <label className="block text-xs font-medium text-stone-700 mb-2">
            Mood
          </label>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => {
                setSelectedVibe('')
                handleFetch({ mood: undefined, genre: selectedGenre, onlyFromQueue: onlyQueue })
              }}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                selectedVibe === ''
                  ? 'bg-stone-900 text-stone-50 border-stone-900'
                  : 'bg-[#FAF7F2] text-stone-600 border-[#EAE4D9] hover:text-stone-900'
              }`}
            >
              All
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
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                    isSelected
                      ? 'bg-stone-900 text-stone-50 border-stone-900'
                      : 'bg-[#FAF7F2] text-stone-600 border-[#EAE4D9] hover:border-stone-400 hover:text-stone-900'
                  }`}
                >
                  {vibe}
                </button>
              )
            })}
          </div>
        </div>

        <div className="pt-2 border-t border-[#EAE4D9]">
          <label className="block text-xs font-medium text-stone-700 mb-2">
            Genre
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
                    ? 'bg-stone-900 text-stone-50 border-stone-900'
                    : 'bg-[#FAF7F2] text-stone-600 border-[#EAE4D9] hover:text-stone-900'
                }`}
              >
                {g === 'ALL' ? 'All' : g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Suggestions Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-stone-900">Recommended</h2>
          <span className="text-xs text-stone-400 font-mono">
            {suggestions.length}
          </span>
        </div>

        {isLoading ? (
          <div className="text-center py-12 bg-white border border-[#EAE4D9] rounded-2xl">
            <div className="w-5 h-5 border-2 border-stone-800 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-stone-400 text-xs">Finding matches...</p>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-12 bg-white border border-[#EAE4D9] rounded-2xl p-6">
            <p className="text-stone-700 font-medium text-sm">No recommendations found</p>
            <p className="text-stone-400 text-xs mt-1">Try another filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {suggestions.map((item) => {
              const tier = item.album.averageRating
                ? getTierFromScore(item.album.averageRating)
                : null

              return (
                <div
                  key={item.album.id}
                  className="bg-white border border-[#EAE4D9] hover:border-stone-400 rounded-xl p-4 transition-all shadow-xs flex flex-col justify-between"
                >
                  <div>
                    {/* Top match score row */}
                    <div className="flex items-center justify-between mb-2.5 text-xs">
                      <span className="text-stone-600 font-medium text-[11px]">
                        {item.matchScore}% match
                      </span>
                      {tier && item.album.averageRating !== undefined && (
                        <span className="text-[11px] text-stone-500 font-medium">
                          ★ {item.album.averageRating.toFixed(1)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-start space-x-3.5">
                      <Link href={`/albums/${item.album.id}`} className="flex-shrink-0">
                        {item.album.coverImageUrl ? (
                          <img
                            src={item.album.coverImageUrl}
                            alt={item.album.title}
                            className="w-16 h-16 rounded-lg object-cover border border-[#EAE4D9]"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-[#EAE4D9] text-stone-700 flex items-center justify-center font-bold text-xl">
                            {item.album.title.charAt(0)}
                          </div>
                        )}
                      </Link>

                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/albums/${item.album.id}`}
                          className="text-sm font-semibold text-stone-900 hover:text-stone-600 transition-colors block truncate"
                        >
                          {item.album.title}
                        </Link>
                        <p className="text-xs text-stone-500 truncate mt-0.5">
                          {Array.isArray(item.album.artist)
                            ? item.album.artist.join(', ')
                            : item.album.artist}
                        </p>

                        <p className="text-xs text-stone-500 mt-1.5 line-clamp-1">
                          {item.matchReason}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action link */}
                  <div className="pt-3 mt-3 border-t border-[#F0EAE1] flex items-center justify-end">
                    <Link
                      href={`/albums/${item.album.id}`}
                      className="text-xs font-medium text-stone-700 hover:text-stone-900"
                    >
                      Rate album →
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
