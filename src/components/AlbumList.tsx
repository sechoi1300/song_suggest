'use client'

import { useState, useMemo } from 'react'
import AlbumCard from './AlbumCard'

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
  const [search, setSearch] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('ALL')
  const [sortBy, setSortBy] = useState<'rating' | 'newest' | 'reviews' | 'title'>('rating')

  // Collect unique genres
  const allGenres = useMemo(() => {
    const set = new Set<string>()
    albums.forEach((a) => {
      a.genres?.forEach((g) => set.add(g))
    })
    return ['ALL', ...Array.from(set).sort()]
  }, [albums])

  // Filter & Sort
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

  return (
    <div className="space-y-6">
      {/* Controls: Search, Genre Filters, Sort */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search bar */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-500 pointer-events-none text-sm">
              🔍
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search albums, artists, or genres..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder-slate-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
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
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-violet-600 text-white border-violet-500 shadow-sm shadow-violet-600/30'
                      : 'bg-slate-950/70 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {genre === 'ALL' ? 'All Genres' : genre}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Album Grid */}
      {filteredAlbums.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/50 border border-slate-800 rounded-3xl">
          <span className="text-4xl mb-3 block">💿</span>
          <p className="text-slate-300 font-bold text-lg">No albums match your filter</p>
          <p className="text-slate-500 text-xs mt-1">Try searching a different artist, genre, or keyword.</p>
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
