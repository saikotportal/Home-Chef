import { useState, useMemo, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import MealCard from '../components/MealCard'
import meals from '../data/meals.json'
import chefs from '../data/chefs.json'

const DIET_TAGS = ['vegetarian', 'spicy', 'bestseller', 'halal', 'light', 'street food']
const SORT_OPTIONS = [
  { value: 'popular', label: '🔥 Most Popular' },
  { value: 'rating', label: '⭐ Top Rated' },
  { value: 'price_asc', label: '💰 Price: Low → High' },
  { value: 'price_desc', label: '💰 Price: High → Low' },
]

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { toast } = useCart()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [activeTag, setActiveTag] = useState('')
  const [sortBy, setSortBy] = useState('popular')
  const [maxPrice, setMaxPrice] = useState(500)
  const [tab, setTab] = useState('meals') // 'meals' | 'chefs'

  // Sync query param on mount
  useEffect(() => {
    const q = searchParams.get('q')
    if (q) setQuery(q)
  }, [])

  // Update URL when query changes
  useEffect(() => {
    if (query.trim()) {
      setSearchParams({ q: query.trim() })
    } else {
      setSearchParams({})
    }
  }, [query])

  const filteredMeals = useMemo(() => {
    let list = [...meals]
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q) ||
          m.tags?.some((t) => t.toLowerCase().includes(q))
      )
    }
    if (activeTag) {
      list = list.filter((m) => m.tags?.some((t) => t.toLowerCase() === activeTag.toLowerCase()))
    }
    list = list.filter((m) => m.price <= maxPrice)
    if (sortBy === 'popular') list.sort((a, b) => b.totalOrders - a.totalOrders)
    else if (sortBy === 'rating') list.sort((a, b) => b.rating - a.rating)
    else if (sortBy === 'price_asc') list.sort((a, b) => a.price - b.price)
    else if (sortBy === 'price_desc') list.sort((a, b) => b.price - a.price)
    return list
  }, [query, activeTag, sortBy, maxPrice])

  const filteredChefs = useMemo(() => {
    if (!query.trim()) return chefs
    const q = query.toLowerCase()
    return chefs.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.specialty.toLowerCase().includes(q) ||
        c.cuisines.some((cu) => cu.toLowerCase().includes(q)) ||
        c.bio.toLowerCase().includes(q)
    )
  }, [query])

  const hasQuery = query.trim().length > 0

  return (
    <div className="page-wrapper">
      {toast && (
        <div className={`fixed top-20 right-4 z-50 px-5 py-3 rounded-2xl shadow-lg text-white text-sm font-medium ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
          {toast.message}
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <h1 className="section-title text-center mb-2">Search</h1>
          <p className="text-center text-gray-400 text-sm mb-6">Find meals, cuisines, chefs and more</p>
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              autoFocus
              className="input pl-12 pr-12 py-3.5 text-base rounded-2xl shadow-sm"
              placeholder="Try 'biryani', 'vegetarian', 'Rashida'…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-dark transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Diet/Tag pills */}
          <div className="flex gap-2 flex-wrap mt-4 justify-center">
            {DIET_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? '' : tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all capitalize ${
                  activeTag === tag
                    ? 'bg-brand text-white border-brand'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-brand hover:text-brand'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Empty state before search */}
        {!hasQuery && !activeTag && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-lg font-semibold text-dark mb-2">What are you craving?</h2>
            <p className="text-gray-400 text-sm mb-6">Search for a dish, cuisine, or chef name above</p>
            <div className="flex flex-wrap justify-center gap-2">
              {['Biryani', 'Hilsa', 'Vegetarian', 'BBQ', 'Street Food', 'Priya'].map((s) => (
                <button
                  key={s}
                  onClick={() => setQuery(s)}
                  className="bg-white border border-gray-200 text-gray-600 text-sm px-4 py-2 rounded-xl hover:border-brand hover:text-brand transition-all shadow-sm"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {(hasQuery || activeTag) && (
          <>
            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl w-fit mx-auto mb-6">
              <button
                onClick={() => setTab('meals')}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${tab === 'meals' ? 'bg-white text-dark shadow-sm' : 'text-gray-500 hover:text-dark'}`}
              >
                🍽️ Meals ({filteredMeals.length})
              </button>
              <button
                onClick={() => setTab('chefs')}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${tab === 'chefs' ? 'bg-white text-dark shadow-sm' : 'text-gray-500 hover:text-dark'}`}
              >
                👨‍🍳 Chefs ({filteredChefs.length})
              </button>
            </div>

            {tab === 'meals' && (
              <>
                {/* Sort + price */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6 items-center">
                  <select
                    className="input sm:w-52"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-sm text-gray-500 whitespace-nowrap">Max: ৳{maxPrice}</span>
                    <input
                      type="range" min={0} max={500} step={10}
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(Number(e.target.value))}
                      className="flex-1 accent-brand"
                    />
                  </div>
                </div>

                {filteredMeals.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-5xl mb-3">😔</div>
                    <h3 className="font-semibold text-dark">No meals found</h3>
                    <p className="text-gray-400 text-sm mt-1">Try a different keyword or remove filters</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filteredMeals.map((meal) => (
                      <MealCard key={meal.id} meal={meal} />
                    ))}
                  </div>
                )}
              </>
            )}

            {tab === 'chefs' && (
              <>
                {filteredChefs.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-5xl mb-3">👨‍🍳</div>
                    <h3 className="font-semibold text-dark">No chefs found</h3>
                    <p className="text-gray-400 text-sm mt-1">Try searching by name or cuisine</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filteredChefs.map((chef) => (
                      <Link
                        key={chef.id}
                        to={`/chef/${chef.id}`}
                        className="card p-5 flex flex-col items-center text-center group"
                      >
                        <div className="relative">
                          <img
                            src={chef.avatar}
                            alt={chef.name}
                            className="w-16 h-16 rounded-full bg-gray-100 group-hover:scale-105 transition-transform duration-200"
                          />
                          {chef.available && (
                            <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 border-2 border-white rounded-full" />
                          )}
                        </div>
                        <h3 className="font-semibold text-dark text-sm mt-3">{chef.name}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{chef.specialty}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                          <span>⭐ {chef.rating}</span>
                          <span>•</span>
                          <span>{chef.totalOrders} orders</span>
                        </div>
                        <div className="flex flex-wrap justify-center gap-1 mt-3">
                          {chef.cuisines.slice(0, 2).map((c) => (
                            <span key={c} className="badge bg-orange-50 text-brand text-xs">{c}</span>
                          ))}
                        </div>
                        <span className={`mt-3 text-xs font-semibold ${chef.available ? 'text-green-600' : 'text-gray-400'}`}>
                          {chef.available ? '● Open now' : '○ Unavailable'}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
