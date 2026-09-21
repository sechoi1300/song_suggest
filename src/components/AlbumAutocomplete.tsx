'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { AutocompleteAlbumItem, importOrGetAlbumFromApi } from '@/app/actions/albums'

interface AlbumAutocompleteProps {
  placeholder?: string
  onSelect?: (album: AutocompleteAlbumItem) => void
  mode?: 'navigate' | 'select'
  className?: string
  initialValue?: string
}

export default function AlbumAutocomplete({
  placeholder = 'Start typing an album or artist...',
  onSelect,
  mode = 'navigate',
  className = '',
  initialValue = '',
}: AlbumAutocompleteProps) {
  const router = useRouter()
  const [query, setQuery] = useState(initialValue)
  const [suggestions, setSuggestions] = useState<AutocompleteAlbumItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Debounced search
  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setSuggestions([])
      setIsOpen(false)
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const controller = new AbortController()
    abortControllerRef.current = controller

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/music/autocomplete?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal }
        )
        if (res.ok) {
          const data = await res.json()
          setSuggestions(data.results || [])
          setIsOpen(true)
          setSelectedIndex(-1)
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Autocomplete fetch error:', err)
        }
      } finally {
        setIsLoading(false)
      }
    }, 250)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectItem = async (item: AutocompleteAlbumItem) => {
    setIsOpen(false)

    if (onSelect) {
      onSelect(item)
    }

    if (mode === 'navigate') {
      setIsNavigating(true)
      if (item.inCatalog) {
        router.push(`/albums/${item.id}`)
      } else {
        // Import from Music Metadata API first or navigate directly
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
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1))
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        e.preventDefault()
        handleSelectItem(suggestions[selectedIndex])
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="relative">
        <span className="absolute inset-y-0 left-3.5 flex items-center text-stone-400 pointer-events-none text-sm">
          {isLoading ? (
            <span className="w-4 h-4 border-2 border-stone-800 border-t-transparent rounded-full animate-spin" />
          ) : (
            '🔍'
          )}
        </span>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true)
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-9 py-2.5 bg-white border border-[#D9D1C3] rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 placeholder-stone-400 transition-all shadow-xs"
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setSuggestions([])
              setIsOpen(false)
            }}
            className="absolute inset-y-0 right-3 flex items-center text-stone-400 hover:text-stone-700 text-xs cursor-pointer p-1"
          >
            ✕
          </button>
        )}
      </div>

      {isNavigating && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#EAE4D9] rounded-xl p-3 text-center text-xs text-stone-600 shadow-md z-50">
          Loading album metadata...
        </div>
      )}

      {/* Autocomplete Dropdown */}
      {isOpen && suggestions.length > 0 && !isNavigating && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-[#EAE4D9] rounded-2xl shadow-xl overflow-hidden z-50 divide-y divide-[#F0EAE1] max-h-96 overflow-y-auto">
          <div className="px-3.5 py-1.5 bg-[#FAF7F2] border-b border-[#EAE4D9] flex items-center justify-between text-[11px] font-medium text-stone-500">
            <span>Suggestions from Music Metadata API</span>
            <span className="font-mono text-[10px]">{suggestions.length} results</span>
          </div>

          {suggestions.map((item, idx) => {
            const isSelected = selectedIndex === idx
            return (
              <button
                key={`${item.id}-${idx}`}
                type="button"
                onClick={() => handleSelectItem(item)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`w-full px-3.5 py-2.5 text-left flex items-center space-x-3 transition-colors cursor-pointer ${
                  isSelected ? 'bg-[#F4EFE6]' : 'hover:bg-[#FAF7F2]'
                }`}
              >
                {/* Album artwork thumbnail */}
                {item.coverImageUrl ? (
                  <img
                    src={item.coverImageUrl}
                    alt={item.title}
                    className="w-12 h-12 rounded-lg object-cover shadow-2xs border border-[#EAE4D9] flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-[#EAE4D9] text-stone-700 flex items-center justify-center font-bold text-base flex-shrink-0">
                    {item.title.charAt(0)}
                  </div>
                )}

                {/* Album metadata */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-stone-900 text-sm truncate">
                      {item.title}
                    </span>
                    {item.releaseYear && (
                      <span className="text-stone-400 text-xs font-mono">
                        ({item.releaseYear})
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-stone-600 truncate mt-0.5">
                    {Array.isArray(item.artist) ? item.artist.join(', ') : item.artist}
                  </p>

                  <div className="flex items-center space-x-2 mt-1">
                    {item.genres && item.genres[0] && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#FAF7F2] text-stone-500 border border-[#EAE4D9]">
                        {item.genres[0]}
                      </span>
                    )}
                    {item.numSongs ? (
                      <span className="text-[10px] text-stone-400">
                        {item.numSongs} tracks
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Origin Badge */}
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
            )
          })}
        </div>
      )}
    </div>
  )
}
