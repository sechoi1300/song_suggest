'use client'

import { useState } from 'react'
import Link from 'next/link'
import { getAlbumSuggestions, AlbumSuggestion, SuggestionCriteria } from '@/app/actions/suggest'
import { getTierFromScore, BELI_VIBES } from '@/lib/beli'
import { toggleWantToListen } from '@/app/actions/wantToListen'

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
      <div className="relative bg-gradient-to-r from-violet-900/40 via-indigo-900/30 to-fuchsia-900/30 border border-violet-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden backdrop-blur-xl">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 text-xs font-semibold mb-3 border border-violet-500/30">
            <span>✨ AI & Taste-Profile Music Matchmaker</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Album Suggestion Engine
          </h1>
          <p className="text-slate-300 text-sm mt-2 leading-relaxed">
            Personalized album discovery modeled on your highest-rated albums, standout genres, and Beli leaderboard tastes.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              type="button"
              onClick={handleSurpriseSpin}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold text-sm shadow-lg shadow-violet-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center space-x-2"
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
                className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  onlyQueue
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
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
        <div className="bg-slate-900 border-2 border-violet-500/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative animate-in fade-in slide-in-from-top-4 duration-300">
          <button
            type="button"
            onClick={() => setSurprisePick(null)}
            className="absolute top-4 right-4 text-slate-400 hover:text-white text-sm cursor-pointer p-1"
          >
            ✕ Close
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <img
              src={surprisePick.album.coverImageUrl}
              alt={surprisePick.album.title}
              className="w-32 h-32 rounded-2xl object-cover shadow-2xl border border-slate-700 flex-shrink-0"
            />
            <div className="flex-1 text-center sm:text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-400">
                Your Chosen Listen for Today
              </span>
              <h3 className="text-2xl font-black text-white mt-1">{surprisePick.album.title}</h3>
              <p className="text-sm text-violet-300 font-medium">
                {Array.isArray(surprisePick.album.artist)
                  ? surprisePick.album.artist.join(', ')
                  : surprisePick.album.artist}
              </p>
              <p className="text-xs text-slate-400 mt-2">{surprisePick.matchReason}</p>

              <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-4">
                <Link
                  href={`/albums/${surprisePick.album.id}`}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Listen, Rate & Rank Now 🎧
                </Link>
                <button
                  type="button"
                  onClick={handleSurpriseSpin}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
                >
                  Spin Again 🎲
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mood / Vibe Filter Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Filter by Mood or Setting
        </label>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => {
              setSelectedVibe('')
              handleFetch({ mood: undefined, genre: selectedGenre, onlyFromQueue: onlyQueue })
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
              selectedVibe === ''
                ? 'bg-violet-600 text-white border-violet-500 shadow-sm shadow-violet-600/30'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
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
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-fuchsia-600 text-white border-fuchsia-500 shadow-sm shadow-fuchsia-600/30'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                #{vibe}
              </button>
            )
          })}
        </div>
      </div>

      {/* Suggestions Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black text-white">Recommended For You</h2>
          <span className="text-xs text-slate-500 font-mono">
            {suggestions.length} recommendations generated
          </span>
        </div>

        {isLoading ? (
          <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-3xl">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Matching against your taste profile...</p>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-3xl p-8">
            <span className="text-4xl mb-2 block">🎵</span>
            <p className="text-slate-300 font-bold">No recommendations found for this filter</p>
            <p className="text-slate-500 text-xs mt-1">Try selecting a different vibe or clearing filters.</p>
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
                  className="group bg-slate-900 border border-slate-800 hover:border-violet-500/50 rounded-2xl p-5 transition-all shadow-lg hover:shadow-violet-500/10 flex flex-col justify-between"
                >
                  <div>
                    {/* Top match score row */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-1.5 text-xs font-bold text-violet-300 bg-violet-600/20 px-2.5 py-0.5 rounded-full border border-violet-500/30">
                        <span>⚡ {item.matchScore}% Match</span>
                      </div>
                      {tier && (
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
                            className="w-20 h-20 rounded-xl object-cover shadow-md border border-slate-700/60 group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white text-2xl font-bold">
                            {item.album.title.charAt(0)}
                          </div>
                        )}
                      </Link>

                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/albums/${item.album.id}`}
                          className="text-base font-bold text-white hover:text-violet-300 transition-colors block truncate"
                        >
                          {item.album.title}
                        </Link>
                        <p className="text-xs text-slate-400 font-medium truncate">
                          {Array.isArray(item.album.artist)
                            ? item.album.artist.join(', ')
                            : item.album.artist}
                        </p>

                        <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                          💡 {item.matchReason}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1">
                      {item.album.genres?.slice(0, 2).map((g: string) => (
                        <span
                          key={g}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-slate-950 text-slate-400 border border-slate-800"
                        >
                          {g}
                        </span>
                      ))}
                    </div>

                    <Link
                      href={`/albums/${item.album.id}`}
                      className="px-3.5 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600 text-violet-300 hover:text-white border border-violet-500/30 text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
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
