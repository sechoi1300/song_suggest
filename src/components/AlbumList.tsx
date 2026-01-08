import { Album } from '@prisma/client'
import AlbumCard from './AlbumCard'

interface AlbumWithRating extends Album {
  averageRating?: number
  reviewCount?: number
}

interface AlbumListProps {
  albums: AlbumWithRating[]
}

export default function AlbumList({ albums }: AlbumListProps) {
  if (albums.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No albums found. Be the first to add one!</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {albums.map((album) => (
        <AlbumCard key={album.id} album={album} />
      ))}
    </div>
  )
}
