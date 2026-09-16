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
      <div className="bg-slate-900 border border-slate-800 hover:border-violet-500/50 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-violet-500/10 transition-all duration-300 group-hover:-translate-y-1 flex flex-col h-full">
        {/* Album Artwork Cover */}
        <div className="relative aspect-square w-full overflow-hidden bg-slate-950">
          {album.coverImageUrl ? (
            <img
              src={album.coverImageUrl}
              alt={album.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-violet-600 via-indigo-600 to-fuchsia-600 flex items-center justify-center">
              <span className="text-white text-5xl font-black">{album.title.charAt(0)}</span>
            </div>
          )}

          {/* Rating Pill Badge (Top Right) */}
          {album.averageRating !== undefined && tier && (
            <div className="absolute top-3 right-3 backdrop-blur-md bg-slate-950/80 border border-slate-700/60 rounded-xl px-2.5 py-1 flex items-center space-x-1 shadow-lg">
              <span className="text-white text-xs font-black">{album.averageRating.toFixed(1)}</span>
              <span className={`text-[10px] font-bold ${tier.textColor}`}>★</span>
            </div>
          )}

          {/* Year Pill (Top Left) */}
          {album.releaseYear && (
            <div className="absolute top-3 left-3 backdrop-blur-md bg-slate-950/70 border border-slate-800/80 text-slate-300 text-[10px] font-mono px-2 py-0.5 rounded-md">
              {album.releaseYear}
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white group-hover:text-violet-300 transition-colors line-clamp-1">
              {album.title}
            </h3>
            <p className="text-xs text-slate-400 font-medium line-clamp-1 mt-0.5">
              {Array.isArray(album.artist) ? album.artist.join(', ') : album.artist}
            </p>

            {/* Genres */}
            {album.genres && album.genres.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2.5">
                {album.genres.slice(0, 2).map((genre, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-slate-800/80 text-slate-400 text-[10px] font-medium rounded-md border border-slate-700/40"
                  >
                    {genre}
                  </span>
                ))}
                {album.genres.length > 2 && (
                  <span className="text-[10px] text-slate-500 self-center">
                    +{album.genres.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Card Footer: Tier name & review count */}
          <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            {tier ? (
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${tier.badgeBg} ${tier.borderColor} ${tier.textColor}`}
              >
                {tier.label}
              </span>
            ) : (
              <span className="text-slate-500 text-[11px]">Unrated</span>
            )}

            <span className="text-slate-500 text-[11px]">
              {album.reviewCount ? `${album.reviewCount} reviews` : 'Be first to rate'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
