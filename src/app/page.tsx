import { getAlbums } from './actions/albums'
import AlbumList from '@/components/AlbumList'
import Navbar from '@/components/Navbar'

export default async function Home() {
  const albums = await getAlbums()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Discover Albums</h1>
          <p className="text-gray-600">Find and rate your favorite music albums</p>
        </div>
        <AlbumList albums={albums} />
      </main>
    </div>
  )
}
