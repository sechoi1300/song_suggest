'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { createReview } from '@/app/actions/reviews'
import { useRouter } from 'next/navigation'

interface ReviewFormProps {
  albumId: string
  initialRating?: number
  initialReviewText?: string
}

export default function ReviewForm({
  albumId,
  initialRating,
  initialReviewText,
}: ReviewFormProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [rating, setRating] = useState(initialRating || 5)
  const [reviewText, setReviewText] = useState(initialReviewText || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!session) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 mb-4">Please sign in to write a review</p>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    const result = await createReview(albumId, rating, reviewText)

    if (result.success) {
      setReviewText('')
      router.refresh()
    } else {
      setError(result.error || 'Failed to submit review')
    }

    setIsSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rating (0-10)
        </label>
        <div className="flex items-center space-x-4">
          <input
            type="range"
            min="0"
            max="10"
            value={rating}
            onChange={(e) => setRating(parseInt(e.target.value))}
            className="flex-1"
          />
          <span className="text-2xl font-bold text-yellow-500 w-16 text-center">
            {rating}
          </span>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0</span>
          <span>10</span>
        </div>
      </div>
      <div>
        <label htmlFor="reviewText" className="block text-sm font-medium text-gray-700 mb-2">
          Review (optional)
        </label>
        <textarea
          id="reviewText"
          rows={4}
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Share your thoughts about this album..."
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  )
}
