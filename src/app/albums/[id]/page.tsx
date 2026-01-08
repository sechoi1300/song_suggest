import { getAlbumById } from '@/app/actions/albums'
import Navbar from '@/components/Navbar'
import AlbumDetail from '@/components/AlbumDetail'
import { notFound } from 'next/navigation'

export default async function AlbumPage({ params }: { params: { id: string } }) {
  const album = await getAlbumById(params.id)

  if (!album) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AlbumDetail album={album} />
      </main>
    </div>
  )
}
