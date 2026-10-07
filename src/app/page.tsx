import { getAlbums } from './actions/albums'
import AlbumList from '@/components/AlbumList'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

export default async function Home() {
  const albums = await getAlbums()

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-stone-900">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Minimal Hero Section */}
        <div className="py-6 sm:py-8 max-w-2xl space-y-3">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-stone-900">
            Rank and discover albums.
          </h1>
          <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
            Compare albums head to head, track your favorites, and get recommendations based on your taste.
          </p>
          <div className="flex items-center gap-2 pt-2">
            <Link
              href="/suggest"
              className="px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-50 font-medium text-xs transition-colors"
            >
              Get Suggestions
            </Link>
            <Link
              href="/albums/new"
              className="px-4 py-2 rounded-lg bg-white hover:bg-stone-100 text-stone-800 font-medium text-xs border border-[#D9D1C3] transition-colors"
            >
              Add Album
            </Link>
          </div>
        </div>

        {/* Catalog Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-stone-900 tracking-tight">Albums</h2>
            <span className="text-xs text-stone-500">
              {albums.length} total
            </span>
          </div>

          <AlbumList albums={albums} />
        </div>
      </main>
    </div>
  )
}
