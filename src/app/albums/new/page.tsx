import Navbar from '@/components/Navbar'
import CreateAlbumForm from '@/components/CreateAlbumForm'

export default function NewAlbumPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-stone-900">
      <Navbar />
      <main className="max-w-xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white border border-[#EAE4D9] rounded-2xl p-6 sm:p-7">
          <h1 className="text-xl font-semibold text-stone-900 mb-6">Add Album</h1>
          <CreateAlbumForm />
        </div>
      </main>
    </div>
  )
}
