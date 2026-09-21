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
        <div className="space-y-6">
          <div className="bg-[#FAF7F2] border border-[#EAE4D9] rounded-2xl p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
                Search Album
              </label>
              <span className="text-[11px] text-stone-400">
                Connected to Music Metadata API
              </span>
            </div>

            <AlbumAutocomplete
              placeholder="Search for an album or artist (e.g. Abbey Road, Currents, In Rainbows)..."
              mode="select"
              onSelect={handleSelectFromApi}
            />

            {isLoadingDetails && (
              <div className="flex items-center space-x-2 text-xs text-stone-600 pt-2 animate-pulse">
                <span className="w-3.5 h-3.5 border-2 border-stone-800 border-t-transparent rounded-full animate-spin" />
                <span>Loading full tracklist and artwork...</span>
              </div>
            )}
          </div>

          {/* Or Add Manually Divider & Button */}
          <div className="text-center pt-2">
            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-[#EAE4D9] w-full" />
              <span className="bg-white px-3 text-xs text-stone-400 font-medium absolute">
                Can&apos;t find what you&apos;re looking for?
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setError('')
                setAutoFilledNotice('')
                setShowManualForm(true)
              }}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#EAE4D9] text-stone-700 hover:text-stone-900 border border-[#EAE4D9] text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <span>✏️ Or, add manually</span>
            </button>
          </div>
        </div>
      ) : (
        /* View 2: Manual Form Mode (revealed via "Or, add manually" or selecting an album from search) */
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-[#EAE4D9]">
            <button
              type="button"
              onClick={handleResetToSearch}
              className="inline-flex items-center space-x-1.5 text-xs font-medium text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
            >
              <span>← Back to Search</span>
            </button>

            <span className="text-xs text-stone-400 font-medium">
              {autoFilledNotice ? 'Auto-filled from Music API' : 'Manual Entry'}
            </span>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {autoFilledNotice && (
            <div className="text-xs font-medium text-stone-800 bg-[#EAE4D9]/80 border border-[#D9D1C3] rounded-xl px-4 py-2.5 flex items-center justify-between shadow-2xs">
              <span>{autoFilledNotice}</span>
              <button
                type="button"
                onClick={() => setAutoFilledNotice('')}
                className="text-stone-500 hover:text-stone-900 ml-2 cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Cover Preview if available */}
          {coverImageUrl && (
            <div className="flex items-center space-x-4 p-3.5 bg-[#FAF7F2] border border-[#EAE4D9] rounded-2xl">
              <img
                src={coverImageUrl}
                alt="Cover Preview"
                className="w-16 h-16 rounded-xl object-cover shadow-xs border border-[#EAE4D9]"
              />
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                  Album Artwork Attached
                </span>
                <p className="text-xs text-stone-900 font-bold truncate">{title || 'Preview'}</p>
                <p className="text-[11px] text-stone-400">High-resolution cover art linked</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
                Album Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. In Rainbows"
                className="w-full px-4 py-2.5 bg-[#FAF7F2] border border-[#EAE4D9] rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 placeholder-stone-400"
              />
            </div>

            <div>
              <label htmlFor="artist" className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
                Artist(s) * (comma-separated)
              </label>
              <input
                type="text"
                id="artist"
                name="artist"
                required
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="e.g. Radiohead"
                className="w-full px-4 py-2.5 bg-[#FAF7F2] border border-[#EAE4D9] rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 placeholder-stone-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="releaseDate" className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
                  Release Date *
                </label>
                <input
                  type="date"
                  id="releaseDate"
                  name="releaseDate"
                  required
                  value={releaseDate}
                  onChange={(e) => setReleaseDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-[#EAE4D9] rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
                />
              </div>

              <div>
                <label htmlFor="length" className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
                  Length (optional)
                </label>
                <input
                  type="text"
                  id="length"
                  name="length"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  placeholder="e.g. 42:39"
                  className="w-full px-4 py-2.5 bg-[#FAF7F2] border border-[#EAE4D9] rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 placeholder-stone-400"
                />
              </div>

              <div>
                <label htmlFor="numSongs" className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
                  Number of Songs
                </label>
                <input
                  type="number"
                  id="numSongs"
                  name="numSongs"
                  min="1"
                  value={numSongs}
                  onChange={(e) => setNumSongs(e.target.value)}
                  placeholder="e.g. 10"
                  className="w-full px-4 py-2.5 bg-[#FAF7F2] border border-[#EAE4D9] rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 placeholder-stone-400"
                />
              </div>
            </div>

            <div>
              <label htmlFor="genres" className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
                Genres (comma-separated)
              </label>
              <input
                type="text"
                id="genres"
                name="genres"
                value={genres}
                onChange={(e) => setGenres(e.target.value)}
                placeholder="e.g. Art Rock, Electronic, Alternative"
                className="w-full px-4 py-2.5 bg-[#FAF7F2] border border-[#EAE4D9] rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 placeholder-stone-400"
              />
            </div>

            <div>
              <label htmlFor="coverImageUrl" className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
                Cover Image URL (optional)
              </label>
              <input
                type="url"
                id="coverImageUrl"
                name="coverImageUrl"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full px-4 py-2.5 bg-[#FAF7F2] border border-[#EAE4D9] rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 placeholder-stone-400"
              />
            </div>

            <div>
              <label htmlFor="tracklist" className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">
                Tracklist (One song title per line)
              </label>
              <p className="text-[11px] text-stone-400 mb-2">
                Enables users to pick their favorite standout songs and skips when ranking this album!
              </p>
              <textarea
                id="tracklist"
                name="tracklist"
                rows={5}
                value={tracklist}
                onChange={(e) => setTracklist(e.target.value)}
                placeholder={`15 Step\nBodysnatchers\nNude\nWeird Fishes/Arpeggi\nAll I Need\nFaust Arp\nReckoner\nHouse of Cards\nJigsaw Falling Into Place\nVideotape`}
                className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#EAE4D9] rounded-xl text-stone-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-stone-400 placeholder-stone-400"
              />
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 px-6 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-50 font-medium text-sm shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Saving Album...' : 'Save Album to Catalog 💿'}
              </button>
              <button
                type="button"
                onClick={handleResetToSearch}
                className="px-5 py-3 rounded-xl bg-[#FAF7F2] border border-[#EAE4D9] hover:bg-[#EAE4D9] text-stone-600 hover:text-stone-900 text-sm font-medium transition-colors cursor-pointer"
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
