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
      <div className="text-center py-10 bg-white border border-[#EAE4D9] rounded-xl">
        <p className="text-stone-500 text-xs">No ratings yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} albumId={albumId} />
      ))}
    </div>
  )
}
