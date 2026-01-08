import { Album, Review, User } from '@prisma/client'
import ReviewForm from './ReviewForm'
import ReviewList from './ReviewList'

interface ReviewWithUser extends Review {
  user: Pick<User, 'id' | 'name' | 'image' | 'email'>
}

interface AlbumDetailProps {
  album: Album & {
    reviews: ReviewWithUser[]
    averageRating?: number
    reviewCount?: number
  }
}

export default function AlbumDetail({ album }: AlbumDetailProps) {
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  return (
    <div>
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="md:flex">
          {album.coverImageUrl ? (
            <img
              src={album.coverImageUrl}
              alt={album.title}
              className="w-full md:w-64 h-64 md:h-auto object-cover"
            />
          ) : (
            <div className="w-full md:w-64 h-64 bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
              <span className="text-white text-6xl font-bold">{album.title.charAt(0)}</span>
            </div>
          )}
          <div className="p-6 flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{album.title}</h1>
            <p className="text-xl text-gray-600 mb-4">
              {Array.isArray(album.artist) ? album.artist.join(', ') : album.artist}
            </p>
            <div className="flex flex-wrap gap-4 text-gray-600 mb-4">
              <div>
                <span className="font-semibold">Released:</span> {formatDate(album.releaseDate)}
              </div>
              {album.length && (
                <div>
                  <span className="font-semibold">Length:</span> {album.length}
                </div>
              )}
              {album.numSongs && (
                <div>
                  <span className="font-semibold">Songs:</span> {album.numSongs}
                </div>
              )}
            </div>
            {album.genres && album.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {album.genres.map((genre, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}
            {album.averageRating !== undefined ? (
              <div className="flex items-center">
                <span className="text-yellow-500 text-3xl font-bold mr-2">
                  {album.averageRating.toFixed(1)}
                </span>
                <span className="text-gray-500 text-lg">/ 10</span>
                {album.reviewCount !== undefined && (
                  <span className="text-gray-500 text-lg ml-4">
                    ({album.reviewCount} {album.reviewCount === 1 ? 'review' : 'reviews'})
                  </span>
                )}
              </div>
            ) : (
              <p className="text-gray-400">No reviews yet</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Write a Review</h2>
        <ReviewForm albumId={album.id} />
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Reviews ({album.reviews.length})
        </h2>
        <ReviewList reviews={album.reviews} albumId={album.id} />
      </div>
    </div>
  )
}
