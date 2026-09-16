import Navbar from '@/components/Navbar'
import CreateAlbumForm from '@/components/CreateAlbumForm'

export default function NewAlbumPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-black text-white tracking-tight">Add New Album</h1>
            <p className="text-slate-400 text-xs mt-1">
              Add an album to the community catalog so you and others can rate, rank, and compare it.
            </p>
          </div>
          <CreateAlbumForm />
        </div>
      </main>
    </div>
  )
}
