'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toggleWantToListen } from '@/app/actions/wantToListen'

export interface WantToListenItem {
  id: string
  albumId: string
  notes?: string | null
  createdAt: Date | string
  album: {
    id: string
    title: string
    artist: string[]
    coverImageUrl?: string | null
    genres?: string[]
    releaseYear?: number | null
    numSongs?: number | null
    length?: string | null
  }
}

interface WantToListenListProps {
  initialItems: WantToListenItem[]
}

export default function WantToListenList({ initialItems }: WantToListenListProps) {
  const [items, setItems] = useState<WantToListenItem[]>(initialItems)

  const handleRemove = async (albumId: string) => {
    setItems((prev) => prev.filter((i) => i.albumId !== albumId))
    await toggleWantToListen(albumId)
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16 bg-white border border-[#EAE4D9] rounded-2xl p-8">
        <p className="text-stone-900 font-medium text-sm">Your queue is empty</p>
        <p className="text-stone-500 text-xs mt-1 mb-5">
          Save albums to listen to later.
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-50 text-xs font-medium transition-colors"
        >
          Browse Albums
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="group bg-white border border-[#EAE4D9] hover:border-stone-400 rounded-xl p-3 transition-colors flex items-center justify-between gap-3"
          >
            <div className="flex items-center space-x-3 min-w-0">
              <Link href={`/albums/${item.album.id}`} className="flex-shrink-0">
                {item.album.coverImageUrl ? (
                  <img
                    src={item.album.coverImageUrl}
                    alt={item.album.title}
                    className="w-12 h-12 rounded-lg object-cover border border-[#EAE4D9]"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-[#EAE4D9] text-stone-700 flex items-center justify-center text-sm font-medium">
                    {item.album.title.charAt(0)}
                  </div>
                )}
              </Link>
              <div className="min-w-0">
                <Link
                  href={`/albums/${item.album.id}`}
                  className="font-medium text-stone-900 hover:text-stone-600 transition-colors block truncate text-xs"
                >
                  {item.album.title}
                </Link>
                <p className="text-[11px] text-stone-500 truncate">
                  {Array.isArray(item.album.artist)
                    ? item.album.artist.join(', ')
                    : item.album.artist}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0">
              <Link
                href={`/albums/${item.album.id}`}
                className="px-2.5 py-1 rounded-md bg-stone-900 hover:bg-stone-800 text-stone-50 text-xs font-medium transition-colors cursor-pointer"
              >
                Rate
              </Link>
              <button
                type="button"
                onClick={() => handleRemove(item.albumId)}
                title="Remove"
                className="text-stone-300 hover:text-stone-700 p-1 text-xs transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
