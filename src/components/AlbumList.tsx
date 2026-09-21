'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import AlbumCard from './AlbumCard'
import { AutocompleteAlbumItem, importOrGetAlbumFromApi } from '@/app/actions/albums'

interface AlbumItem {
  id: string
  title: string
  artist: string[]
  releaseDate: Date | string
  releaseYear?: number | null
  numSongs?: number | null
  genres?: string[]
  coverImageUrl?: string | null
  averageRating?: number
  reviewCount?: number
}

interface AlbumListProps {
  albums: AlbumItem[]
}

export default function AlbumList({ albums }: AlbumListProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('ALL')
  const [sortBy, setSortBy] = useState<'rating' | 'newest' | 'reviews' | 'title'>('rating')

  // Live autocomplete state from Music Metadata API
  const [apiSuggestions, setApiSuggestions] = useState<AutocompleteAlbumItem[]>([])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isSearchingApi, setIsSearchingApi] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  // Collect unique genres
  const allGenres = useMemo(() => {
    const set = new Set<string>()
    albums.forEach((a) => {
      a.genres?.forEach((g) => set.add(g))
    })
    return ['ALL', ...Array.from(set).sort()]
  }, [albums])

  // Live query Music Metadata API when user types
  useEffect(() => {
    const trimmed = search.trim()
    if (trimmed.length < 2) {
      setApiSuggestions([])
      setIsDropdownOpen(false)
      setIsSearchingApi(false)
      return
    }

    setIsSearchingApi(true)
    const controller = new AbortController()

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/music/autocomplete?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal }
        )
        if (res.ok) {
          const data = await res.json()
          setApiSuggestions(data.results || [])
          setIsDropdownOpen(true)
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Autocomplete fetch error:', err)
        }
      } finally {
        setIsSearchingApi(false)
      }
    }, 250)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [search])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter & Sort local catalog
  const filteredAlbums = useMemo(() => {
    let result = [...albums]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.artist.some((art) => art.toLowerCase().includes(q)) ||
          a.genres?.some((g) => g.toLowerCase().includes(q))
      )
    }

    if (selectedGenre !== 'ALL') {
      result = result.filter((a) =>
        a.genres?.some((g) => g.toLowerCase() === selectedGenre.toLowerCase())
      )
    }

    switch (sortBy) {
      case 'rating':
        result.sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0))
        break
      case 'newest':
        result.sort(
          (a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
        )
        break
      case 'reviews':
        result.sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0))
        break
      case 'title':
        result.sort((a, b) => a.title.localeCompare(b.title))
        break
    }

    return result
  }, [albums, search, selectedGenre, sortBy])

  const handleSelectApiSuggestion = async (item: AutocompleteAlbumItem) => {
    setIsDropdownOpen(false)
    setIsNavigating(true)

    if (item.inCatalog) {
      router.push(`/albums/${item.id}`)
    } else {
      try {
        const res = await importOrGetAlbumFromApi(item.id)
        if (res.success && res.album) {
          router.push(`/albums/${res.album.id}`)
        } else {
          router.push(`/albums/${item.id}`)
        }
      } catch {
        router.push(`/albums/${item.id}`)
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Controls: Search with Live Autocomplete, Genre Filters, Sort */}
      <div className="bg-[#F5F1E9] border border-[#E3DCCE] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search bar with API autocomplete */}
          <div ref={searchContainerRef} className="relative flex-1">
            <span className="absolute inset-y-0 left-3 flex items-center text-stone-400 pointer-events-none text-sm">
              {isSearchingApi ? (
                <span className="w-3.5 h-3.5 border-2 border-stone-700 border-t-transparent rounded-full animate-spin" />
              ) : (
                '🔍'
              )}
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => {
                if (apiSuggestions.length > 0) setIsDropdownOpen(true)
              }}
              placeholder="Search or auto-complete any album in the world..."
              className="w-full pl-9 pr-8 py-2.5 bg-white border border-[#D9D1C3] rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 placeholder-stone-400 shadow-xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setApiSuggestions([])
                  setIsDropdownOpen(false)
                }}
                className="absolute inset-y-0 right-3 flex items-center text-stone-400 hover:text-stone-700 text-xs cursor-pointer"
              >
                Clear
              </button>
            )}

            {/* Live Autocomplete Suggestions Dropdown */}
            {isDropdownOpen && apiSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-[#EAE4D9] rounded-2xl shadow-xl overflow-hidden z-50 divide-y divide-[#F0EAE1] max-h-80 overflow-y-auto">
                <div className="px-3.5 py-1.5 bg-[#FAF7F2] border-b border-[#EAE4D9] flex items-center justify-between text-[11px] font-medium text-stone-500">
                  <span>Music Metadata Suggestions</span>
                  <span className="text-[10px] text-stone-400">Click to view & rank</span>
                </div>

                {apiSuggestions.map((item, idx) => (
                  <button
                    key={`${item.id}-${idx}`}
                    type="button"
                    onClick={() => handleSelectApiSuggestion(item)}
                    className="w-full px-3.5 py-2.5 text-left flex items-center space-x-3 hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                  >
                    {item.coverImageUrl ? (
                      <img
                        src={item.coverImageUrl}
                        alt={item.title}
                        className="w-10 h-10 rounded-lg object-cover shadow-2xs border border-[#EAE4D9] flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-[#EAE4D9] text-stone-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {item.title.charAt(0)}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-stone-900 text-xs sm:text-sm truncate">
                          {item.title}
                        </span>
                        {item.releaseYear && (
                          <span className="text-stone-400 text-xs font-mono">
                            ({item.releaseYear})
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 truncate">
                        {Array.isArray(item.artist) ? item.artist.join(', ') : item.artist}
                      </p>
                    </div>

                    <div className="flex-shrink-0">
                      {item.inCatalog ? (
                        <span className="px-2 py-0.5 rounded-md bg-[#EAE4D9] text-stone-800 text-[10px] font-semibold border border-[#D9D1C3]">
                          In Catalog
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-[#FAF7F2] text-stone-600 text-[10px] font-medium border border-[#EAE4D9]">
                          🌐 Music API
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <span className="text-xs text-stone-500 font-medium whitespace-nowrap">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as 'rating' | 'newest' | 'reviews' | 'title')
              }
              className="px-3 py-2 bg-white border border-[#D9D1C3] rounded-xl text-xs font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400 cursor-pointer shadow-xs"
            >
              <option value="rating">Top Rated ★</option>
              <option value="reviews">Most Reviewed 💬</option>
              <option value="newest">Release Date 📅</option>
              <option value="title">Title (A-Z) 🔤</option>
            </select>
          </div>
        </div>

        {/* Genre Pill Carousel */}
        {allGenres.length > 1 && (
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
            {allGenres.map((genre) => {
              const isSelected = selectedGenre === genre
              return (
                <button
                  key={genre}
                  type="button"
                  onClick={() => setSelectedGenre(genre)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-stone-900 text-stone-50 border-stone-900 shadow-xs'
                      : 'bg-white text-stone-600 border-[#DDD5C7] hover:border-stone-400 hover:text-stone-900'
                  }`}
                >
                  {genre === 'ALL' ? 'All Genres' : genre}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {isNavigating && (
        <div className="bg-[#FAF7F2] border border-[#EAE4D9] rounded-2xl p-4 text-center text-xs text-stone-700 shadow-xs animate-pulse">
          Loading album from Music Metadata API...
        </div>
      )}

      {/* Album Grid */}
      {filteredAlbums.length === 0 ? (
        <div className="text-center py-16 bg-[#F5F1E9]/60 border border-[#E3DCCE] rounded-3xl p-8 space-y-4">
          <span className="text-4xl block">💿</span>
          <div>
            <p className="text-stone-800 font-bold text-lg">
              No albums in catalog match &ldquo;{search}&rdquo;
            </p>
            <p className="text-stone-500 text-xs mt-1">
              Select one of the live Music Metadata suggestions in the search bar above to automatically add it to your catalog!
            </p>
          </div>

          {apiSuggestions.length > 0 && (
            <div className="pt-4 max-w-xl mx-auto space-y-2 text-left">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Suggested from Free Music API:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {apiSuggestions.slice(0, 4).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectApiSuggestion(item)}
                    className="p-3 bg-white border border-[#EAE4D9] hover:border-stone-400 rounded-xl flex items-center space-x-3 transition-colors text-left cursor-pointer shadow-xs"
                  >
                    {item.coverImageUrl && (
                      <img
                        src={item.coverImageUrl}
                        alt={item.title}
                        className="w-10 h-10 rounded-md object-cover border border-[#EAE4D9]"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-stone-900 text-xs truncate">{item.title}</p>
                      <p className="text-[11px] text-stone-500 truncate">
                        {Array.isArray(item.artist) ? item.artist.join(', ') : item.artist}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
          {filteredAlbums.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </div>
      )}
    </div>
  )
}
