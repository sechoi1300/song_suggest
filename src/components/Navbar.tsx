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
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-stone-900 text-stone-100 flex items-center justify-center text-sm shadow-xs group-hover:bg-stone-800 transition-colors">
                🎵
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-tight text-stone-900 group-hover:text-stone-700 transition-colors">
                  Song Suggest
                </span>
                <span className="text-[10px] font-medium tracking-wider text-stone-500 uppercase -mt-0.5">
                  Beli for Albums
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                isActive('/')
                  ? 'bg-[#EAE4D9] text-stone-900 font-semibold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-[#F3EDE2]'
              }`}
            >
              Discover
            </Link>

            <Link
              href="/suggest"
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                isActive('/suggest')
                  ? 'bg-[#EAE4D9] text-stone-900 font-semibold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-[#F3EDE2]'
              }`}
            >
              <span>Suggest</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-[#DFD8CC] text-stone-700 font-semibold hidden sm:inline">
                AI
              </span>
            </Link>

            <Link
              href="/albums/new"
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                isActive('/albums/new')
                  ? 'bg-[#EAE4D9] text-stone-900 font-semibold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-[#F3EDE2]'
              }`}
            >
              Add Album
            </Link>

            {session ? (
              <div className="flex items-center space-x-2 pl-2 sm:pl-3 border-l border-stone-300">
                <Link
                  href="/profile"
                  className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                    isActive('/profile')
                      ? 'bg-[#EAE4D9] text-stone-900 font-semibold'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-[#F3EDE2]'
                  }`}
                >
                  {session.user?.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      className="h-6 w-6 rounded-full object-cover border border-stone-300"
                    />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-stone-900 text-stone-100 text-[10px] flex items-center justify-center font-bold">
                      {session.user?.name?.charAt(0) || 'U'}
                    </div>
                  )}
                  <span className="hidden md:inline font-medium">
                    {session.user?.name || 'My Beli'}
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="px-2.5 py-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-[#F3EDE2] text-xs font-medium transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="pl-1">
                <Link
                  href="/auth/signin"
                  className="px-3.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-50 text-xs sm:text-sm font-medium shadow-xs transition-colors cursor-pointer"
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
