'use client'

import { useSession } from 'next-auth/react'
import { deleteReview } from '@/app/actions/reviews'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { getTierFromScore } from '@/lib/beli'

interface ReviewWithUser {
  id: string
  userId: string
  rating: number
  rank?: number | null
  tier?: string | null
  favoriteTracks?: string[]
  skipTrack?: string | null
  vibes?: string[]
  listenAgain?: string | null
  listenedWith?: string | null
  reviewText?: string | null
  createdAt: Date | string
  user: {
    id: string
    name?: string | null
    image?: string | null
    email: string
  }
}

interface ReviewCardProps {
  review: ReviewWithUser
  albumId: string
}

export default function ReviewCard({ review, albumId }: ReviewCardProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this rating from your leaderboard?')) {
      return
    }

    setIsDeleting(true)
    const result = await deleteReview(review.id, albumId)
    if (result.success) {
      router.refresh()
    }
    setIsDeleting(false)
  }

  const isOwnReview = session?.user?.id === review.userId
  const tier = getTierFromScore(review.rating)

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 transition-all hover:border-slate-700">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3 flex-1">
          {review.user.image ? (
            <img
              src={review.user.image}
              alt={review.user.name || 'User'}
              className="h-11 w-11 rounded-full object-cover border border-slate-700"
            />
          ) : (
            <div className="h-11 w-11 rounded-full bg-violet-600/30 text-violet-300 font-bold flex items-center justify-center border border-violet-500/30">
              {review.user.name?.charAt(0) || review.user.email.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-bold text-white text-sm">
                {review.user.name || review.user.email.split('@')[0]}
              </h4>
              {review.rank && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-400/10 text-amber-300 border border-amber-400/20">
                  Ranked #{review.rank}
                </span>
              )}
              <span className="text-slate-500 text-xs">• {formatDate(review.createdAt)}</span>
            </div>

            {/* Beli Score + Tier Badge */}
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xl font-black text-white">{review.rating.toFixed(1)}</span>
              <span className="text-xs text-slate-400">/ 10</span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${tier.badgeBg} ${tier.borderColor} ${tier.textColor}`}
              >
                ★ {tier.label}
              </span>
              {review.listenedWith && (
                <span className="text-xs text-slate-400 hidden sm:inline">
                  via {review.listenedWith}
                </span>
              )}
            </div>
          </div>
        </div>

        {isOwnReview && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-slate-500 hover:text-rose-400 text-xs font-semibold px-2 py-1 rounded-lg hover:bg-rose-500/10 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isDeleting ? 'Removing...' : 'Delete'}
          </button>
        )}
      </div>

      {/* Favorite Tracks & Skip Track */}
      {((review.favoriteTracks && review.favoriteTracks.length > 0) || review.skipTrack) && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap gap-2 text-xs">
          {review.favoriteTracks && review.favoriteTracks.length > 0 && (
            <div className="flex items-center flex-wrap gap-1">
              <span className="text-slate-500 font-semibold">Favorites:</span>
              {review.favoriteTracks.map((track, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-md bg-violet-600/20 text-violet-300 border border-violet-500/30 font-medium"
                >
                  ★ {track}
                </span>
              ))}
            </div>
          )}

          {review.skipTrack && (
            <div className="flex items-center gap-1">
              <span className="text-slate-500 font-semibold">Skip:</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-medium">
                {review.skipTrack}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Vibes Chips */}
      {review.vibes && review.vibes.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {review.vibes.map((vibe, i) => (
            <span
              key={i}
              className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-400 border border-slate-700/50"
            >
              #{vibe}
            </span>
          ))}
        </div>
      )}

      {/* Review Text */}
      {review.reviewText && (
        <div className="mt-3 pt-2 text-sm text-slate-300 border-t border-slate-800/50 leading-relaxed">
          {review.reviewText}
        </div>
      )}
    </div>
  )
}
