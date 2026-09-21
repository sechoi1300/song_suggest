import { getAlbums } from './actions/albums'
import AlbumList from '@/components/AlbumList'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { BELI_TIERS } from '@/lib/beli'

export default async function Home() {
  const albums = await getAlbums()

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-stone-900">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Beli Hero Section */}
        <div className="relative rounded-3xl bg-[#F4EFE6] border border-[#E3DCCE] p-8 sm:p-12 shadow-xs">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#EAE4D9] border border-[#D9D1C3] text-stone-800 text-xs font-medium mb-4">
              <span>🎧 The Beli for Music & Vinyl</span>
              <span>•</span>
              <span>Head-to-Head Comparisons</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-stone-900 leading-tight">
              Rate, rank & discover albums.
            </h1>

            <p className="text-base sm:text-lg text-stone-600 mt-4 leading-relaxed">
              Never wonder whether an album is an 8.4 or an 8.7 again. Compare albums head-to-head, curate your personal ranked leaderboard, and get intelligent recommendations based on your unique taste profile.
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-8">
              <Link
                href="/suggest"
                className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-50 font-medium text-sm shadow-xs transition-colors cursor-pointer flex items-center space-x-2"
              >
                <span>✨ Suggest an Album</span>
              </Link>

              <Link
                href="/albums/new"
                className="px-5 py-2.5 rounded-xl bg-white hover:bg-stone-50 text-stone-800 font-medium text-sm border border-[#D9D1C3] transition-colors shadow-xs cursor-pointer"
              >
                <span>➕ Add New Album</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Score Tiers Guide */}
        <div className="bg-[#F7F4EE] border border-[#EAE4D9] rounded-2xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              The Rating Score Tiers
            </span>
            <span className="text-xs text-stone-400">
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
                    <span className={`text-xs font-bold ${tier.textColor}`}>
                      ★ {tier.label}
                    </span>
                    <span className="text-[11px] font-mono text-stone-500">
                      {tier.tier === 'EXCEPTIONAL'
                        ? '9.0 - 10.0'
                        : tier.tier === 'GREAT'
                        ? '8.0 - 8.9'
                        : tier.tier === 'GOOD'
                        ? '7.0 - 7.9'
                        : tier.tier === 'MEDIOCRE'
                        ? '5.0 - 6.9'
                        : '< 5.0'}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 mt-1">{tier.sublabel}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Catalog Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-black text-stone-900 tracking-tight">Explore Albums</h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Click any album to log your rating or launch a head-to-head matchup
              </p>
            </div>
            <span className="text-xs font-mono text-stone-500">
              {albums.length} albums in catalog
            </span>
          </div>

          <AlbumList albums={albums} />
        </div>
      </main>
    </div>
  )
}
