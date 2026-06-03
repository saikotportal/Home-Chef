import { useState } from 'react'
import areas from '../data/areas.json'

const popularAreas = areas.filter((a) => a.popular)
const allAreas = areas

export default function AreaModal({ onSelect }) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [showAll, setShowAll] = useState(false)

  const filtered = (showAll ? allAreas : popularAreas).filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleConfirm = () => {
    if (selected) onSelect(selected)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">

        {/* Header */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 px-6 pt-8 pb-10 text-center relative overflow-hidden">
          {/* decorative circles */}
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
          <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/10 rounded-full" />
          <div className="relative z-10">
            <div className="text-4xl mb-3">📍</div>
            <h2 className="text-2xl font-extrabold text-white">Where are you?</h2>
            <p className="text-orange-100 text-sm mt-1.5 leading-relaxed">
              Select your area to see chefs and meals near you
            </p>
          </div>
        </div>

        {/* Overlap card */}
        <div className="px-5 -mt-5">
          {/* Search input */}
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              className="w-full border-2 border-gray-200 focus:border-brand rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none bg-white shadow-lg transition-colors"
              placeholder="Search your area…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setShowAll(true) }}
              autoFocus
            />
          </div>
        </div>

        {/* Area list */}
        <div className="px-5 pt-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
              {showAll ? 'All Areas' : '⭐ Popular Areas'}
            </p>
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-xs text-brand font-semibold hover:underline"
            >
              {showAll ? 'Show popular' : 'See all areas'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
            {filtered.map((area) => (
              <button
                key={area.id}
                onClick={() => setSelected(area)}
                className={`relative overflow-hidden rounded-2xl text-left transition-all border-2 ${
                  selected?.id === area.id
                    ? 'border-brand shadow-md scale-[1.02]'
                    : 'border-transparent hover:border-orange-200'
                }`}
              >
                {/* Background image */}
                <div className="relative h-20">
                  <img
                    src={area.image}
                    alt={area.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&q=80' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* Selected checkmark */}
                  {selected?.id === area.id && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-brand rounded-full flex items-center justify-center shadow">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}

                  {/* Text */}
                  <div className="absolute bottom-2 left-3">
                    <p className="text-white font-bold text-sm leading-tight drop-shadow">{area.name}</p>
                    {area.chefCount > 0 ? (
                      <p className="text-white/80 text-xs drop-shadow">
                        {area.chefCount} chef{area.chefCount !== 1 ? 's' : ''}
                      </p>
                    ) : (
                      <p className="text-orange-300 text-xs drop-shadow">Coming soon</p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 mt-2">
          {selected ? (
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-orange-50 rounded-xl px-3 py-2">
                <p className="text-xs text-gray-400">Selected area</p>
                <p className="font-bold text-dark text-sm">📍 {selected.name}</p>
              </div>
              <button
                onClick={handleConfirm}
                className="btn-primary px-6 py-3 text-sm whitespace-nowrap"
              >
                Confirm →
              </button>
            </div>
          ) : (
            <p className="text-center text-sm text-gray-400">
              👆 Tap an area above to continue
            </p>
          )}
        </div>

      </div>
    </div>
  )
}
