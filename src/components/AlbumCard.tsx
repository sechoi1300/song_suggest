import Link from 'next/link'
import { getTierFromScore } from '@/lib/beli'

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
  const tier = album.averageRating ? getTierFromScore(album.averageRating) : null

  return (
    <Link href={`/albums/${album.id}`} className="group block">
      <div className="bg-white border border-[#EAE4D9] hover:border-stone-400 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 group-hover:-translate-y-0.5 flex flex-col h-full">
        {/* Album Artwork Cover */}
        <div className="relative aspect-square w-full overflow-hidden bg-[#F3EDE2]">
          {album.coverImageUrl ? (
            <img
              src={album.coverImageUrl}
              alt={album.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-[#EAE4D9] flex items-center justify-center text-stone-500">
              <span className="text-4xl font-bold">{album.title.charAt(0)}</span>
            </div>
          )}

          {/* Rating Pill Badge (Top Right) */}
          {album.averageRating !== undefined && tier && (
            <div className="absolute top-3 right-3 backdrop-blur-sm bg-white/95 border border-[#E0D7C9] rounded-lg px-2 py-0.5 flex items-center space-x-1 shadow-xs">
              <span className="text-stone-900 text-xs font-bold">{album.averageRating.toFixed(1)}</span>
              <span className={`text-[10px] font-bold ${tier.textColor}`}>★</span>
            </div>
          )}

          {/* Year Pill (Top Left) */}
          {album.releaseYear && (
            <div className="absolute top-3 left-3 backdrop-blur-sm bg-white/90 border border-stone-200/80 text-stone-700 text-[10px] font-mono px-2 py-0.5 rounded-md shadow-xs">
              {album.releaseYear}
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-stone-900 group-hover:text-stone-700 transition-colors line-clamp-1">
              {album.title}
            </h3>
            <p className="text-xs text-stone-500 font-medium line-clamp-1 mt-0.5">
              {Array.isArray(album.artist) ? album.artist.join(', ') : album.artist}
            </p>

            {/* Genres */}
            {album.genres && album.genres.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2.5">
                {album.genres.slice(0, 2).map((genre, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-[#F4EFE6] text-stone-600 text-[10px] font-medium rounded-md border border-[#E5DEC7]"
                  >
                    {genre}
                  </span>
                ))}
                {album.genres.length > 2 && (
                  <span className="text-[10px] text-stone-400 self-center">
                    +{album.genres.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Card Footer: Tier name & review count */}
          <div className="pt-3 mt-3 border-t border-[#F0EAE1] flex items-center justify-between text-xs">
            {tier ? (
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${tier.badgeBg} ${tier.borderColor} ${tier.textColor}`}
              >
                {tier.label}
              </span>
            ) : (
              <span className="text-stone-400 text-[11px]">Unrated</span>
            )}

            <span className="text-stone-400 text-[11px]">
              {album.reviewCount ? `${album.reviewCount} reviews` : 'Be first to rate'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
