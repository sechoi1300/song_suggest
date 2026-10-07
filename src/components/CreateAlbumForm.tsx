'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createAlbum, AutocompleteAlbumItem, fetchAlbumDetailsFromApi } from '@/app/actions/albums'
import AlbumAutocomplete from './AlbumAutocomplete'

export default function CreateAlbumForm() {
  const router = useRouter()
  const [showManualForm, setShowManualForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [error, setError] = useState('')
  const [autoFilledNotice, setAutoFilledNotice] = useState('')

  // Controlled form state
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [releaseDate, setReleaseDate] = useState('')
  const [length, setLength] = useState('')
  const [numSongs, setNumSongs] = useState('')
  const [genres, setGenres] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [tracklist, setTracklist] = useState('')

  const handleSelectFromApi = async (album: AutocompleteAlbumItem) => {
    setIsLoadingDetails(true)
    setError('')
    setAutoFilledNotice('')

    try {
      setTitle(album.title)
      setArtist(Array.isArray(album.artist) ? album.artist.join(', ') : album.artist)
      setGenres(album.genres ? album.genres.join(', ') : '')
      if (album.coverImageUrl) setCoverImageUrl(album.coverImageUrl)
      if (album.numSongs) setNumSongs(album.numSongs.toString())

      // If we have a collectionId, fetch the full tracklist and duration
      if (album.collectionId) {
        const details = await fetchAlbumDetailsFromApi(album.collectionId)
        if (details) {
          if (details.releaseDate) {
            const datePart = details.releaseDate.split('T')[0]
            if (datePart) setReleaseDate(datePart)
          }
          if (details.length) setLength(details.length)
          if (details.tracklist && details.tracklist.length > 0) {
            setTracklist(details.tracklist.join('\n'))
            setNumSongs(details.tracklist.length.toString())
          }
          if (details.coverImageUrl) {
            setCoverImageUrl(details.coverImageUrl)
          }
        }
      } else if (album.releaseYear) {
        setReleaseDate(`${album.releaseYear}-01-01`)
      }

      setAutoFilledNotice(
        `✨ Auto-filled details for "${album.title}". Review or adjust below before saving.`
      )
      setShowManualForm(true)
    } catch (e) {
      console.error('Error fetching full album details:', e)
      setShowManualForm(true)
    } finally {
      setIsLoadingDetails(false)
    }
  }

  const handleResetToSearch = () => {
    setShowManualForm(false)
    setAutoFilledNotice('')
    setError('')
    setTitle('')
    setArtist('')
    setReleaseDate('')
    setLength('')
    setNumSongs('')
    setGenres('')
    setCoverImageUrl('')
    setTracklist('')
  }

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
    <div className="space-y-6">
      {/* View 1: Search Bar Mode (Default) */}
      {!showManualForm ? (
        <div className="space-y-4">
          <div className="bg-[#FAF7F2] border border-[#EAE4D9] rounded-2xl p-6 shadow-xs space-y-3">
            <label className="block text-xs font-medium text-stone-700">
              Search Album
            </label>

            <AlbumAutocomplete
              placeholder="Search for an album..."
              mode="select"
              onSelect={handleSelectFromApi}
            />

            {isLoadingDetails && (
              <div className="flex items-center space-x-2 text-xs text-stone-500 pt-1 animate-pulse">
                <span className="w-3 h-3 border-2 border-stone-800 border-t-transparent rounded-full animate-spin" />
                <span>Loading album details...</span>
              </div>
            )}
          </div>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setError('')
                setAutoFilledNotice('')
                setShowManualForm(true)
              }}
              className="text-xs text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
            >
              Or add details manually →
            </button>
          </div>
        </div>
      ) : (
        /* View 2: Manual Form Mode */
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-[#EAE4D9]">
            <button
              type="button"
              onClick={handleResetToSearch}
              className="text-xs text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
            >
              ← Back to Search
            </button>

            <span className="text-xs text-stone-400">
              {autoFilledNotice ? 'Auto-filled' : 'Manual'}
            </span>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2.5 rounded-xl text-xs">
              {error}
            </div>
          )}

          {autoFilledNotice && (
            <div className="text-xs text-stone-800 bg-[#EAE4D9]/80 border border-[#D9D1C3] rounded-xl px-4 py-2 flex items-center justify-between">
              <span>{autoFilledNotice}</span>
              <button
                type="button"
                onClick={() => setAutoFilledNotice('')}
                className="text-stone-400 hover:text-stone-800 ml-2 cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Cover Preview if available */}
          {coverImageUrl && (
            <div className="flex items-center space-x-3.5 p-3 bg-[#FAF7F2] border border-[#EAE4D9] rounded-xl">
              <img
                src={coverImageUrl}
                alt="Cover Preview"
                className="w-14 h-14 rounded-lg object-cover border border-[#EAE4D9]"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-stone-900 font-semibold truncate">{title || 'Preview'}</p>
                <p className="text-[11px] text-stone-500 truncate">{artist}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-xs font-medium text-stone-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Album title"
                className="w-full px-3.5 py-2 bg-[#FAF7F2] border border-[#EAE4D9] rounded-lg text-stone-900 text-xs focus:outline-none focus:ring-1 focus:ring-stone-400 placeholder-stone-400"
              />
            </div>

            <div>
              <label htmlFor="artist" className="block text-xs font-medium text-stone-700 mb-1">
                Artist *
              </label>
              <input
                type="text"
                id="artist"
                name="artist"
                required
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="Artist name"
                className="w-full px-3.5 py-2 bg-[#FAF7F2] border border-[#EAE4D9] rounded-lg text-stone-900 text-xs focus:outline-none focus:ring-1 focus:ring-stone-400 placeholder-stone-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="releaseDate" className="block text-xs font-medium text-stone-700 mb-1">
                  Release Date *
                </label>
                <input
                  type="date"
                  id="releaseDate"
                  name="releaseDate"
                  required
                  value={releaseDate}
                  onChange={(e) => setReleaseDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#EAE4D9] rounded-lg text-stone-900 text-xs focus:outline-none focus:ring-1 focus:ring-stone-400"
                />
              </div>

              <div>
                <label htmlFor="length" className="block text-xs font-medium text-stone-700 mb-1">
                  Length
                </label>
                <input
                  type="text"
                  id="length"
                  name="length"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  placeholder="e.g. 45:00"
                  className="w-full px-3.5 py-2 bg-[#FAF7F2] border border-[#EAE4D9] rounded-lg text-stone-900 text-xs focus:outline-none focus:ring-1 focus:ring-stone-400 placeholder-stone-400"
                />
              </div>

              <div>
                <label htmlFor="numSongs" className="block text-xs font-medium text-stone-700 mb-1">
                  Tracks
                </label>
                <input
                  type="number"
                  id="numSongs"
                  name="numSongs"
                  min="1"
                  value={numSongs}
                  onChange={(e) => setNumSongs(e.target.value)}
                  placeholder="e.g. 12"
                  className="w-full px-3.5 py-2 bg-[#FAF7F2] border border-[#EAE4D9] rounded-lg text-stone-900 text-xs focus:outline-none focus:ring-1 focus:ring-stone-400 placeholder-stone-400"
                />
              </div>
            </div>

            <div>
              <label htmlFor="genres" className="block text-xs font-medium text-stone-700 mb-1">
                Genres
              </label>
              <input
                type="text"
                id="genres"
                name="genres"
                value={genres}
                onChange={(e) => setGenres(e.target.value)}
                placeholder="Comma-separated genres"
                className="w-full px-3.5 py-2 bg-[#FAF7F2] border border-[#EAE4D9] rounded-lg text-stone-900 text-xs focus:outline-none focus:ring-1 focus:ring-stone-400 placeholder-stone-400"
              />
            </div>

            <div>
              <label htmlFor="coverImageUrl" className="block text-xs font-medium text-stone-700 mb-1">
                Cover Image URL
              </label>
              <input
                type="url"
                id="coverImageUrl"
                name="coverImageUrl"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2 bg-[#FAF7F2] border border-[#EAE4D9] rounded-lg text-stone-900 text-xs focus:outline-none focus:ring-1 focus:ring-stone-400 placeholder-stone-400"
              />
            </div>

            <div>
              <label htmlFor="tracklist" className="block text-xs font-medium text-stone-700 mb-1">
                Tracklist
              </label>
              <textarea
                id="tracklist"
                name="tracklist"
                rows={4}
                value={tracklist}
                onChange={(e) => setTracklist(e.target.value)}
                placeholder="One track per line"
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#EAE4D9] rounded-lg text-stone-900 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-stone-400 placeholder-stone-400"
              />
            </div>

            <div className="flex space-x-2.5 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-50 font-medium text-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Saving...' : 'Save Album'}
              </button>
              <button
                type="button"
                onClick={handleResetToSearch}
                className="px-4 py-2.5 rounded-lg bg-[#FAF7F2] border border-[#EAE4D9] hover:bg-[#EAE4D9] text-stone-600 text-xs font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
