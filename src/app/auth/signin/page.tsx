'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import Navbar from '@/components/Navbar'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleDemoSignIn = async (demoEmail: string, demoName: string) => {
    setIsLoading(true)
    await signIn('demo-login', {
      email: demoEmail,
      name: demoName,
      callbackUrl: '/',
    })
    setIsLoading(false)
  }

  const handleCustomCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setIsLoading(true)
    await signIn('demo-login', {
      email,
      name: name || email.split('@')[0],
      callbackUrl: '/',
    })
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <main className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 backdrop-blur-xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-500 shadow-lg shadow-violet-500/30 mb-4">
              <span className="text-2xl">🎵</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Welcome to Song Suggest
            </h1>
            <p className="text-sm text-slate-400 mt-2">
              The Beli experience for rating, ranking, and discovering albums.
            </p>
          </div>

          {/* Quick Demo Sign In */}
          <div className="space-y-3 mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 text-center">
              Quick Sign In (One-Click)
            </p>
            <button
              type="button"
              onClick={() => handleDemoSignIn('alex@songsuggest.app', 'Alex Morgan')}
              disabled={isLoading}
              className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium rounded-xl shadow-md shadow-violet-600/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
                  AM
                </span>
                <div className="text-left">
                  <div className="text-sm font-semibold">Sign in as Alex Morgan</div>
                  <div className="text-xs text-violet-200">Taste Profile: Hip-Hop & Indie</div>
                </div>
              </div>
              <span className="text-xs bg-white/20 px-2 py-1 rounded-md font-mono">1-Click</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoSignIn('jordan@songsuggest.app', 'Jordan Lee')}
              disabled={isLoading}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white font-medium rounded-xl hover:border-slate-600 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <span className="w-8 h-8 rounded-full bg-fuchsia-600/30 text-fuchsia-400 flex items-center justify-center font-bold text-sm">
                  JL
                </span>
                <div className="text-left">
                  <div className="text-sm font-semibold">Sign in as Jordan Lee</div>
                  <div className="text-xs text-slate-400">Taste Profile: Electronic & R&B</div>
                </div>
              </div>
              <span className="text-xs bg-slate-700 px-2 py-1 rounded-md font-mono text-slate-300">
                1-Click
              </span>
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-2 bg-slate-900 text-slate-500">Or use your name</span>
            </div>
          </div>

          <form onSubmit={handleCustomCredentialsSignIn} className="space-y-3 mb-6">
            <div>
              <label htmlFor="name" className="block text-xs font-medium text-slate-300 mb-1">
                Your Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sam Taylor"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder-slate-500"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-slate-300 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder-slate-500"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? 'Entering...' : 'Enter App'}
            </button>
          </form>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-2 bg-slate-900 text-slate-500">OAuth Providers</span>
            </div>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => signIn('google', { callbackUrl: '/' })}
              className="w-full flex items-center justify-center px-4 py-2 border border-slate-800 rounded-lg bg-slate-950/60 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </button>
            <button
              type="button"
              onClick={() => signIn('github', { callbackUrl: '/' })}
              className="w-full flex items-center justify-center px-4 py-2 border border-slate-800 rounded-lg bg-slate-950/60 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
              Sign in with GitHub
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
