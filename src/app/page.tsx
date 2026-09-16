import { getAlbums } from './actions/albums'
import AlbumList from '@/components/AlbumList'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { BELI_TIERS } from '@/lib/beli'

export default async function Home() {
  const albums = await getAlbums()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Beli Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-950/80 via-slate-900 to-slate-950 border border-slate-800 p-8 sm:p-12 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 bg-fuchsia-600/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold mb-4">
              <span>🎧 The Beli for Music & Vinyl</span>
              <span>•</span>
              <span>Head-to-Head Comparisons</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
              Rate, rank & discover albums.
            </h1>

            <p className="text-base sm:text-lg text-slate-300 mt-4 leading-relaxed">
              Never wonder whether an album is an 8.4 or an 8.7 again. Compare albums head-to-head, curate your personal ranked leaderboard, and get intelligent recommendations based on your unique taste profile.
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-8">
              <Link
                href="/suggest"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold text-sm shadow-xl shadow-violet-600/25 transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center space-x-2"
              >
                <span>✨ Suggest an Album</span>
              </Link>

              <Link
                href="/albums/new"
                className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white font-semibold text-sm border border-slate-700 transition-all cursor-pointer"
              >
                <span>➕ Add New Album</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Beli Rating Tiers Guide */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              The Beli Score Tiers
            </span>
            <span className="text-xs text-slate-500">
              Rank placements automatically calculate dynamic decimal ratings
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {Object.values(BELI_TIERS).map((tier) => (
              <div
                key={tier.tier}
                className={`p-3 rounded-xl border ${tier.badgeBg} ${tier.borderColor} flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-black ${tier.textColor}`}>
                      ★ {tier.label}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {tier.tier === 'EXCEPTIONAL'
                        ? '9.0 - 10.0'
                        : tier.tier === 'GREAT'
                        ? '8.0 - 8.9'
                        : tier.tier === 'GOOD'
                        ? '7.0 - 7.9'
                        : tier.tier === 'MEDIOCRE'
                        ? '6.0 - 6.9'
                        : '< 6.0'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{tier.sublabel}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Catalog Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Explore Albums</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Click any album to log your rating or launch a head-to-head matchup
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500">
              {albums.length} albums in catalog
            </span>
          </div>

          <AlbumList albums={albums} />
        </div>
      </main>
    </div>
  )
}
