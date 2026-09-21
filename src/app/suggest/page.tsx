import { getAlbumSuggestions } from '@/app/actions/suggest'
import { getUserWantToListen } from '@/app/actions/wantToListen'
import Navbar from '@/components/Navbar'
import SuggestionStudio from '@/components/SuggestionStudio'

export const dynamic = 'force-dynamic'

export default async function SuggestPage() {
  const [initialSuggestions, queueItems] = await Promise.all([
    getAlbumSuggestions(),
    getUserWantToListen(),
  ])

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-stone-900">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SuggestionStudio
          initialSuggestions={initialSuggestions}
          hasQueue={queueItems.length > 0}
        />
      </main>
    </div>
  )
}
