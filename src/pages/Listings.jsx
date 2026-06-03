import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import MealCard from '../components/MealCard'
import PromoStrip from '../components/PromoStrip'
import meals from '../data/meals.json'
import chefs from '../data/chefs.json'

const CATEGORIES = ['All', 'Bengali', 'Mughlai', 'Indian', 'Chinese', 'Thai', 'Japanese', 'Korean', 'Italian', 'Pizza', 'BBQ', 'Bar Food', 'Mexican', 'Middle Eastern', 'Desserts', 'Street Food', 'Healthy', 'African', 'Continental']

const SORT_OPTIONS = [
  { value: 'popular',    label: '🔥 Most Popular' },
  { value: 'rating',     label: '⭐ Top Rated' },
  { value: 'price_asc',  label: '💰 Price: Low → High' },
  { value: 'price_desc', label: '💰 Price: High → Low' },
  { value: 'fastest',    label: '⚡ Fastest First' },
]

const DIET_FILTERS = [
  { key: 'vegan',       label: '🌱 Vegan' },
  { key: 'vegetarian',  label: '🥦 Vegetarian' },
  { key: 'halal',       label: '✅ Halal' },
  { key: 'gluten-free', label: '🌾 Gluten-Free' },
  { key: 'spicy',       label: '🌶️ Spicy' },
]

// Estimate total delivery time from prepTime string
function estimatedDelivery(prepTime) {
  const match = prepTime?.match(/(\d+)/)
  const prep = match ? parseInt(match[1]) : 20
  return prep + 15
}

