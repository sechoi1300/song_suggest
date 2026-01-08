import Navbar from '@/components/Navbar'
import CreateAlbumForm from '@/components/CreateAlbumForm'

export default function NewAlbumPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Add New Album</h1>
          <CreateAlbumForm />
        </div>
      </main>
    </div>
  )
}
