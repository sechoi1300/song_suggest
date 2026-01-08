import { Review, User } from '@prisma/client'
import ReviewCard from './ReviewCard'

interface ReviewWithUser extends Review {
  user: Pick<User, 'id' | 'name' | 'image' | 'email'>
}

interface ReviewListProps {
  reviews: ReviewWithUser[]
  albumId: string
}

export default function ReviewList({ reviews, albumId }: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No reviews yet. Be the first to review this album!</p>
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
