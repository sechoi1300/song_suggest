import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const reviews = await prisma.review.findMany({
    where: { userId: session.user.id },
    include: {
      album: {
        select: {
          id: true,
          title: true,
          artist: true,
          coverImageUrl: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">My Profile</h1>
          <div className="flex items-center space-x-4">
            {session.user?.image && (
              <img
                src={session.user.image}
                alt={session.user.name || 'User'}
                className="h-16 w-16 rounded-full"
              />
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {session.user?.name || 'User'}
              </h2>
              <p className="text-gray-600">{session.user?.email}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            My Reviews ({reviews.length})
          </h2>
          {reviews.length === 0 ? (
            <p className="text-gray-500">You haven't reviewed any albums yet.</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <Link
                  key={review.id}
                  href={`/albums/${review.album.id}`}
                  className="block border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start space-x-4">
                    {review.album.coverImageUrl ? (
                      <img
                        src={review.album.coverImageUrl}
                        alt={review.album.title}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded flex items-center justify-center">
                        <span className="text-white font-bold">
                          {review.album.title.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{review.album.title}</h3>
                      <p className="text-sm text-gray-600">
                        {Array.isArray(review.album.artist)
                          ? review.album.artist.join(', ')
                          : review.album.artist}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-yellow-500 font-bold">{review.rating}</span>
                        <span className="text-gray-500 text-sm">/ 10</span>
                      </div>
                      {review.reviewText && (
                        <p className="text-gray-700 text-sm mt-2 line-clamp-2">
                          {review.reviewText}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
