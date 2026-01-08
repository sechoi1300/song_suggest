'use client'

import { Review, User } from '@prisma/client'
import { useSession } from 'next-auth/react'
import { deleteReview } from '@/app/actions/reviews'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface ReviewWithUser extends Review {
  user: Pick<User, 'id' | 'name' | 'image' | 'email'>
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
    if (!confirm('Are you sure you want to delete this review?')) {
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

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3 flex-1">
          {review.user.image ? (
            <img
              src={review.user.image}
              alt={review.user.name || 'User'}
              className="h-10 w-10 rounded-full"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-gray-600 font-medium">
                {review.user.name?.charAt(0) || review.user.email.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h4 className="font-semibold text-gray-900">
                {review.user.name || review.user.email}
              </h4>
              <span className="text-yellow-500 font-bold">{review.rating}</span>
              <span className="text-gray-500 text-sm">/ 10</span>
            </div>
            <p className="text-gray-500 text-sm">{formatDate(review.createdAt)}</p>
          </div>
        </div>
        {isOwnReview && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-red-500 hover:text-red-700 text-sm font-medium disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        )}
      </div>
      {review.reviewText && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-gray-700 whitespace-pre-wrap">{review.reviewText}</p>
        </div>
      )}
    </div>
  )
}