export default function Listings() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { toast } = useCart()

  const [search, setSearch]               = useState(searchParams.get('search') || '')
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'All')
  const [sortBy, setSortBy]               = useState('popular')
  const [priceRange, setPriceRange]       = useState([0, 500])
  const [showAvailableOnly, setShowAvailableOnly] = useState(false)
  const [openNowOnly, setOpenNowOnly] = useState(false)
  const [open24Only, setOpen24Only] = useState(false)
  const [topRatedOnly, setTopRatedOnly] = useState(false)
  const [newChefsOnly, setNewChefsOnly] = useState(false)
  const [selectedChefId, setSelectedChefId] = useState(searchParams.get('chef') || '')
  const [activeDiet, setActiveDiet]       = useState([]) // array of active diet keys
  const [showFilters, setShowFilters]     = useState(false) // mobile filter drawer

  useEffect(() => {
    const cat  = searchParams.get('category')
    const q    = searchParams.get('search')
    const chef = searchParams.get('chef')
    if (cat)  setActiveCategory(cat)
    if (q)    setSearch(q)
    if (chef) setSelectedChefId(chef)
  }, [])

  const toggleDiet = (key) => {
    setActiveDiet((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const filtered = useMemo(() => {
    let list = [...meals]

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q) ||
          m.tags?.some((t) => t.toLowerCase().includes(q))
      )
    }

    if (activeCategory !== 'All') {
      list = list.filter((m) => m.category === activeCategory)
    }

    if (selectedChefId) {
      list = list.filter((m) => m.chefId === selectedChefId)
    }

    list = list.filter((m) => m.price >= priceRange[0] && m.price <= priceRange[1])

    if (showAvailableOnly) {
      list = list.filter((m) => m.available)
    }

    if (openNowOnly) {
      list = list.filter((m) => {
        const chef = chefs.find((c) => c.id === m.chefId)
        if (chef?.open24Hours) return true
        if (!chef?.availableHours) return chef?.available ?? true
        const toMin = (t) => { const [h,m] = t.split(':').map(Number); return h*60+m }
        const now = new Date()
        const nowMin = now.getHours()*60 + now.getMinutes()
        return nowMin >= toMin(chef.availableHours.open) && nowMin < toMin(chef.availableHours.close)
      })
    }

    if (open24Only) {
      list = list.filter((m) => {
        const chef = chefs.find((c) => c.id === m.chefId)
        return chef?.open24Hours === true
      })
    }

    if (topRatedOnly) {
      list = list.filter((m) => m.rating >= 4.5)
    }

    if (newChefsOnly) {
      list = list.filter((m) => {
        const chef = chefs.find((c) => c.id === m.chefId)
        return chef?.joinedYear >= 2024
      })
    }

    // Dietary filters — each active key must be in meal tags
    if (activeDiet.length > 0) {
      list = list.filter((m) =>
        activeDiet.every((dk) =>
          m.tags?.some((t) => t.toLowerCase() === dk.toLowerCase())
        )
      )
    }

    if (sortBy === 'popular')    list.sort((a, b) => b.totalOrders - a.totalOrders)
    else if (sortBy === 'rating') list.sort((a, b) => b.rating - a.rating)
    else if (sortBy === 'price_asc')  list.sort((a, b) => a.price - b.price)
    else if (sortBy === 'price_desc') list.sort((a, b) => b.price - a.price)
    else if (sortBy === 'fastest') {
      list.sort((a, b) => estimatedDelivery(a.prepTime) - estimatedDelivery(b.prepTime))
    }

    return list
  }, [search, activeCategory, selectedChefId, priceRange, showAvailableOnly, openNowOnly, open24Only, topRatedOnly, newChefsOnly, sortBy, activeDiet])

  const clearFilters = () => {
    setSearch('')
    setActiveCategory('All')
    setSortBy('popular')
    setPriceRange([0, 500])
    setShowAvailableOnly(false)
    setOpenNowOnly(false)
    setOpen24Only(false)
    setTopRatedOnly(false)
    setNewChefsOnly(false)
    setSelectedChefId('')
    setActiveDiet([])
    setSearchParams({})
  }

  const hasActiveFilters =
    search || activeCategory !== 'All' || selectedChefId ||
    showAvailableOnly || openNowOnly || open24Only || topRatedOnly || newChefsOnly || priceRange[1] < 500 || activeDiet.length > 0

  const activeFilterCount = [
    search,
    activeCategory !== 'All',
    selectedChefId,
    showAvailableOnly,
    openNowOnly,
    open24Only,
    topRatedOnly,
    newChefsOnly,
    priceRange[1] < 500,
    ...activeDiet,
  ].filter(Boolean).length

  const SidebarContent = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-dark text-sm">Filters</h3>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="text-xs text-brand hover:underline">
            Clear all
          </button>
        )}
      </div>

      {/* Dietary filters */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Dietary</p>
        <div className="flex flex-wrap gap-2">
          {DIET_FILTERS.map((df) => (
            <button
              key={df.key}
              onClick={() => toggleDiet(df.key)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                activeDiet.includes(df.key)
                  ? 'bg-brand text-white border-brand shadow-sm'
                  : 'border-gray-200 text-gray-600 hover:border-brand hover:text-brand bg-white'
              }`}
            >
              {df.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Cuisine</p>
        <div className="space-y-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
                activeCategory === cat
                  ? 'bg-orange-50 text-brand font-semibold'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Chef filter */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Chef</p>
        <select
          className="input text-sm"
          value={selectedChefId}
          onChange={(e) => setSelectedChefId(e.target.value)}
        >
          <option value="">All Chefs</option>
          {chefs.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Price range */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Max Price: ৳{priceRange[1]}
        </p>
        <input
          type="range"
          min={0} max={500} step={10}
          value={priceRange[1]}
          onChange={(e) => setPriceRange([0, Number(e.target.value)])}
          className="w-full accent-brand"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>৳0</span><span>৳500</span>
        </div>
      </div>

      {/* Toggles */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Availability</p>
        <div className="space-y-3">
          {[
            { label: '🟢 Open Now', value: openNowOnly, set: setOpenNowOnly },
            { label: '🕐 Open 24h', value: open24Only, set: setOpen24Only },
            { label: '✅ Meal Available', value: showAvailableOnly, set: setShowAvailableOnly },
            { label: '⭐ Top Rated (4.5+)', value: topRatedOnly, set: setTopRatedOnly },
            { label: '🆕 New Chefs', value: newChefsOnly, set: setNewChefsOnly },
          ].map(({ label, value, set }) => (
            <label key={label} className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => set(!value)}
                className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${value ? 'bg-brand' : 'bg-gray-200'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-sm text-gray-600">{label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="page-wrapper">
      {toast && (
        <div className={`fixed top-20 right-4 z-50 px-5 py-3 rounded-2xl shadow-lg text-white text-sm font-medium ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
          {toast.message}
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 pt-8 pb-0">
        {/* Header */}
        <div className="mb-6">
          <h1 className="section-title">Browse Meals</h1>
          <p className="text-gray-400 text-sm mt-1">
            {filtered.length} meal{filtered.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Search + Sort bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              className="input pl-10"
              placeholder="Search meals, ingredients, tags…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="input sm:w-52"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {/* Mobile filter button */}
          <button
            onClick={() => setShowFilters(true)}
            className="lg:hidden flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:border-brand hover:text-brand transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M7 8h10M11 12h4" />
            </svg>
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-brand text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Active diet pills quick row */}
        <div className="flex flex-wrap gap-2 mb-5">
          {DIET_FILTERS.map((df) => (
            <button
              key={df.key}
              onClick={() => toggleDiet(df.key)}
              className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                activeDiet.includes(df.key)
                  ? 'bg-brand text-white border-brand'
                  : 'border-gray-200 text-gray-500 hover:border-brand hover:text-brand bg-white'
              }`}
            >
              {df.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-6" style={{height: 'calc(100vh - 220px)'}}>
          {/* Sidebar — desktop, independently scrollable */}
          <aside className="hidden lg:block lg:w-56 flex-shrink-0 overflow-y-auto pr-1" style={{height: '100%'}}>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <SidebarContent />
            </div>
          </aside>

          {/* Meal Grid — independently scrollable */}
          <div className="flex-1 overflow-y-auto pr-1" style={{height: '100%'}}>
            {/* Category pills (mobile/tablet) */}
            <div className="flex gap-2 overflow-x-auto pb-1 mb-5 lg:hidden">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    activeCategory === cat
                      ? 'bg-brand text-white border-brand'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-brand'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">🍽️</div>
                <h3 className="font-semibold text-dark">No meals found</h3>
                <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or search terms</p>
                <button onClick={clearFilters} className="btn-primary mt-4 text-sm">Clear Filters</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map((meal, idx) => (
                  <>
                    <MealCard key={meal.id} meal={meal} />
                    {(idx + 1) % 6 === 0 && idx !== filtered.length - 1 && (
                      <div key={`promo-${idx}`} className="col-span-1 sm:col-span-2 xl:col-span-3">
                        <PromoStrip variant={['biryani', 'veg', 'newchef', 'freedel'][Math.floor((idx / 6)) % 4]} />
                      </div>
                    )}
                  </>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowFilters(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-dark text-base">Filters</h2>
              <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-dark">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <SidebarContent />
            <button
              onClick={() => setShowFilters(false)}
              className="btn-primary w-full mt-6 py-3"
            >
              Show {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
