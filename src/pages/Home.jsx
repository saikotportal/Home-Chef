import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import MealCard from '../components/MealCard'
import PromoCarousel from '../components/PromoCarousel'
import PromoStrip from '../components/PromoStrip'
import meals from '../data/meals.json'
import chefs from '../data/chefs.json'

const CUISINE_CATEGORIES = [
  { name: 'All',           emoji: '🍽️' },
  { name: 'Bengali',       emoji: '🐟' },
  { name: 'Mughlai',       emoji: '🍖' },
  { name: 'Indian',        emoji: '🫛' },
  { name: 'Chinese',       emoji: '🥟' },
  { name: 'Thai',          emoji: '🌿' },
  { name: 'Japanese',      emoji: '🍱' },
  { name: 'Korean',        emoji: '🌶️' },
  { name: 'Italian',       emoji: '🍝' },
  { name: 'Pizza',         emoji: '🍕' },
  { name: 'BBQ',           emoji: '🔥' },
  { name: 'Bar Food',      emoji: '🍔' },
  { name: 'Mexican',       emoji: '🌮' },
  { name: 'Middle Eastern',emoji: '🥙' },
  { name: 'Desserts',      emoji: '🍰' },
  { name: 'Street Food',   emoji: '🥘' },
  { name: 'Healthy',       emoji: '🥗' },
  { name: 'African',       emoji: '🌍' },
  { name: 'Continental',   emoji: '🍴' },
]

