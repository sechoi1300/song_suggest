'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createAlbum } from '@/app/actions/albums'

export default function CreateAlbumForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const result = await createAlbum(formData)

    if (result.success && result.album) {
      router.push(`/albums/${result.album.id}`)
    } else {
      setError(result.error || 'Failed to create album')
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
          Album Title *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          required
          placeholder="e.g. In Rainbows"
          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder-slate-500"
        />
      </div>

      <div>
        <label htmlFor="artist" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
          Artist(s) * (comma-separated)
        </label>
        <input
          type="text"
          id="artist"
          name="artist"
          required
          placeholder="e.g. Radiohead"
          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder-slate-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="releaseDate" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
            Release Date *
          </label>
          <input
            type="date"
            id="releaseDate"
            name="releaseDate"
            required
            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <div>
          <label htmlFor="length" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
            Length (optional)
          </label>
          <input
            type="text"
            id="length"
            name="length"
            placeholder="e.g. 42:39"
            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder-slate-500"
          />
        </div>

        <div>
          <label htmlFor="numSongs" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
            Number of Songs
          </label>
          <input
            type="number"
            id="numSongs"
            name="numSongs"
            min="1"
            placeholder="e.g. 10"
            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder-slate-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="genres" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
          Genres (comma-separated)
        </label>
        <input
          type="text"
          id="genres"
          name="genres"
          placeholder="e.g. Art Rock, Electronic, Alternative"
          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder-slate-500"
        />
      </div>

      <div>
        <label htmlFor="coverImageUrl" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
          Cover Image URL (optional)
        </label>
        <input
          type="url"
          id="coverImageUrl"
          name="coverImageUrl"
          placeholder="https://images.unsplash.com/photo-..."
          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder-slate-500"
        />
      </div>

      <div>
        <label htmlFor="tracklist" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
          Tracklist (One song title per line)
        </label>
        <p className="text-[11px] text-slate-500 mb-2">
          Enables users to pick their favorite standout songs and skips when ranking this album!
        </p>
        <textarea
          id="tracklist"
          name="tracklist"
          rows={5}
          placeholder={`15 Step\nBodysnatchers\nNude\nWeird Fishes/Arpeggi\nAll I Need\nFaust Arp\nReckoner\nHouse of Cards\nJigsaw Falling Into Place\nVideotape`}
          className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder-slate-600"
        />
      </div>

      <div className="flex space-x-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-violet-600/30 transition-all hover:scale-[1.005] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? 'Adding Album...' : 'Add Album to Catalog 💿'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-3 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-white text-sm font-semibold transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
