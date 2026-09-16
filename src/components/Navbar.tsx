'use client'

import Link from 'next/link'
import { useSession, signIn, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-fuchsia-600 flex items-center justify-center text-lg shadow-md shadow-violet-500/20 group-hover:scale-105 transition-transform">
                🎵
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tight text-white group-hover:text-violet-300 transition-colors">
                  Song Suggest
                </span>
                <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase -mt-1">
                  Beli for Albums
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-1 sm:space-x-3">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
                isActive('/')
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              Discover
            </Link>

            <Link
              href="/suggest"
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center space-x-1.5 ${
                isActive('/suggest')
                  ? 'bg-fuchsia-600/20 text-fuchsia-300 border border-fuchsia-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <span>Suggest</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-fuchsia-500/30 text-fuchsia-300 font-bold hidden sm:inline">
                AI
              </span>
            </Link>

            <Link
              href="/albums/new"
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
                isActive('/albums/new')
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              Add Album
            </Link>

            {session ? (
              <div className="flex items-center space-x-3 pl-2 sm:pl-3 border-l border-slate-800">
                <Link
                  href="/profile"
                  className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
                    isActive('/profile')
                      ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  {session.user?.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      className="h-6 w-6 rounded-full object-cover border border-slate-700"
                    />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-violet-600 text-white text-[10px] flex items-center justify-center font-bold">
                      {session.user?.name?.charAt(0) || 'U'}
                    </div>
                  )}
                  <span className="hidden md:inline font-bold">
                    {session.user?.name || 'My Beli'}
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-rose-400 text-xs font-semibold border border-slate-800 transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="pl-2">
                <Link
                  href="/auth/signin"
                  className="px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-violet-600/20 transition-all cursor-pointer"
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