const TESTIMONIALS = [
  { name: 'Sabrina R.', area: 'Dhanmondi', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&q=80', text: 'The Kacchi Biryani from Chef Fatema is honestly better than any restaurant I\'ve ever tried. My family orders every Friday without fail!', rating: 5, meal: 'Kacchi Biryani' },
  { name: 'Rakib H.', area: 'Gulshan', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&q=80', text: 'Lin\'s Dim Sum Platter is an absolute steal. Fresh, piping hot, arrives perfectly packed. I cancelled my restaurant subscription after my first order.', rating: 5, meal: 'Dim Sum Platter' },
  { name: 'Priya M.', area: 'Banani', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&q=80', text: 'Marco\'s Carbonara tastes like I\'m actually in Rome. He doesn\'t use cream — proper Italian technique. Incredible value for home-cooked quality.', rating: 5, meal: 'Spaghetti Carbonara' },
  { name: 'Tanvir A.', area: 'Uttara', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&q=80', text: 'Smoked BBQ Ribs from Tariq are absolutely unreal. Tender, fall-off-the-bone, and the sauce is house-made. Proper bar-food experience at home.', rating: 5, meal: 'Smoked BBQ Ribs' },
  { name: 'Mitu B.', area: 'Mirpur', avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=80&q=80', text: 'Sofia\'s Chocolate Lava Cake — I ordered it once and now I can\'t stop. The molten centre is perfectly gooey every single time. Best dessert in Dhaka.', rating: 5, meal: 'Chocolate Lava Cake' },
  { name: 'Nadia K.', area: 'Rampura', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=80', text: 'Amira\'s Mixed Mezze Board is my go-to for dinner parties. Baba ghanoush, hummus, everything freshly made that morning. My guests always ask where it\'s from!', rating: 5, meal: 'Mixed Mezze Board' },
]

const STATS = [
  { value: '21+', label: 'Home Chefs', emoji: '👨‍🍳' },
  { value: '73+', label: 'Meals Available', emoji: '🍽️' },
  { value: '12', label: 'Neighbourhoods', emoji: '📍' },
  { value: '4.8★', label: 'Average Rating', emoji: '⭐' },
  { value: '30min', label: 'Avg Delivery', emoji: '🛵' },
  { value: '5K+', label: 'Happy Orders', emoji: '🎉' },
]

const HOW_IT_WORKS = [
  { step: '01', emoji: '📍', title: 'Set Your Area', desc: 'Tell us where you are and we\'ll show you the best home chefs cooking in your neighbourhood right now.' },
  { step: '02', emoji: '🔍', title: 'Browse & Customise', desc: 'Explore meals by cuisine or chef. Customise your order with add-ons like extra cheese, sides, or upgraded proteins.' },
  { step: '03', emoji: '🛒', title: 'Checkout in Seconds', desc: 'Add to cart, pick a delivery time, and pay. Your chef gets notified instantly and starts cooking.' },
  { step: '04', emoji: '🛵', title: 'Track & Enjoy', desc: 'Watch live as your order goes from kitchen to door. Real-time status: Accepted → Cooking → On the way → Delivered.' },
]

const WHY_US = [
  { emoji: '🏠', title: 'Real Home Kitchens', desc: 'Every meal is cooked fresh by a verified home chef — no factory, no reheating, just love on a plate.' },
  { emoji: '🌍', title: '16 Cuisines', desc: 'Bengali to Japanese, Italian to Korean — the widest variety of authentic homemade food under one platform.' },
  { emoji: '✨', title: 'Fully Customisable', desc: 'Add extra cheese, upgrade proteins, choose sides — build your meal exactly the way you want it.' },
  { emoji: '⚡', title: 'Lightning Fast', desc: 'Most chefs deliver within 30–45 minutes. Fresh, hot, on time — every single order.' },
  { emoji: '🔒', title: 'Verified & Safe', desc: 'Every chef passes our food safety check, kitchen inspection and quality review before going live.' },
  { emoji: '💰', title: 'Fair Pricing', desc: 'Home-cooked quality at prices that beat restaurants. No hidden fees, no surge pricing.' },
]

export default function Home() {
  const { currentUser, selectedArea, changeArea } = useAuth()
  const { toast } = useCart()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTestimonial, setActiveTestimonial] = useState(0)

  const availableMeals = meals.filter((m) => m.available)
  const availableChefs = chefs.filter((c) => c.available || true) // show all chefs; paused ones marked separately

  const areaChefs = selectedArea
    ? [...availableChefs].sort((a, b) =>
        Math.abs((a.zone || 1) - selectedArea.zone) - Math.abs((b.zone || 1) - selectedArea.zone)
      )
    : availableChefs

  const nearbyChefIds = selectedArea
    ? areaChefs.slice(0, 6).map((c) => c.id)
    : availableChefs.map((c) => c.id)

  // Sections of meals
  const popularMeals = [...availableMeals]
    .sort((a, b) => b.totalOrders - a.totalOrders)
    .slice(0, 8)

  const newMeals = [...availableMeals]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 4)

  const nearbyMeals = availableMeals
    .filter((m) => nearbyChefIds.includes(m.chefId))
    .sort((a, b) => b.totalOrders - a.totalOrders)
    .slice(0, 4)

  // ── Curated collections ────────────────────────────────────
  const trendingMeals = [...availableMeals]
    .sort((a, b) => b.totalOrders - a.totalOrders)
    .slice(0, 4)

  const healthyMeals = availableMeals
    .filter((m) =>
      m.tags?.some((t) => ['vegan', 'vegetarian', 'healthy', 'light'].includes(t.toLowerCase())) ||
      m.category === 'Healthy'
    )
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 4)

  const newOnPlatform = [...availableMeals]
    .sort((a, b) => a.totalOrders - b.totalOrders) // fewest orders = newest
    .slice(0, 4)

  // Group by cuisine for the explore section
  const cuisineGroups = {}
  availableMeals.forEach((m) => {
    if (!cuisineGroups[m.category]) cuisineGroups[m.category] = []
    cuisineGroups[m.category].push(m)
  })
  const topCuisines = Object.entries(cuisineGroups)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 8)

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) navigate(`/listings?search=${encodeURIComponent(searchQuery.trim())}`)
  }

  const handleCategoryClick = (cat) => {
    navigate(cat === 'All' ? '/listings' : `/listings?category=${encodeURIComponent(cat)}`)
  }

  const categoryEmoji = { Bengali:'🐟', Mughlai:'🍖', Indian:'🫛', Chinese:'🥟', Thai:'🌿', Japanese:'🍱', Korean:'🌶️', Italian:'🍝', Pizza:'🍕', BBQ:'🔥', 'Bar Food':'🍔', Mexican:'🌮', 'Middle Eastern':'🥙', Desserts:'🍰', 'Street Food':'🥘', Healthy:'🥗' }
  const categoryBg = { Bengali:'from-green-400 to-teal-500', Mughlai:'from-yellow-500 to-orange-500', Indian:'from-orange-400 to-red-500', Chinese:'from-red-500 to-rose-600', Thai:'from-lime-500 to-green-600', Japanese:'from-pink-400 to-rose-500', Korean:'from-red-400 to-pink-500', Italian:'from-green-500 to-emerald-600', Pizza:'from-amber-400 to-orange-500', BBQ:'from-orange-500 to-red-600', 'Bar Food':'from-zinc-500 to-slate-600', Mexican:'from-yellow-400 to-orange-400', 'Middle Eastern':'from-amber-500 to-yellow-600', Desserts:'from-pink-400 to-purple-500', 'Street Food':'from-purple-500 to-indigo-500', Healthy:'from-teal-400 to-cyan-500' }

  return (
    <div className="page-wrapper">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-4 z-50 px-5 py-3 rounded-2xl shadow-lg text-white text-sm font-medium transition-all ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
          {toast.message}
        </div>
      )}

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-orange-50 via-white to-amber-50 pt-14 pb-20 px-4 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-100 rounded-full blur-3xl opacity-40 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-100 rounded-full blur-3xl opacity-40 translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="max-w-6xl mx-auto relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div>
              <span className="inline-block bg-orange-100 text-brand text-xs font-bold px-3 py-1.5 rounded-full mb-5 tracking-wide uppercase">
                🏠 Home-cooked meals · Delivered fresh
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-dark leading-tight">
                Taste the love<br />from{' '}
                <span className="text-brand relative">
                  real home
                  <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 8" fill="none">
                    <path d="M2 6 Q50 2 100 5 Q150 8 198 4" stroke="#FF6B35" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.4"/>
                  </svg>
                </span>{' '}kitchens
              </h1>
              <p className="mt-5 text-gray-500 text-lg leading-relaxed max-w-lg">
                Discover authentic meals from <strong className="text-dark">21 talented home chefs</strong> across Dhaka. Bengali, Chinese, Italian, Japanese and more — all freshly cooked and delivered to your door.
              </p>

              {/* Area pill */}
              {selectedArea ? (
                <div className="mt-5 inline-flex items-center gap-2 bg-white border border-orange-200 rounded-2xl px-4 py-2.5 shadow-sm">
                  <span className="text-brand">📍</span>
                  <span className="text-sm text-dark font-semibold">Chefs near <span className="text-brand">{selectedArea.name}</span></span>
                  <button onClick={changeArea} className="text-xs text-gray-400 hover:text-brand underline ml-1 transition-colors">Change</button>
                </div>
              ) : (
                <button onClick={changeArea} className="mt-5 inline-flex items-center gap-2 bg-white border-2 border-dashed border-orange-300 rounded-2xl px-4 py-2.5 text-sm text-gray-500 hover:border-brand hover:text-brand transition-colors">
                  📍 Set your delivery area to see nearby chefs
                </button>
              )}

              {/* Search */}
              <form onSubmit={handleSearch} className="mt-6 flex gap-2 max-w-lg">
                <div className="flex-1 relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                  </svg>
                  <input type="text" className="input pl-10 py-3" placeholder="Search meals, chefs, cuisines…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <button type="submit" className="btn-primary px-6 py-3 whitespace-nowrap">Search</button>
              </form>

              {/* Quick links */}
              <div className="mt-4 flex gap-3 flex-wrap">
                <Link to="/chefs" className="inline-flex items-center gap-2 bg-white border border-gray-200 text-dark text-sm font-semibold px-4 py-2 rounded-xl hover:border-brand hover:text-brand transition-all shadow-sm">👨‍🍳 Browse Chefs</Link>
                <Link to="/listings" className="inline-flex items-center gap-2 bg-white border border-gray-200 text-dark text-sm font-semibold px-4 py-2 rounded-xl hover:border-brand hover:text-brand transition-all shadow-sm">🍽️ All Meals</Link>
                <Link to="/become-a-chef" className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 text-brand text-sm font-semibold px-4 py-2 rounded-xl hover:bg-orange-100 transition-all">🍳 Become a Chef</Link>
              </div>
            </div>

            {/* Right: Hero image grid */}
            <div className="hidden lg:grid grid-cols-2 gap-3">
              {[
                { url: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400&q=80', label: 'Kacchi Biryani', price: '৳380' },
                { url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80', label: 'Margherita Pizza', price: '৳350' },
                { url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&q=80', label: 'Tonkotsu Ramen', price: '৳380' },
                { url: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=400&q=80', label: 'Kung Pao Chicken', price: '৳240' },
              ].map((img, i) => (
                <div key={i} className={`relative rounded-2xl overflow-hidden shadow-md group cursor-pointer ${i === 0 ? 'row-span-1' : ''}`} onClick={() => navigate('/listings')}>
                  <img src={img.url} alt={img.label} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-2 left-3 right-3 flex justify-between items-end">
                    <span className="text-white text-xs font-bold">{img.label}</span>
                    <span className="bg-white/90 text-brand text-xs font-bold px-2 py-0.5 rounded-full">{img.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats bar */}
          <div className="mt-14 grid grid-cols-3 sm:grid-cols-6 gap-4">
            {STATS.map((s) => (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                <div className="text-2xl mb-1">{s.emoji}</div>
                <div className="text-xl font-extrabold text-dark">{s.value}</div>
                <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROMO CAROUSEL ───────────────────────────────── */}
      <section className="py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <PromoCarousel />
        </div>
      </section>

      {/* ── CUISINE SCROLL BAR ───────────────────────────── */}
      <section className="py-6 px-4 bg-white border-y border-gray-100 sticky top-16 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-2.5 overflow-x-auto pb-0.5 scrollbar-hide">
            {CUISINE_CATEGORIES.map((cat) => (
              <button
                key={cat.name}
                onClick={() => handleCategoryClick(cat.name)}
                className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl font-medium text-sm transition-all border border-gray-200 bg-white text-gray-600 hover:border-brand hover:text-brand hover:bg-orange-50"
              >
                <span>{cat.emoji}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── MOST POPULAR ─────────────────────────────────── */}
      <section className="py-14 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-7">
            <div>
              <span className="text-xs font-bold text-brand uppercase tracking-widest">Best Sellers</span>
              <h2 className="section-title mt-1">🔥 Most Popular Right Now</h2>
              <p className="text-gray-400 text-sm mt-1">The meals your neighbours can't stop ordering</p>
            </div>
            <Link to="/listings" className="text-brand text-sm font-semibold hover:underline hidden sm:block">View all →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {popularMeals.slice(0, 4).map((meal) => <MealCard key={meal.id} meal={meal} />)}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-5">
            {popularMeals.slice(4, 8).map((meal) => <MealCard key={meal.id} meal={meal} />)}
          </div>
          <div className="mt-6 text-center sm:hidden">
            <Link to="/listings" className="btn-outline inline-block">View All Meals →</Link>
          </div>
        </div>
      </section>

      {/* ── EXPLORE BY CUISINE ───────────────────────────── */}
      <section className="py-14 px-4 bg-white border-y border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-bold text-brand uppercase tracking-widest">16 Cuisines</span>
            <h2 className="section-title mt-1">🌍 Explore by Cuisine</h2>
            <p className="text-gray-400 text-sm mt-1">From Bengali comfort food to Japanese ramen — every craving covered</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {topCuisines.map(([cuisine, cMeals]) => (
              <button
                key={cuisine}
                onClick={() => handleCategoryClick(cuisine)}
                className={`relative rounded-2xl overflow-hidden group h-32 bg-gradient-to-br ${categoryBg[cuisine] || 'from-gray-400 to-gray-600'} shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
              >
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all" />
                <img
                  src={cMeals[0]?.image}
                  alt={cuisine}
                  className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-40 group-hover:scale-105 transition-all duration-300"
                />
                <div className="relative z-10 flex flex-col items-center justify-center h-full gap-1">
                  <span className="text-3xl">{categoryEmoji[cuisine] || '🍽️'}</span>
                  <span className="text-white font-bold text-sm">{cuisine}</span>
                  <span className="text-white/70 text-xs">{cMeals.length} meal{cMeals.length !== 1 ? 's' : ''}</span>
                </div>
              </button>
            ))}
          </div>
          <div className="mt-6 text-center">
            <button onClick={() => handleCategoryClick('All')} className="btn-outline inline-block">Browse All Cuisines →</button>
          </div>
        </div>
      </section>

      {/* ── NEARBY MEALS ─────────────────────────────────── */}
      {nearbyMeals.length > 0 && (
        <section className="py-14 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end justify-between mb-7">
              <div>
                <span className="text-xs font-bold text-brand uppercase tracking-widest">{selectedArea ? `Near ${selectedArea.name}` : 'For You'}</span>
                <h2 className="section-title mt-1">📍 Meals Near You</h2>
                <p className="text-gray-400 text-sm mt-1">Fresh picks from chefs in your area</p>
              </div>
              <Link to="/listings" className="text-brand text-sm font-semibold hover:underline hidden sm:block">See all →</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {nearbyMeals.map((meal) => <MealCard key={meal.id} meal={meal} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── CURATED: TRENDING TODAY ──────────────────────── */}
      <section className="py-14 px-4 bg-gradient-to-b from-orange-50/60 to-white border-t border-orange-100">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-7">
            <div>
              <span className="text-xs font-bold text-brand uppercase tracking-widest">Collection</span>
              <h2 className="section-title mt-1">🔥 Trending Today</h2>
              <p className="text-gray-400 text-sm mt-1">The meals everyone's talking about right now</p>
            </div>
            <Link to="/listings?sort=popular" className="text-brand text-sm font-semibold hover:underline hidden sm:block">See all →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {trendingMeals.map((meal) => <MealCard key={meal.id} meal={meal} />)}
          </div>
        </div>
      </section>

      {/* ── CURATED: HEALTHY PICKS ───────────────────────── */}
      {healthyMeals.length > 0 && (
        <section className="py-14 px-4 border-t border-gray-100">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end justify-between mb-7">
              <div>
                <span className="text-xs font-bold text-green-600 uppercase tracking-widest">Collection</span>
                <h2 className="section-title mt-1">🥗 Healthy Picks</h2>
                <p className="text-gray-400 text-sm mt-1">Vegan, vegetarian and light meals curated for you</p>
              </div>
              <Link to="/listings?category=Healthy" className="text-brand text-sm font-semibold hover:underline hidden sm:block">See all →</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {healthyMeals.map((meal) => <MealCard key={meal.id} meal={meal} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── CURATED: NEW ON HOMECHEF ─────────────────────── */}
      <section className="py-14 px-4 bg-gradient-to-b from-blue-50/40 to-white border-t border-blue-100">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-7">
            <div>
              <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">Collection</span>
              <h2 className="section-title mt-1">✨ New on HomeChef</h2>
              <p className="text-gray-400 text-sm mt-1">Fresh additions from our newest chefs — be the first to try</p>
            </div>
            <Link to="/listings" className="text-brand text-sm font-semibold hover:underline hidden sm:block">Explore →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {newOnPlatform.map((meal) => <MealCard key={meal.id} meal={meal} />)}
          </div>
        </div>
      </section>

      {/* ── PROMO STRIP ──────────────────────────────────── */}
      <section className="px-4 pb-4">
        <div className="max-w-6xl mx-auto">
          <PromoStrip variant="freedel" />
        </div>
      </section>

      {/* ── TOP CHEFS ────────────────────────────────────── */}
      <section className="py-14 px-4 bg-gradient-to-b from-orange-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-7">
            <div>
              <span className="text-xs font-bold text-brand uppercase tracking-widest">Meet the Cooks</span>
              <h2 className="section-title mt-1">👨‍🍳 Our Featured Chefs</h2>
              <p className="text-gray-400 text-sm mt-1">Passionate home cooks sharing their heritage through food</p>
            </div>
            <Link to="/chefs" className="text-brand text-sm font-semibold hover:underline hidden sm:block">All chefs →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {areaChefs.slice(0, 10).map((chef) => (
              <Link key={chef.id} to={`/chef/${chef.id}`} className="card p-4 flex flex-col items-center text-center group hover:-translate-y-1 transition-transform duration-200">
                <div className="relative">
                  <img src={chef.avatar} alt={chef.name} className="w-16 h-16 rounded-full bg-gray-200 object-cover group-hover:scale-105 transition-transform duration-200" />
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full" />
                </div>
                <h3 className="font-semibold text-dark text-sm mt-3 leading-tight">{chef.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{chef.specialty}</p>
                <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-400">
                  <span>⭐ {chef.rating}</span>
                  <span>·</span>
                  <span>{chef.totalOrders}</span>
                </div>
                <div className="flex flex-wrap justify-center gap-1 mt-2">
                  {chef.cuisines.slice(0, 1).map((c) => (
                    <span key={c} className="badge bg-orange-50 text-brand text-xs">{c}</span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-7 text-center">
            <Link to="/chefs" className="btn-primary inline-block px-8">Browse All {chefs.length} Chefs →</Link>
          </div>
        </div>
      </section>

      {/* ── TOP RATED MEALS ──────────────────────────────── */}
      <section className="py-14 px-4 border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-7">
            <div>
              <span className="text-xs font-bold text-brand uppercase tracking-widest">Highest Rated</span>
              <h2 className="section-title mt-1">⭐ Top Rated Meals</h2>
              <p className="text-gray-400 text-sm mt-1">Consistently 4.8+ stars from hundreds of orders</p>
            </div>
            <Link to="/listings" className="text-brand text-sm font-semibold hover:underline hidden sm:block">View all →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {newMeals.map((meal) => <MealCard key={meal.id} meal={meal} />)}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section className="py-16 px-4 bg-white border-y border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-brand uppercase tracking-widest">Simple as 1-2-3-4</span>
            <h2 className="section-title mt-1">How HomeChef Works</h2>
            <p className="text-gray-400 text-sm mt-1">From craving to doorstep in under an hour</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((item, i) => (
              <div key={item.step} className="relative text-center">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-orange-200 to-transparent z-0" />
                )}
                <div className="relative z-10 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-50 text-3xl mb-4 shadow-sm">
                  {item.emoji}
                </div>
                <div className="text-xs font-bold text-brand tracking-widest uppercase mb-1">Step {item.step}</div>
                <h3 className="font-bold text-dark text-base">{item.title}</h3>
                <p className="text-gray-400 text-sm mt-2 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE US ────────────────────────────────── */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-brand uppercase tracking-widest">Why HomeChef</span>
            <h2 className="section-title mt-1">More than just food delivery</h2>
            <p className="text-gray-400 text-sm mt-1">We connect communities through authentic home cooking</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {WHY_US.map((item) => (
              <div key={item.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-200">
                <div className="text-3xl mb-3">{item.emoji}</div>
                <h3 className="font-bold text-dark text-base">{item.title}</h3>
                <p className="text-gray-400 text-sm mt-1.5 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────── */}
      <section className="py-16 px-4 bg-gradient-to-b from-orange-50 to-white border-t border-orange-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-bold text-brand uppercase tracking-widest">Real Reviews</span>
            <h2 className="section-title mt-1">❤️ What Customers Say</h2>
            <p className="text-gray-400 text-sm mt-1">Thousands of happy meals across Dhaka every week</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
                <div className="flex text-yellow-400 text-sm gap-0.5">
                  {'★'.repeat(t.rating)}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-3 mt-auto pt-3 border-t border-gray-100">
                  <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover bg-gray-200" />
                  <div>
                    <p className="font-semibold text-dark text-sm">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.area} · ordered <span className="text-brand font-medium">{t.meal}</span></p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BECOME A CHEF BANNER ─────────────────────────── */}
      <section className="py-14 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="relative bg-gradient-to-r from-dark to-dark-mid rounded-3xl overflow-hidden p-10 lg:p-14">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 left-10 text-6xl">🍳</div>
              <div className="absolute top-8 right-20 text-5xl">🥘</div>
              <div className="absolute bottom-4 left-1/3 text-5xl">🍜</div>
              <div className="absolute bottom-6 right-10 text-4xl">🥗</div>
            </div>
            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <span className="inline-block bg-orange-500/20 text-orange-300 text-xs font-bold px-3 py-1 rounded-full mb-4 tracking-wide uppercase">Join the HomeChef Family</span>
                <h2 className="text-3xl font-extrabold text-white leading-tight">
                  Turn your kitchen<br />into a business
                </h2>
                <p className="text-gray-400 mt-3 text-sm leading-relaxed max-w-md">
                  Join 14 home chefs already earning from their passion. Set your own menu, prices and hours. We handle orders, payments and delivery — you just cook.
                </p>
                <div className="mt-6 flex gap-3">
                  <Link to="/become-a-chef" className="btn-primary inline-block px-7 py-3">Apply to Cook 🍳</Link>
                  <Link to="/chefs" className="inline-block border-2 border-white/20 text-white px-7 py-3 rounded-xl text-sm font-semibold hover:bg-white/10 transition-colors">Meet Our Chefs</Link>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { emoji: '💰', title: 'Earn ৳15k–80k/mo', desc: 'Top chefs earn significantly from home' },
                  { emoji: '⏰', title: 'Flexible Hours', desc: 'Cook on your own schedule' },
                  { emoji: '🛵', title: 'We Deliver', desc: 'Our riders handle all delivery' },
                  { emoji: '📱', title: 'Easy Dashboard', desc: 'Manage orders from your phone' },
                ].map((item) => (
                  <div key={item.title} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <div className="text-2xl mb-1.5">{item.emoji}</div>
                    <div className="text-white font-bold text-sm">{item.title}</div>
                    <div className="text-gray-400 text-xs mt-0.5">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA FOR LOGGED-OUT USERS ─────────────────────── */}
      {!currentUser && (
        <section className="py-12 px-4 pb-16">
          <div className="max-w-6xl mx-auto">
            <div className="bg-gradient-to-r from-brand to-orange-600 rounded-3xl p-10 text-center shadow-xl shadow-orange-200">
              <div className="text-4xl mb-3">🍽️</div>
              <h2 className="text-2xl font-extrabold text-white">Ready to order your first home-cooked meal?</h2>
              <p className="text-orange-100 mt-2 text-sm">Join HomeChef — it's free. Your first order ships in minutes.</p>
              <Link to="/login" className="inline-block mt-6 bg-white text-brand font-bold px-10 py-3.5 rounded-2xl hover:bg-orange-50 transition-colors shadow-md">
                Get Started — It's Free 🚀
              </Link>
            </div>
          </div>
        </section>
      )}

      <div className="h-6" />
    </div>
  )
}
