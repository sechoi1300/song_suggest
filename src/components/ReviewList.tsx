import ReviewCard from './ReviewCard'

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

interface ReviewListProps {
  reviews: ReviewWithUser[]
  albumId: string
}

export default function ReviewList({ reviews, albumId }: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 bg-[#F5F1E9]/60 border border-[#E3DCCE] rounded-2xl">
        <span className="text-3xl mb-2 block">🎵</span>
        <p className="text-stone-700 font-medium">No reviews logged yet.</p>
        <p className="text-stone-500 text-xs mt-1">Be the first to rate and rank this album!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} albumId={albumId} />
      ))}
    </div>
  )
}
