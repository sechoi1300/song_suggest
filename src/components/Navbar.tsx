'use client'

import Link from 'next/link'
import { useSession, signIn, signOut } from 'next-auth/react'

export default function Navbar() {
  const { data: session } = useSession()

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Song Suggest
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/albums/new"
              className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Add Album
            </Link>
            {session ? (
              <>
                <Link
                  href="/profile"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Profile
                </Link>
                <div className="flex items-center space-x-2">
                  {session.user?.image && (
                    <img
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      className="h-8 w-8 rounded-full"
                    />
                  )}
                  <span className="text-gray-700 text-sm">{session.user?.name || session.user?.email}</span>
                  <button
                    onClick={() => signOut()}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={() => signIn()}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
