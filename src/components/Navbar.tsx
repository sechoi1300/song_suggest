'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  return (
    <nav className="sticky top-0 z-50 bg-[#FAF7F2]/90 backdrop-blur-md border-b border-[#EAE4D9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 text-stone-900 font-semibold tracking-tight text-sm hover:opacity-80 transition-opacity">
            <span className="w-6 h-6 rounded-md bg-stone-900 text-stone-100 flex items-center justify-center text-xs font-bold">
              S
            </span>
            <span>Song Suggest</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-1 sm:space-x-2 text-xs">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                isActive('/')
                  ? 'bg-[#EAE4D9] text-stone-900 font-medium'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-[#F3EDE2]'
              }`}
            >
              Discover
            </Link>

            <Link
              href="/suggest"
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                isActive('/suggest')
                  ? 'bg-[#EAE4D9] text-stone-900 font-medium'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-[#F3EDE2]'
              }`}
            >
              Suggest
            </Link>

            <Link
              href="/albums/new"
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                isActive('/albums/new')
                  ? 'bg-[#EAE4D9] text-stone-900 font-medium'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-[#F3EDE2]'
              }`}
            >
              Add
            </Link>

            {session ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-stone-300">
                <Link
                  href="/profile"
                  className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-lg transition-colors ${
                    isActive('/profile')
                      ? 'bg-[#EAE4D9] text-stone-900 font-medium'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-[#F3EDE2]'
                  }`}
                >
                  {session.user?.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      className="h-5 w-5 rounded-full object-cover border border-stone-300"
                    />
                  ) : (
                    <div className="h-5 w-5 rounded-full bg-stone-900 text-stone-100 text-[9px] flex items-center justify-center font-bold">
                      {session.user?.name?.charAt(0) || 'U'}
                    </div>
                  )}
                  <span className="hidden sm:inline font-medium">
                    {session.user?.name || 'Profile'}
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="px-2 py-1 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="pl-1">
                <Link
                  href="/auth/signin"
                  className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-50 font-medium transition-colors cursor-pointer"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
