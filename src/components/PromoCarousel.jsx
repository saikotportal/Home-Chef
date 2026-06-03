import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const PROMOS = [
  {
    id: 1,
    tag: '🎉 Limited Time',
    headline: 'Free Delivery This Weekend',
    sub: 'On all orders above ৳299. No code needed.',
    cta: 'Order Now',
    ctaLink: '/listings',
    bg: 'from-orange-500 to-rose-500',
    image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600&q=80',
    badge: 'FREE DELIVERY',
    badgeColor: 'bg-white text-orange-600',
  },
  {
    id: 2,
    tag: '👨‍🍳 New on HomeChef',
    headline: "Try Karim's Kacchi Biryani",
    sub: 'Authentic dum biryani — rated 4.9 by 421 customers.',
    cta: 'View Chef',
    ctaLink: '/chef/u002',
    bg: 'from-yellow-500 to-orange-500',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80',
    badge: '⭐ 4.9 RATED',
    badgeColor: 'bg-white text-yellow-600',
  },
  {
    id: 3,
    tag: '🥗 Healthy Pick',
    headline: '20% Off Vegetarian Meals Today',
    sub: "Dal Makhani, Paneer Butter Masala & more from Priya's kitchen.",
    cta: 'Browse Veg',
    ctaLink: '/listings?category=Indian',
    bg: 'from-green-500 to-teal-500',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&q=80',
    badge: '20% OFF',
    badgeColor: 'bg-white text-green-600',
  },
  {
    id: 4,
    tag: '🔥 Flash Deal',
    headline: 'Biryani Friday — ৳50 Off',
    sub: 'Every Friday, get ৳50 off on any biryani order. Today only!',
    cta: 'Grab Deal',
    ctaLink: '/listings?category=Mughlai',
    bg: 'from-purple-600 to-indigo-600',
    image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&q=80',
    badge: '৳50 OFF',
    badgeColor: 'bg-white text-purple-600',
  },
]

export default function PromoCarousel() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const t = setInterval(() => {
      setActive((p) => (p + 1) % PROMOS.length)
    }, 4000)
    return () => clearInterval(t)
  }, [paused])

  return (
    <div
      className="relative rounded-2xl shadow-md overflow-hidden"
      style={{ height: '300px' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {PROMOS.map((p, i) => (
        <div
          key={p.id}
          className={`absolute inset-0 transition-opacity duration-700 ${i === active ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        >
          <div className={`bg-gradient-to-r ${p.bg} absolute inset-0`} />

          {/* Image — right side, fixed, consistent across all slides */}
          <div className="absolute right-0 top-0 bottom-0 w-72 hidden sm:block">
            <img
              src={p.image}
              alt={p.headline}
              className="w-full h-full object-cover object-center"
            />
            {/* fade blend into gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
          </div>

          {/* Text */}
          <div className="relative z-10 flex flex-col justify-center h-full p-6 sm:p-8 sm:pr-80">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${p.badgeColor}`}>
                {p.badge}
              </span>
              <span className="text-white/80 text-xs">{p.tag}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
              {p.headline}
            </h2>
            <p className="text-white/80 text-sm mt-1.5 leading-relaxed max-w-xs">
              {p.sub}
            </p>
            <Link
              to={p.ctaLink}
              className="inline-block mt-4 bg-white text-dark text-sm font-bold px-5 py-2 rounded-xl hover:bg-gray-50 transition-colors shadow-sm w-fit"
            >
              {p.cta} →
            </Link>
          </div>
        </div>
      ))}

      {/* Dot indicators */}
      <div className="absolute bottom-3 left-6 z-30 flex gap-1.5">
        {PROMOS.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`rounded-full transition-all duration-300 ${
              i === active ? 'bg-white w-5 h-1.5' : 'bg-white/50 w-1.5 h-1.5'
            }`}
          />
        ))}
      </div>

      {/* Arrows */}
      <button
        onClick={() => setActive((active - 1 + PROMOS.length) % PROMOS.length)}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-30 bg-black/20 hover:bg-black/40 text-white w-7 h-7 rounded-full flex items-center justify-center transition-colors"
      >
        ‹
      </button>
      <button
        onClick={() => setActive((active + 1) % PROMOS.length)}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-30 bg-black/20 hover:bg-black/40 text-white w-7 h-7 rounded-full flex items-center justify-center transition-colors"
      >
        ›
      </button>
    </div>
  )
}
