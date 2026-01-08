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
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Album Title *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label htmlFor="artist" className="block text-sm font-medium text-gray-700 mb-2">
          Artist(s) * (comma-separated)
        </label>
        <input
          type="text"
          id="artist"
          name="artist"
          required
          placeholder="e.g., The Beatles, Taylor Swift"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label htmlFor="releaseDate" className="block text-sm font-medium text-gray-700 mb-2">
          Release Date *
        </label>
        <input
          type="date"
          id="releaseDate"
          name="releaseDate"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="length" className="block text-sm font-medium text-gray-700 mb-2">
            Length (optional)
          </label>
          <input
            type="text"
            id="length"
            name="length"
            placeholder="e.g., 45:30"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="numSongs" className="block text-sm font-medium text-gray-700 mb-2">
            Number of Songs (optional)
          </label>
          <input
            type="number"
            id="numSongs"
            name="numSongs"
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="genres" className="block text-sm font-medium text-gray-700 mb-2">
          Genres (optional, comma-separated)
        </label>
        <input
          type="text"
          id="genres"
          name="genres"
          placeholder="e.g., Rock, Pop, Indie"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label htmlFor="coverImageUrl" className="block text-sm font-medium text-gray-700 mb-2">
          Cover Image URL (optional)
        </label>
        <input
          type="url"
          id="coverImageUrl"
          name="coverImageUrl"
          placeholder="https://example.com/album-cover.jpg"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="flex space-x-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Creating...' : 'Create Album'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
