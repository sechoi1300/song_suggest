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
    <div className="bg-white border border-[#EAE4D9] rounded-xl p-4 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {review.user.image ? (
            <img
              src={review.user.image}
              alt={review.user.name || 'User'}
              className="h-9 w-9 rounded-full object-cover border border-[#EAE4D9]"
            />
          ) : (
            <div className="h-9 w-9 rounded-full bg-[#EAE4D9] text-stone-700 font-medium text-xs flex items-center justify-center">
              {review.user.name?.charAt(0) || review.user.email.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-stone-900 text-xs truncate">
                {review.user.name || review.user.email.split('@')[0]}
              </span>
              {review.rank && (
                <span className="text-[10px] text-stone-500 font-mono">
                  #{review.rank}
                </span>
              )}
              <span className="text-stone-400 text-[11px] font-mono">· {formatDate(review.createdAt)}</span>
            </div>

            {/* Score + Tier */}
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span className="text-sm font-semibold text-stone-900">{review.rating.toFixed(1)}</span>
              <span className="text-[10px] text-stone-400 font-mono">/10</span>
              <span className="text-[10px] text-stone-500 font-medium ml-1">
                {tier.label}
              </span>
              {review.listenedWith && (
                <span className="text-[11px] text-stone-400">
                  · {review.listenedWith}
                </span>
              )}
            </div>
          </div>
        </div>

        {isOwnReview && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-stone-300 hover:text-stone-700 text-xs px-1 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isDeleting ? '...' : '✕'}
          </button>
        )}
      </div>

      {/* Favorite Tracks & Skip Track */}
      {((review.favoriteTracks && review.favoriteTracks.length > 0) || review.skipTrack) && (
        <div className="mt-2.5 pt-2 border-t border-[#F0EAE1] flex flex-wrap gap-2 text-xs">
          {review.favoriteTracks && review.favoriteTracks.length > 0 && (
            <div className="flex items-center flex-wrap gap-1">
              {review.favoriteTracks.map((track, i) => (
                <span
                  key={i}
                  className="text-[11px] text-stone-600 bg-[#FAF7F2] border border-[#EAE4D9] px-2 py-0.5 rounded-md"
                >
                  ★ {track}
                </span>
              ))}
            </div>
          )}

          {review.skipTrack && (
            <span className="text-[11px] text-stone-400 px-2 py-0.5">
              Skip: {review.skipTrack}
            </span>
          )}
        </div>
      )}

      {/* Vibes Chips */}
      {review.vibes && review.vibes.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {review.vibes.map((vibe, i) => (
            <span
              key={i}
              className="text-[10px] px-2 py-0.5 rounded-md bg-[#FAF7F2] text-stone-500 border border-[#EAE4D9]"
            >
              #{vibe}
            </span>
          ))}
        </div>
      )}

      {/* Review Text */}
      {review.reviewText && (
        <p className="mt-2.5 pt-2 text-xs text-stone-600 border-t border-[#F0EAE1] leading-relaxed">
          {review.reviewText}
        </p>
      )}
    </div>
  )
}
