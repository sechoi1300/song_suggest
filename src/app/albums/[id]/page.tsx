import { getAlbumById } from '@/app/actions/albums'
import { getUserExistingRatingsForComparison } from '@/app/actions/reviews'
import { isAlbumInWantToListen } from '@/app/actions/wantToListen'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import AlbumDetail from '@/components/AlbumDetail'
import { notFound } from 'next/navigation'

export default async function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const album = await getAlbumById(id)

  if (!album) {
    notFound()
  }

  const session = await getServerSession(authOptions)
  const existingRankedAlbums = session?.user?.id
    ? await getUserExistingRatingsForComparison()
    : []

  const isBookmarked = await isAlbumInWantToListen(id)

  // Find user's existing review on this album if any
  const userReview = session?.user?.id
    ? album.reviews.find((r) => r.userId === session.user.id)
    : null

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-stone-900">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AlbumDetail
          album={album}
          userReview={userReview || null}
          existingRankedAlbums={existingRankedAlbums}
          isBookmarked={isBookmarked}
        />
      </main>
    </div>
  )
}
