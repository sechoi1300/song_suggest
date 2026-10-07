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
        <span className="absolute inset-y-0 left-3 flex items-center text-stone-400 pointer-events-none text-xs">
          {isLoading ? (
            <span className="w-3.5 h-3.5 border-2 border-stone-800 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
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
          className="w-full pl-9 pr-8 py-2 bg-white border border-[#D9D1C3] rounded-lg text-stone-900 text-xs focus:outline-none focus:ring-1 focus:ring-stone-400 placeholder-stone-400 transition-colors"
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setSuggestions([])
              setIsOpen(false)
            }}
            className="absolute inset-y-0 right-2.5 flex items-center text-stone-400 hover:text-stone-700 text-xs cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {isNavigating && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#EAE4D9] rounded-lg p-2.5 text-center text-xs text-stone-500 shadow-md z-50">
          Loading album...
        </div>
      )}

      {/* Autocomplete Dropdown */}
      {isOpen && suggestions.length > 0 && !isNavigating && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#EAE4D9] rounded-xl shadow-lg overflow-hidden z-50 divide-y divide-[#F0EAE1] max-h-80 overflow-y-auto">
          {suggestions.map((item, idx) => {
            const isSelected = selectedIndex === idx
            return (
              <button
                key={`${item.id}-${idx}`}
                type="button"
                onClick={() => handleSelectItem(item)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`w-full px-3 py-2 text-left flex items-center space-x-2.5 transition-colors cursor-pointer ${
                  isSelected ? 'bg-[#F4EFE6]' : 'hover:bg-[#FAF7F2]'
                }`}
              >
                {/* Album artwork thumbnail */}
                {item.coverImageUrl ? (
                  <img
                    src={item.coverImageUrl}
                    alt={item.title}
                    className="w-9 h-9 rounded object-cover border border-[#EAE4D9] flex-shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded bg-[#EAE4D9] text-stone-700 flex items-center justify-center font-medium text-xs flex-shrink-0">
                    {item.title.charAt(0)}
                  </div>
                )}

                {/* Album metadata */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-medium text-stone-900 text-xs truncate">
                      {item.title}
                    </span>
                    {item.releaseYear && (
                      <span className="text-stone-400 text-[11px] font-mono">
                        ({item.releaseYear})
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-stone-500 truncate">
                    {Array.isArray(item.artist) ? item.artist.join(', ') : item.artist}
                  </p>
                </div>

                {/* Origin Badge */}
                <div className="flex-shrink-0">
                  {item.inCatalog ? (
                    <span className="text-[10px] text-stone-500 font-medium">
                      Catalog
                    </span>
                  ) : (
                    <span className="text-[10px] text-stone-400 font-medium">
                      Online
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
