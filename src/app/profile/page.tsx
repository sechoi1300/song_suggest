import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import UserProfileTabs from '@/components/UserProfileTabs'
import { getUserRankedReviews } from '@/app/actions/reviews'
import { getUserWantToListen } from '@/app/actions/wantToListen'

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const [rankedReviews, wantToListenItems] = await Promise.all([
    getUserRankedReviews(session.user.id),
    getUserWantToListen(session.user.id),
  ])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <UserProfileTabs
          user={{
            name: session.user.name,
            email: session.user.email || 'user@songsuggest.app',
            image: session.user.image,
          }}
          rankedReviews={rankedReviews as any}
          wantToListenItems={wantToListenItems}
        />
      </main>
    </div>
  )
}
