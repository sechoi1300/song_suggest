import Link from 'next/link'
import { Album } from '@prisma/client'

interface AlbumWithRating extends Album {
  averageRating?: number
  reviewCount?: number
}

interface AlbumCardProps {
  album: AlbumWithRating
}

export default function AlbumCard({ album }: AlbumCardProps) {
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  return (
    <Link href={`/albums/${album.id}`}>
      <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
        {album.coverImageUrl ? (
          <img
            src={album.coverImageUrl}
            alt={album.title}
            className="w-full h-64 object-cover"
          />
        ) : (
          <div className="w-full h-64 bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
            <span className="text-white text-4xl font-bold">{album.title.charAt(0)}</span>
          </div>
        )}
        <div className="p-4">
          <h3 className="text-xl font-bold text-gray-900 mb-1 truncate">{album.title}</h3>
          <p className="text-gray-600 mb-2">
            {Array.isArray(album.artist) ? album.artist.join(', ') : album.artist}
          </p>
          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
            <span>{formatDate(album.releaseDate)}</span>
            {album.numSongs && <span>{album.numSongs} songs</span>}
          </div>
          {album.genres && album.genres.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {album.genres.slice(0, 3).map((genre, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between mt-2">
            {album.averageRating !== undefined ? (
              <div className="flex items-center">
                <span className="text-yellow-500 text-lg font-bold mr-1">
                  {album.averageRating.toFixed(1)}
                </span>
                <span className="text-gray-500 text-sm">/ 10</span>
                {album.reviewCount !== undefined && (
                  <span className="text-gray-500 text-sm ml-2">
                    ({album.reviewCount} {album.reviewCount === 1 ? 'review' : 'reviews'})
                  </span>
                )}
              </div>
            ) : (
              <span className="text-gray-400 text-sm">No reviews yet</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
