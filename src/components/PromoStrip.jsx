import { Link } from 'react-router-dom'

// Inline banner injected between meal cards or chef cards
// Pass variant: 'biryani' | 'veg' | 'newchef' | 'freedel'
const STRIPS = {
  biryani: {
    bg: 'from-yellow-400 to-orange-500',
    icon: '🍖',
    headline: 'Biryani Friday Deal',
    sub: '৳50 off every Friday on Mughlai orders',
    badge: '৳50 OFF',
    badgeColor: 'bg-white text-orange-600',
    cta: 'Order Biryani',
    link: '/listings?category=Mughlai',
    image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400&q=80',
  },
  veg: {
    bg: 'from-green-400 to-teal-500',
    icon: '🥗',
    headline: 'Healthy & Vegetarian',
    sub: '20% off all Indian veg meals today',
    badge: '20% OFF',
    badgeColor: 'bg-white text-green-600',
    cta: 'Browse Veg',
    link: '/listings?category=Indian',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&q=80',
  },
  newchef: {
    bg: 'from-purple-500 to-indigo-600',
    icon: '👨‍🍳',
    headline: 'New Chef Alert!',
    sub: 'Fatema\'s street food is back — fuchka & haleem',
    badge: 'NEW',
    badgeColor: 'bg-white text-purple-600',
    cta: 'Check Out',
    link: '/chef/u004',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80',
  },
  freedel: {
    bg: 'from-rose-500 to-pink-600',
    icon: '🛵',
    headline: 'Free Delivery Weekend',
    sub: 'No minimum order. All chefs. This weekend only.',
    badge: 'FREE DELIVERY',
    badgeColor: 'bg-white text-rose-600',
    cta: 'Order Now',
    link: '/chefs',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80',
  },
}

export default function PromoStrip({ variant = 'biryani', className = '' }) {
  const p = STRIPS[variant]
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${p.bg} ${className}`}>
      <div className="flex items-center gap-4 px-5 py-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.badgeColor}`}>{p.badge}</span>
          </div>
          <p className="font-bold text-white text-sm leading-tight">{p.headline}</p>
          <p className="text-white/80 text-xs mt-0.5 truncate">{p.sub}</p>
        </div>
        {/* Thumbnail */}
        <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
          <img src={p.image} alt="" className="w-full h-full object-cover" />
        </div>
        <Link
          to={p.link}
          className="flex-shrink-0 bg-white text-dark text-xs font-bold px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors shadow-sm whitespace-nowrap"
        >
          {p.cta} →
        </Link>
      </div>
    </div>
  )
}
