import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useFavorites } from '../context/FavoritesContext'
import MealCard from '../components/MealCard'
import chefs from '../data/chefs.json'
import meals from '../data/meals.json'
import { getChefStatus, fmt12 } from '../utils/chefHours'

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

// Returns hours info for display — wraps shared utility
function parseHours(chef) {
  if (!chef?.availableHours) return null
  const { open, close } = chef.availableHours
  const is24Hours = open === '00:00' && close === '23:59'
  const status = getChefStatus(chef)
  const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
  const now = new Date().getHours() * 60 + new Date().getMinutes()
  const minsUntilClose = toMin(close) - now
  const minsUntilOpen = toMin(open) - now
  return { status, is24Hours, minsUntilClose, minsUntilOpen, open, close }
}

function formatCountdown(mins) {
  if (mins <= 0) return null
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins/60)}h ${mins%60 > 0 ? (mins%60)+'m' : ''}`.trim()
}

function AvailabilityBadge({ chef }) {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30000)
    return () => clearInterval(id)
  }, [])

  const info = parseHours(chef)
  if (!info) return null

  // notAcceptingOrders override
  if (chef.notAcceptingOrders) {
    return (
      <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
        <span className="w-2 h-2 bg-amber-400 rounded-full flex-shrink-0" />
        <span className="text-xs font-semibold text-amber-700">
          Not accepting orders right now · Opens {fmt12(info.open)}
        </span>
      </div>
    )
  }

  if (info.is24Hours) {
    return (
      <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0" />
        <span className="text-xs font-semibold text-green-700">
          Open 24 Hours · Always accepting orders
        </span>
      </div>
    )
  }

  if (info.status === 'open') {
    const countdown = formatCountdown(info.minsUntilClose)
    return (
      <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0" />
        <span className="text-xs font-semibold text-green-700">
          Accepting orders
          {countdown && <> · Closes at {fmt12(info.close)} <span className="text-green-500">({countdown} left)</span></>}
        </span>
      </div>
    )
  } else {
    const opensSoon = info.minsUntilOpen > 0 && info.minsUntilOpen < 180
    return (
      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
        <span className="w-2 h-2 bg-gray-400 rounded-full flex-shrink-0" />
        <span className="text-xs font-semibold text-gray-500">
          {opensSoon
            ? <>Opens at {fmt12(info.open)} · {formatCountdown(info.minsUntilOpen)} away</>
            : <>Closed · Opens {fmt12(info.open)}</>}
        </span>
      </div>
    )
  }
}

function SpecialityDayBadge({ specialityDays }) {
  if (!specialityDays) return null
  const todayName = DAY_NAMES[new Date().getDay()]
  const isToday = specialityDays.days.includes(todayName)
  const dayLabel = specialityDays.days.length === 1
    ? specialityDays.days[0]
    : specialityDays.days.join(' & ')

  return (
    <div className={`flex items-center gap-2 rounded-xl px-3 py-2 ${isToday ? 'bg-yellow-50 border border-yellow-200' : 'bg-orange-50 border border-orange-100'}`}>
      <span className="text-base">{isToday ? '🌟' : '📅'}</span>
      <div>
        <p className={`text-xs font-bold ${isToday ? 'text-yellow-700' : 'text-brand'}`}>
          {isToday ? 'Today\'s Special!' : `${dayLabel} Special`}
        </p>
        <p className="text-xs text-gray-500">{specialityDays.dish}</p>
      </div>
      {isToday && (
        <span className="ml-auto text-xs bg-yellow-400 text-yellow-900 font-bold px-2 py-0.5 rounded-full">TODAY</span>
      )}
    </div>
  )
}


export default function ChefProfile() {
  const { id } = useParams()
  const { toast } = useCart()
  const { currentUser } = useAuth()
  const { isChefFaved, toggleChef } = useFavorites()
  const navigate = useNavigate()

  const chef = chefs.find((c) => c.id === id)
  const chefMeals = meals.filter((m) => m.chefId === id)
  const availableMeals = chefMeals.filter((m) => m.available)
  const unavailableMeals = chefMeals.filter((m) => !m.available)

  const faved = currentUser?.role === 'customer' ? isChefFaved(id) : false

  if (!chef) {
    return (
      <div className="page-wrapper flex items-center justify-center py-32">
        <div className="text-center">
          <div className="text-5xl mb-4">👨‍🍳</div>
          <h2 className="section-title">Chef not found</h2>
          <p className="text-gray-400 mt-2 text-sm">This chef profile doesn't exist or has been removed.</p>
          <button onClick={() => navigate('/listings')} className="btn-primary mt-6">
            Back to Listings
          </button>
        </div>
      </div>
    )
  }

  const totalRatings = chefMeals.reduce((sum, m) => sum + m.totalOrders, 0)

  return (
    <div className="page-wrapper">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-4 z-50 px-5 py-3 rounded-2xl shadow-lg text-white text-sm font-medium ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
          {toast.message}
        </div>
      )}

      {/* Cover Image */}
      <div className="relative h-48 sm:h-64 bg-gray-200 overflow-hidden">
        <img
          src={chef.coverImage}
          alt={chef.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 flex items-center gap-1.5 text-white text-sm font-medium bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-xl hover:bg-black/50 transition-colors"
        >
          ← Back
        </button>

        {/* Available badge */}
        <div className="absolute top-4 right-4">
          <span className={`badge text-xs font-bold ${getChefStatus(chef) === 'open' || getChefStatus(chef) === '24h' ? 'bg-green-500 text-white' : chef.notAcceptingOrders ? 'bg-amber-400 text-white' : 'bg-gray-500 text-white'}`}>
            {getChefStatus(chef) === 'open' || getChefStatus(chef) === '24h' ? '🟢 Open' : chef.notAcceptingOrders ? '⏸ Not Accepting Orders' : '🔴 Closed'}
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4">
        {/* Chef Info Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm -mt-8 relative z-10 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <img
              src={chef.avatar}
              alt={chef.name}
              className="w-20 h-20 rounded-2xl bg-gray-100 border-4 border-white shadow-md flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-dark">{chef.name}</h1>
                  <p className="text-brand font-semibold text-sm mt-0.5">{chef.specialty}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Favorite chef button */}
                  {currentUser?.role === 'customer' && (
                    <button
                      onClick={() => toggleChef(id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-semibold transition-all duration-200 ${
                        faved
                          ? 'bg-red-50 border-red-200 text-red-500'
                          : 'bg-white border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-400'
                      }`}
                    >
                      <svg className="w-4 h-4" fill={faved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      {faved ? 'Saved' : 'Save Chef'}
                    </button>
                  )}
                  {currentUser?.role === 'customer' && (getChefStatus(chef) === 'open' || getChefStatus(chef) === '24h') && (
                    <Link
                      to={`/listings?chef=${chef.id}`}
                      className="btn-primary text-sm py-2 px-5"
                    >
                      Order Now
                    </Link>
                  )}
                </div>
              </div>

              <p className="text-gray-500 text-sm mt-3 leading-relaxed max-w-xl">{chef.bio}</p>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-400">
                <span className="flex items-center gap-1">📍 {chef.location}</span>
                <span className="flex items-center gap-1">📅 Since {chef.joinedYear}</span>
                <span className="flex items-center gap-1">
                  ⭐ <strong className="text-dark">{chef.rating}</strong>
                  <span className="text-xs">({chef.totalReviews} reviews)</span>
                </span>
              </div>

              {/* Cuisine tags */}
              <div className="flex flex-wrap gap-2 mt-4">
                {chef.cuisines.map((c) => (
                  <span key={c} className="badge bg-orange-50 text-brand">{c}</span>
                ))}
              </div>

              {/* Availability & Speciality Day */}
              <div className="flex flex-wrap gap-2 mt-4">
                <AvailabilityBadge chef={chef} />
                {chef.specialityDays && <SpecialityDayBadge specialityDays={chef.specialityDays} />}
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
            {[
              { label: 'Total Orders', value: chef.totalOrders.toLocaleString(), emoji: '📦' },
              { label: 'Rating', value: `${chef.rating} / 5`, emoji: '⭐' },
              { label: 'Menu Items', value: chefMeals.length, emoji: '🍽️' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-xl mb-1">{stat.emoji}</div>
                <div className="font-bold text-dark text-lg">{stat.value}</div>
                <div className="text-gray-400 text-xs">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Menu Section */}
        <div className="mt-8 pb-12">
          {/* Available meals */}
          {availableMeals.length > 0 && (
            <div>
              <h2 className="section-title mb-5">
                Menu
                <span className="ml-2 text-sm font-normal text-gray-400">({availableMeals.length} available)</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {availableMeals.map((meal) => (
                  <MealCard key={meal.id} meal={meal} />
                ))}
              </div>
            </div>
          )}

          {/* Unavailable meals */}
          {unavailableMeals.length > 0 && (
            <div className="mt-10">
              <h2 className="text-lg font-semibold text-gray-400 mb-5">
                Currently Unavailable
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {unavailableMeals.map((meal) => (
                  <MealCard key={meal.id} meal={meal} />
                ))}
              </div>
            </div>
          )}

          {chefMeals.length === 0 && (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">🍽️</div>
              <p className="text-gray-400">This chef hasn't added any meals yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
