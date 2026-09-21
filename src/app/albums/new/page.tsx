import Navbar from '@/components/Navbar'
import CreateAlbumForm from '@/components/CreateAlbumForm'

export default function NewAlbumPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-stone-900">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white border border-[#EAE4D9] rounded-3xl shadow-xs p-6 sm:p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-black text-stone-900 tracking-tight">Add New Album</h1>
            <p className="text-stone-500 text-xs mt-1">
              Add an album to the community catalog so you and others can rate, rank, and compare it.
            </p>
          </div>
          <CreateAlbumForm />
        </div>
      </main>
    </div>
  )
}
