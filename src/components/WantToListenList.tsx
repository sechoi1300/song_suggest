'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toggleWantToListen } from '@/app/actions/wantToListen'

interface WantToListenItem {
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
      <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-3xl p-8">
        <span className="text-5xl mb-3 block">🔖</span>
        <h3 className="text-xl font-bold text-white mb-2">Your queue is empty</h3>
        <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
          Bookmark albums you want to listen to later. When you're ready, rank them to add them to your personal Beli leaderboard!
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm shadow-lg shadow-violet-600/30 transition-all cursor-pointer"
        >
          Browse Albums
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="group bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all flex items-center justify-between gap-4 shadow-md"
          >
            <div className="flex items-center space-x-3 min-w-0">
              <Link href={`/albums/${item.album.id}`} className="flex-shrink-0">
                {item.album.coverImageUrl ? (
                  <img
                    src={item.album.coverImageUrl}
                    alt={item.album.title}
                    className="w-16 h-16 rounded-xl object-cover shadow-md border border-slate-700/60 group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white text-xl font-bold">
                    {item.album.title.charAt(0)}
                  </div>
                )}
              </Link>
              <div className="min-w-0">
                <Link
                  href={`/albums/${item.album.id}`}
                  className="font-bold text-white hover:text-violet-300 transition-colors block truncate text-sm"
                >
                  {item.album.title}
                </Link>
                <p className="text-xs text-slate-400 truncate">
                  {Array.isArray(item.album.artist)
                    ? item.album.artist.join(', ')
                    : item.album.artist}
                </p>
                {item.album.genres && item.album.genres.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400">
                      {item.album.genres[0]}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0">
              <Link
                href={`/albums/${item.album.id}`}
                className="px-3 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600 text-violet-300 hover:text-white border border-violet-500/30 text-xs font-bold transition-all cursor-pointer"
              >
                Rate & Rank 🎧
              </Link>
              <button
                type="button"
                onClick={() => handleRemove(item.albumId)}
                title="Remove from queue"
                className="text-slate-500 hover:text-rose-400 p-1.5 text-xs transition-colors cursor-pointer"
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
