import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useFavorites } from '../context/FavoritesContext'
import chefs from '../data/chefs.json'
import MealCustomizerModal from './MealCustomizerModal'

function estimatedDelivery(prepTime) {
  const match = prepTime?.match(/(\d+)/)
  const prep = match ? parseInt(match[1]) : 20
  return prep + 15
}

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

export default function MealCard({ meal }) {
  const { addToCart } = useCart()
  const { currentUser } = useAuth()
  const { isMealFaved, toggleMeal } = useFavorites()
  const chef = chefs.find((c) => c.id === meal.chefId)
  const [showCustomizer, setShowCustomizer] = useState(false)
  const [showSchedule, setShowSchedule] = useState(false)
  const [scheduledTime, setScheduledTime] = useState('')
  const [scheduleConfirmed, setScheduleConfirmed] = useState(false)

  const hasAddons = meal.addons && meal.addons.length > 0

  // Speciality day check
  const todayName = DAY_NAMES[new Date().getDay()]
  const isSpecialityDay = chef?.specialityDays?.days?.includes(todayName)
  const specialityDish = chef?.specialityDays?.dish

  // Availability hours check — is chef currently open?
  const chefOpenNow = (() => {
    if (chef?.open24Hours) return true
    if (!chef?.availableHours) return chef?.available ?? true
    const toMin = (t) => { const [h,m] = t.split(':').map(Number); return h*60+m }
    const now = new Date()
    const nowMin = now.getHours()*60 + now.getMinutes()
    return nowMin >= toMin(chef.availableHours.open) && nowMin < toMin(chef.availableHours.close)
  })()
  const faved = currentUser?.role === 'customer' ? isMealFaved(meal.id) : false
  const deliveryMin = estimatedDelivery(meal.prepTime)

  const categoryColors = {
    Bengali: 'bg-green-100 text-green-700',
    Mughlai: 'bg-yellow-100 text-yellow-700',
    Indian: 'bg-orange-100 text-orange-700',
    Chinese: 'bg-red-100 text-red-700',
    Thai: 'bg-lime-100 text-lime-700',
    Japanese: 'bg-pink-100 text-pink-700',
    Korean: 'bg-rose-100 text-rose-700',
    Italian: 'bg-green-100 text-green-800',
    Pizza: 'bg-amber-100 text-amber-700',
    BBQ: 'bg-red-100 text-red-700',
    'Bar Food': 'bg-zinc-100 text-zinc-700',
    Mexican: 'bg-yellow-100 text-yellow-800',
    'Middle Eastern': 'bg-amber-100 text-amber-800',
    Desserts: 'bg-pink-100 text-pink-700',
    'Street Food': 'bg-purple-100 text-purple-700',
    Healthy: 'bg-teal-100 text-teal-700',
    African: 'bg-yellow-100 text-yellow-800',
    Continental: 'bg-blue-100 text-blue-700',
  }

  // Diet tag badges to show on card
  const dietTags = (meal.tags || []).filter((t) =>
    ['vegan', 'vegetarian', 'halal', 'gluten-free'].includes(t.toLowerCase())
  )
  const dietEmoji = { vegan: '🌱', vegetarian: '🥦', halal: '✅', 'gluten-free': '🌾' }

  const handleAddClick = () => {
    if (hasAddons) setShowCustomizer(true)
    else addToCart(meal, [])
  }

  const handleFav = (e) => {
    e.preventDefault()
    e.stopPropagation()
    toggleMeal(meal.id)
  }

  return (
    <>
      <div className={`card flex flex-col group ${!meal.available || !chefOpenNow ? 'opacity-60' : ''}`}>
        {/* Image */}
        <div className="relative overflow-hidden h-48">
          <img
            src={meal.image}
            alt={meal.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80'
            }}
          />
          {!meal.available && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="bg-white text-dark text-xs font-bold px-3 py-1 rounded-full">
                Currently Unavailable
              </span>
            </div>
          )}
          {meal.available && !chefOpenNow && (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
              <span className="bg-white/90 text-dark text-xs font-bold px-3 py-1 rounded-full">
                Chef Closed · Opens {chef?.availableHours?.open}
              </span>
              {!scheduleConfirmed ? (
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowSchedule(true) }}
                  className="flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow hover:bg-orange-600 transition-colors"
                >
                  🕐 Schedule Order
                </button>
              ) : (
                <span className="bg-green-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow">
                  ✓ Scheduled {scheduledTime}
                </span>
              )}
            </div>
          )}

          {/* Speciality day badge */}
          {isSpecialityDay && meal.name === specialityDish && (
            <span className="absolute bottom-3 left-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
              🌟 Today's Special
            </span>
          )}

          {/* Category badge */}
          <span className={`absolute top-3 left-3 badge text-xs ${categoryColors[meal.category] || 'bg-gray-100 text-gray-600'}`}>
            {meal.category}
          </span>

          {/* Favorite button */}
          {currentUser?.role === 'customer' && (
            <button
              onClick={handleFav}
              className={`absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full shadow transition-all duration-200 ${
                faved
                  ? 'bg-red-500 text-white scale-110'
                  : 'bg-white/90 text-gray-400 hover:text-red-400 hover:scale-110'
              }`}
              title={faved ? 'Remove from favorites' : 'Save to favorites'}
            >
              <svg className="w-4 h-4" fill={faved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          )}

          {/* Bestseller badge */}
          {meal.tags?.includes('bestseller') && currentUser?.role === 'customer' && (
            <span className="absolute top-12 right-3 badge bg-brand text-white text-xs">🔥 Bestseller</span>
          )}
          {meal.tags?.includes('bestseller') && currentUser?.role !== 'customer' && (
            <span className="absolute top-3 right-3 badge bg-brand text-white text-xs">🔥 Bestseller</span>
          )}

          {/* Customisable badge */}
          {hasAddons && meal.available && (
            <span className="absolute bottom-3 left-3 badge bg-white/90 text-brand text-xs shadow">
              ✨ Customisable
            </span>
          )}

          {/* Delivery time badge */}
          {meal.available && (
            <span className="absolute bottom-3 right-3 badge bg-dark/80 text-white text-xs backdrop-blur-sm">
              ⚡ ~{deliveryMin} min
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-semibold text-dark text-base leading-snug">{meal.name}</h3>
          <p className="text-gray-400 text-xs mt-1 line-clamp-2 leading-relaxed">
            {meal.description}
          </p>

          {/* Diet tags */}
          {dietTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {dietTags.map((tag) => (
                <span key={tag} className="text-xs bg-green-50 text-green-700 border border-green-100 px-2 py-0.5 rounded-full font-medium">
                  {dietEmoji[tag.toLowerCase()] || ''} {tag}
                </span>
              ))}
            </div>
          )}

          {chef && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <Link to={`/chef/${chef.id}`} className="flex items-center gap-1.5 group/chef">
                <img src={chef.avatar} alt={chef.name} className="w-5 h-5 rounded-full bg-gray-200" />
                <span className="text-xs text-gray-500 group-hover/chef:text-brand transition-colors">
                  {chef.name}
                </span>
              </Link>
              {isSpecialityDay && (
                <span className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded-full font-semibold">
                  📅 {todayName} Special
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
            <span className="flex items-center gap-1">⭐ {meal.rating}</span>
            <span>•</span>
            <span>🕐 {meal.prepTime}</span>
            <span>•</span>
            <span>{meal.totalOrders} orders</span>
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
            <div>
              <span className="text-lg font-bold text-dark">৳{meal.price}</span>
              {hasAddons && <span className="text-xs text-gray-400 ml-1">onwards</span>}
            </div>
            {currentUser?.role === 'customer' && meal.available && chefOpenNow && (
              <button
                onClick={handleAddClick}
                className="btn-primary text-xs py-2 px-4 flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {hasAddons ? 'Customise' : 'Add'}
              </button>
            )}
            {!currentUser && meal.available && (
              <Link to="/login" className="btn-outline text-xs py-2 px-4">Login to Order</Link>
            )}
          </div>
        </div>
      </div>

      {showCustomizer && (
        <MealCustomizerModal meal={meal} onClose={() => setShowCustomizer(false)} />
      )}

      {showSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowSchedule(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-dark text-base mb-1">Schedule Your Order</h3>
            <p className="text-xs text-gray-400 mb-4">
              {chef?.name} opens at {chef?.availableHours?.open}. Pick a time and we'll place your order then.
            </p>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Delivery Time</label>
              <input
                type="time"
                min={chef?.availableHours?.open}
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand"
              />
              {scheduledTime && scheduledTime < (chef?.availableHours?.open || '00:00') && (
                <p className="text-xs text-red-500 mt-1">⚠️ Chef isn't open until {chef?.availableHours?.open}</p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSchedule(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={!scheduledTime || scheduledTime < (chef?.availableHours?.open || '00:00')}
                onClick={() => { setScheduleConfirmed(true); setShowSchedule(false) }}
                className="flex-1 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-orange-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
