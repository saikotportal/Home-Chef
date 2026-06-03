import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import chefs from '../data/chefs.json'
import meals from '../data/meals.json'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import PromoStrip from '../components/PromoStrip'
import { getChefStatus, hoursLabel, fmt12 } from '../utils/chefHours'

const CUISINE_FILTERS = [
  'All', 'Bengali', 'Mughlai', 'Indian', 'Chinese', 'Thai',
  'Japanese', 'Korean', 'Italian', 'Pizza', 'BBQ', 'Bar Food',
  'Mexican', 'Middle Eastern', 'Desserts', 'Healthy', 'African', 'Continental',
]

const SORT_OPTIONS = [
  { value: 'popular', label: '🔥 Most Popular' },
  { value: 'rating', label: '⭐ Top Rated' },
  { value: 'orders', label: '📦 Most Orders' },
]

function ChefCard({ chef, selectedArea }) {
  const chefMeals = meals.filter((m) => m.chefId === chef.id && m.available)
  const topMeals = chefMeals.slice(0, 3)

  const zoneDist = selectedArea ? Math.abs((chef.zone || 1) - selectedArea.zone) : null
  const distanceLabel = zoneDist === 0 ? 'Same area' : zoneDist === 1 ? 'Nearby' : zoneDist === 2 ? 'A bit far' : zoneDist !== null ? 'Far' : null
  const distanceColor = zoneDist === 0 ? 'bg-green-500' : zoneDist === 1 ? 'bg-blue-500' : 'bg-gray-500'

  const status = getChefStatus(chef)
  const isOpen = status === 'open' || status === '24h'
  const hours = hoursLabel(chef)

  return (
    <Link to={`/chef/${chef.id}`} className="group block bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
      {/* Cover image */}
      <div className="relative h-44 overflow-hidden bg-gray-100">
        <img
          src={chef.coverImage}
          alt={chef.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80' }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Availability badge */}
        <div className={`absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${status === '24h' ? 'bg-emerald-500 text-white' : isOpen ? 'bg-green-500 text-white' : 'bg-gray-700/90 text-gray-200'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-white animate-pulse' : 'bg-gray-400'}`} />
          {status === '24h' ? '24h Open' : isOpen ? 'Open' : 'Closed'}
        </div>

        {/* Distance badge */}
        {distanceLabel && (
          <div className={`absolute bottom-12 right-3 px-2 py-0.5 rounded-full text-xs font-bold text-white ${distanceColor}`}>
            📍 {distanceLabel}
          </div>
        )}

        {/* Rating pill */}
        <div className="absolute top-3 left-3 flex items-center gap-1 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-dark shadow-sm">
          ⭐ {chef.rating}
          <span className="text-gray-400 font-normal">({chef.totalReviews})</span>
        </div>

        {/* Chef avatar + name on image */}
        <div className="absolute bottom-3 left-4 flex items-center gap-2.5">
          <img
            src={chef.avatar}
            alt={chef.name}
            className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-md"
            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1607631568010-a87245c0daf4?w=200&q=80' }}
          />
          <div>
            <p className="text-white font-bold text-sm leading-tight drop-shadow">{chef.name}</p>
            <p className="text-white/80 text-xs drop-shadow">{chef.location}</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {/* Specialty + cuisines */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-bold text-dark text-base leading-tight">{chef.specialty}</h3>
            <p className="text-gray-400 text-xs mt-0.5">{chef.cuisines.join(' · ')}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-gray-400">{chef.totalOrders}+ orders</p>
            <p className="text-xs text-gray-400">Since {chef.joinedYear}</p>
          </div>
        </div>

        {/* Hours row */}
        {hours && (
          <div className={`mt-2 flex items-center gap-1.5 text-xs font-medium ${isOpen ? 'text-green-600' : 'text-gray-400'}`}>
            <span>🕐</span>
            {status === '24h' ? (
              <span>Open 24 hours</span>
            ) : isOpen ? (
              <span>Open now · closes {fmt12(chef.availableHours.close)}</span>
            ) : (
              <span>Closed · opens {fmt12(chef.availableHours.open)}</span>
            )}
          </div>
        )}

        {/* Mini menu preview */}
        {topMeals.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Popular items</p>
            <div className="space-y-1.5">
              {topMeals.map((meal) => (
                <div key={meal.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={meal.image}
                      alt={meal.name}
                      className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=100&q=80' }}
                    />
                    <span className="text-xs text-gray-600 truncate">{meal.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-dark flex-shrink-0 ml-2">৳{meal.price}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className={`mt-4 w-full py-2.5 rounded-xl text-center text-sm font-semibold transition-colors ${
          chef.available
            ? 'bg-orange-50 text-brand group-hover:bg-brand group-hover:text-white'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}>
          {chef.available ? 'View Menu →' : 'Currently Unavailable'}
        </div>
      </div>
    </Link>
  )
}

export default function Chefs() {
  const { toast } = useCart()
  const { selectedArea, changeArea } = useAuth()
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [sortBy, setSortBy] = useState('popular')
  const [showOpenOnly, setShowOpenOnly] = useState(false)

  const filtered = useMemo(() => {
    let list = [...chefs]

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.specialty.toLowerCase().includes(q) ||
          c.cuisines.some((cu) => cu.toLowerCase().includes(q)) ||
          c.location.toLowerCase().includes(q)
      )
    }

    if (activeFilter !== 'All') {
      list = list.filter((c) =>
        c.cuisines.some((cu) => cu.toLowerCase() === activeFilter.toLowerCase())
      )
    }

    if (showOpenOnly) {
      list = list.filter((c) => {
        const s = getChefStatus(c)
        return s === 'open' || s === '24h'
      })
    }

    // Sort by distance from selected area first, then by chosen sort
    if (selectedArea) {
      list.sort((a, b) => {
        const distA = Math.abs((a.zone || 1) - selectedArea.zone)
        const distB = Math.abs((b.zone || 1) - selectedArea.zone)
        if (distA !== distB) return distA - distB
        if (sortBy === 'rating') return b.rating - a.rating
        return b.totalOrders - a.totalOrders
      })
    } else {
      if (sortBy === 'popular') list.sort((a, b) => b.totalOrders - a.totalOrders)
      else if (sortBy === 'rating') list.sort((a, b) => b.rating - a.rating)
      else if (sortBy === 'orders') list.sort((a, b) => b.totalOrders - a.totalOrders)
    }

    return list
  }, [search, activeFilter, sortBy, showOpenOnly, selectedArea])

  const openCount = chefs.filter((c) => { const s = getChefStatus(c); return s === 'open' || s === '24h' }).length

  return (
    <div className="page-wrapper">
      {toast && (
        <div className={`fixed top-20 right-4 z-50 px-5 py-3 rounded-2xl shadow-lg text-white text-sm font-medium ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
          {toast.message}
        </div>
      )}

      {/* Hero banner */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 px-4 pt-10 pb-14">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
            👨‍🍳 Home Chefs Near You
          </h1>
          <p className="text-orange-100 mt-2 text-sm">
            {openCount} chef{openCount !== 1 ? 's' : ''} open now · Real homemade food, delivered
          </p>

          {/* Area chip */}
          {selectedArea ? (
            <button
              onClick={changeArea}
              className="mt-4 inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white px-4 py-2 rounded-2xl text-sm font-semibold transition-colors"
            >
              📍 {selectedArea.name}
              <span className="text-white/70 font-normal text-xs">· Change</span>
            </button>
          ) : (
            <button
              onClick={changeArea}
              className="mt-4 inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 border border-white/40 border-dashed text-white px-4 py-2 rounded-2xl text-sm transition-colors"
            >
              📍 Set your delivery area
            </button>
          )}

          {/* Search bar */}
          <div className="mt-6 max-w-xl mx-auto relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              className="input pl-10 bg-white shadow-sm"
              placeholder="Search chefs, cuisines, locations…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-5">
        {/* Cuisine filter pills */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 mb-6">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CUISINE_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                  activeFilter === f
                    ? 'bg-brand text-white border-brand'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-brand hover:text-brand'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Sort + toggle row */}
        <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
          <p className="text-sm text-gray-400">
            <span className="font-semibold text-dark">{filtered.length}</span> chef{filtered.length !== 1 ? 's' : ''} found
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Open only toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => setShowOpenOnly(!showOpenOnly)}
                className={`w-9 h-5 rounded-full transition-colors relative ${showOpenOnly ? 'bg-brand' : 'bg-gray-200'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${showOpenOnly ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-sm text-gray-600">Open now</span>
            </label>

            {/* Sort */}
            <select
              className="input text-sm w-auto"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Chef grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">👨‍🍳</div>
            <h3 className="font-semibold text-dark">No chefs found</h3>
            <p className="text-gray-400 text-sm mt-1">Try a different search or cuisine filter</p>
            <button
              onClick={() => { setSearch(''); setActiveFilter('All'); setShowOpenOnly(false) }}
              className="btn-primary mt-4 text-sm"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-12">
            {filtered.map((chef, idx) => (
              <>
                <ChefCard key={chef.id} chef={chef} selectedArea={selectedArea} />
                {/* Wide promo strip after the 2nd chef card */}
                {idx === 1 && (
                  <div key="promo-chefs" className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4">
                    <PromoStrip variant="biryani" />
                  </div>
                )}
              </>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
