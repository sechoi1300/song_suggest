import Link from 'next/link'

interface AlbumCardProps {
  album: {
    id: string
    title: string
    artist: string[]
    releaseDate: Date | string
    releaseYear?: number | null
    numSongs?: number | null
    genres?: string[]
    coverImageUrl?: string | null
    averageRating?: number
    reviewCount?: number
  }
}

export default function AlbumCard({ album }: AlbumCardProps) {
  return (
    <Link href={`/albums/${album.id}`} className="group block">
      <div className="flex flex-col h-full transition-transform duration-200 group-hover:-translate-y-0.5">
        {/* Album Artwork Cover */}
        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-[#EAE4D9] border border-[#EAE4D9]/80 shadow-2xs">
          {album.coverImageUrl ? (
            <img
              src={album.coverImageUrl}
              alt={album.title}
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone-400 font-bold text-3xl">
              {album.title.charAt(0)}
            </div>
          )}

          {album.averageRating !== undefined && (
            <div className="absolute bottom-2 right-2 backdrop-blur-md bg-stone-900/80 text-white rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums">
              ★ {album.averageRating.toFixed(1)}
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="pt-2.5 pb-1 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-stone-900 group-hover:text-stone-600 transition-colors line-clamp-1">
              {album.title}
            </h3>
            <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">
              {Array.isArray(album.artist) ? album.artist.join(', ') : album.artist}
            </p>
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-stone-400 mt-1">
            {album.releaseYear && <span>{album.releaseYear}</span>}
            {album.genres && album.genres[0] && (
              <>
                <span>·</span>
                <span className="truncate">{album.genres[0]}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
