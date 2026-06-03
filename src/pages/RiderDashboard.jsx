import { useState, useEffect, useRef, useCallback } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Toast from '../components/Toast'
import ordersData from '../data/orders.json'
import usersData from '../data/users.json'
import chefsData from '../data/chefs.json'

// ─────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────
const STATUS_SEQUENCE = ['confirmed', 'preparing', 'picked_up', 'on_the_way', 'delivered']

const statusColors = {
  pending:    'bg-gray-100 text-gray-500',
  confirmed:  'bg-blue-100 text-blue-700',
  preparing:  'bg-orange-100 text-orange-700',
  picked_up:  'bg-purple-100 text-purple-700',
  on_the_way: 'bg-indigo-100 text-indigo-700',
  delivered:  'bg-green-100 text-green-700',
}
const statusLabel = {
  pending:    'Pending',
  confirmed:  'Confirmed',
  preparing:  'Preparing',
  picked_up:  'Picked Up',
  on_the_way: 'On the Way',
  delivered:  'Delivered',
}

const VEHICLE_TYPES = ['Motorcycle', 'Bicycle', 'Scooter', 'Electric Bike', 'Van']

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────
function haversineDist(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return +(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1)
}

function guesstimateCustomerCoords(address) {
  if (!address) return { lat: 23.76, lng: 90.38 }
  const lower = address.toLowerCase()
  if (lower.includes('dhanmondi'))  return { lat: 23.7461, lng: 90.3742 }
  if (lower.includes('gulshan'))    return { lat: 23.7807, lng: 90.4142 }
  if (lower.includes('motijheel'))  return { lat: 23.7337, lng: 90.4178 }
  if (lower.includes('mirpur'))     return { lat: 23.8103, lng: 90.3660 }
  if (lower.includes('uttara'))     return { lat: 23.8759, lng: 90.3795 }
  if (lower.includes('banani'))     return { lat: 23.7937, lng: 90.4066 }
  return { lat: 23.76 + Math.random() * 0.05, lng: 90.38 + Math.random() * 0.05 }
}

function calcEarning(distKm, orderTotal) {
  return Math.round(40 + distKm * 8 + orderTotal * 0.04)
}
function estimateMinutes(distKm) {
  return Math.max(5, Math.round((distKm / 18) * 60))
}

const BOOST_TEMPLATES = [
  { emoji: '⚡', label: 'Surge Zone',  color: 'bg-yellow-100 text-yellow-700 border-yellow-200', extra: 30, reason: '+৳30 peak hour bonus' },
  { emoji: '🔥', label: 'Hot Order',   color: 'bg-red-100 text-red-700 border-red-200',          extra: 25, reason: '+৳25 high-demand boost' },
  { emoji: '🎯', label: 'Near You',    color: 'bg-green-100 text-green-700 border-green-200',    extra: 0,  reason: 'Pickup is <1 km away' },
  { emoji: '💎', label: 'Premium',     color: 'bg-purple-100 text-purple-700 border-purple-200', extra: 50, reason: '+৳50 premium order tip' },
  { emoji: '🚀', label: 'Fast Bonus',  color: 'bg-blue-100 text-blue-700 border-blue-200',       extra: 20, reason: '+৳20 if delivered in time' },
]
function seedBoost(orderId) {
  const hash = orderId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  if (hash % 3 !== 0) return null
  return BOOST_TEMPLATES[hash % BOOST_TEMPLATES.length]
}

const MEAL_POOL = [
  [{ name: 'Shorshe Ilish', price: 280 }, { name: 'Plain Rice', price: 60 }],
  [{ name: 'Kacchi Biryani', price: 380 }],
  [{ name: 'Beef Bhuna', price: 250 }, { name: 'Paratha', price: 40 }],
  [{ name: 'Chingri Malai Curry', price: 320 }, { name: 'Steamed Rice', price: 50 }],
  [{ name: 'Chicken Rezala', price: 220 }, { name: 'Naan', price: 50 }],
  [{ name: 'Dal Makhani', price: 150 }, { name: 'Paneer Butter Masala', price: 180 }, { name: 'Butter Naan', price: 60 }],
  [{ name: 'Pasta Carbonara', price: 290 }, { name: 'Garlic Bread', price: 70 }],
  [{ name: 'Kung Pao Chicken', price: 260 }, { name: 'Spring Rolls', price: 80 }],
  [{ name: 'Vegetable Khichuri', price: 120 }, { name: 'Begun Bhaja', price: 80 }],
  [{ name: 'Mutton Korma', price: 350 }, { name: 'Laccha Paratha', price: 60 }],
]
const ADDRESS_POOL = [
  'House 7, Road 2, Dhanmondi, Dhaka',
  'Flat 5A, Gulshan-1, Dhaka',
  'Level 3, Banani Tower, Dhaka',
  'House 22, Road 11, Banani, Dhaka',
  'Mirpur-10, Block C, Dhaka',
  'Flat 3B, Gulshan Avenue, Dhaka',
  'House 12, Road 5, Dhanmondi, Dhaka',
  'Uttara Sector 7, House 4, Dhaka',
  'Level 4, Amin Court, Motijheel, Dhaka',
  'Mohammadpur, Block D, Dhaka',
]
const CUSTOMER_NAMES = [
  'Tanvir Hossain', 'Meherin Akter', 'Sagor Islam', 'Nusrat Jahan',
  'Arif Billah', 'Tania Sultana', 'Rifat Hasan', 'Sharmin Khanam',
  'Imran Khan', 'Farjana Begum', 'Sabbir Ahmed', 'Mitu Akter',
]
const CUSTOMER_PHONES = [
  '+8801712345678', '+8801823456789', '+8801934567890', '+8801645678901',
  '+8801756789012', '+8801867890123', '+8801978901234', '+8801589012345',
]

let taskCounter = 100
function generateTask() {
  taskCounter++
  const id = `gen${taskCounter}`
  const chef = chefsData[Math.floor(Math.random() * chefsData.length)]
  const mealCombo = MEAL_POOL[Math.floor(Math.random() * MEAL_POOL.length)]
  const address = ADDRESS_POOL[Math.floor(Math.random() * ADDRESS_POOL.length)]
  const customerName = CUSTOMER_NAMES[Math.floor(Math.random() * CUSTOMER_NAMES.length)]
  const customerPhone = CUSTOMER_PHONES[Math.floor(Math.random() * CUSTOMER_PHONES.length)]
  const items = mealCombo.map((m, i) => ({
    mealId: `gen_${id}_${i}`, name: m.name, price: m.price, quantity: 1,
  }))
  const total = items.reduce((s, i) => s + i.price, 0)
  const codes = ['143','256','389','412','537','628','741','853','967','024']
  const securityCode = codes[taskCounter % codes.length]
  const isCOD = taskCounter % 5 < 2  // ~40% are Cash on Delivery
  return {
    id, chefId: chef.id, customerId: null, riderId: null,
    customerName, customerPhone, items, total, address,
    status: Math.random() > 0.5 ? 'preparing' : 'confirmed',
    securityCode, placedAt: new Date().toISOString(), deliveredAt: null,
    isCOD,
    _generated: true,
  }
}

function enrichOrder(order) {
  const chef = chefsData.find(c => c.id === order.chefId)
  const customer = order._generated
    ? { name: order.customerName, phone: order.customerPhone }
    : usersData.find(u => u.id === order.customerId)
  const custCoords   = guesstimateCustomerCoords(order.address)
  const chefLat      = chef?.lat ?? 23.76
  const chefLng      = chef?.lng ?? 90.38
  const pickupDist   = haversineDist(23.76, 90.38, chefLat, chefLng)
  const delivDist    = haversineDist(chefLat, chefLng, custCoords.lat, custCoords.lng)
  const totalDist    = +(pickupDist + delivDist).toFixed(1)
  const earning      = calcEarning(totalDist, order.total)
  const eta          = estimateMinutes(totalDist)
  const boost        = seedBoost(order.id)
  // assign random customer rating (3.5–5.0) for completed orders
  const customerRating = order.status === 'delivered'
    ? (3.5 + Math.abs(order.id.split('').reduce((a,c)=>a+c.charCodeAt(0),0) % 16) * 0.1).toFixed(1)
    : null
  return { ...order, chef, customer, custCoords, totalDist, pickupDist, delivDist, earning, eta, boost, customerRating }
}

// ─────────────────────────────────────────────
//  Sub-components
// ─────────────────────────────────────────────

// Inline mini map using Leaflet
function RiderMap({ order }) {
  const mapRef = useRef(null)
  const mapObj = useRef(null)
  const riderRef = useRef(null)
  const animRef = useRef(null)
  const [leafletReady, setLeafletReady] = useState(!!window.L)

  const chefCoord     = order.chef?.lat ? [order.chef.lat, order.chef.lng] : [23.7634, 90.3890]
  const customerCoord = [order.custCoords?.lat ?? chefCoord[0] + 0.018, order.custCoords?.lng ?? chefCoord[1] + 0.012]
  const stepIdx = STATUS_SEQUENCE.indexOf(order.status)

  useEffect(() => {
    if (window.L) { setLeafletReady(true); return }
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'; link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }
    if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script')
      script.id = 'leaflet-js'
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload = () => setLeafletReady(true)
      document.head.appendChild(script)
    }
  }, [])

  useEffect(() => {
    if (!leafletReady || !mapRef.current || mapObj.current) return
    const L = window.L
    const map = L.map(mapRef.current, {
      center: [(chefCoord[0] + customerCoord[0]) / 2, (chefCoord[1] + customerCoord[1]) / 2],
      zoom: 14, zoomControl: false, attributionControl: false,
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map)

    const makeIcon = (emoji, color) => L.divIcon({
      className: '',
      html: `<div style="background:${color};width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;">
               <span style="transform:rotate(45deg);font-size:14px;display:block;text-align:center;line-height:28px;">${emoji}</span>
             </div>`,
      iconSize: [32, 32], iconAnchor: [16, 32],
    })

    L.marker(chefCoord,     { icon: makeIcon('🍳', '#FF6B35') }).addTo(map).bindPopup(`<b>${order.chef?.name||'Chef'}</b>`)
    L.marker(customerCoord, { icon: makeIcon('🏠', '#3B82F6') }).addTo(map).bindPopup('<b>Drop-off</b>')
    L.polyline([chefCoord, customerCoord], { color:'#FF6B35', weight:3, dashArray:'8 8', opacity:0.6 }).addTo(map)

    const riderIcon = L.divIcon({
      className: '',
      html: `<div style="background:white;width:36px;height:36px;border-radius:50%;border:3px solid #FF6B35;box-shadow:0 2px 10px rgba(255,107,53,0.4);display:flex;align-items:center;justify-content:center;font-size:18px;">🛵</div>`,
      iconSize: [36,36], iconAnchor: [18,18],
    })
    const riderMarker = L.marker(chefCoord, { icon: riderIcon, zIndexOffset: 1000 }).addTo(map)
    riderRef.current = riderMarker
    mapObj.current   = map
  }, [leafletReady])

  useEffect(() => {
    if (!mapObj.current || !riderRef.current) return
    if (animRef.current) clearInterval(animRef.current)
    if (stepIdx < 2) { riderRef.current.setLatLng(chefCoord); return }
    if (order.status === 'delivered') { riderRef.current.setLatLng(customerCoord); return }
    let t = stepIdx >= 3 ? 0.5 : 0.05
    animRef.current = setInterval(() => {
      t = Math.min(t + 0.008, 1)
      riderRef.current.setLatLng([
        chefCoord[0] + (customerCoord[0] - chefCoord[0]) * t,
        chefCoord[1] + (customerCoord[1] - chefCoord[1]) * t,
      ])
      if (t >= 1) clearInterval(animRef.current)
    }, 200)
    return () => clearInterval(animRef.current)
  }, [stepIdx, order.status])

  if (!leafletReady) return (
    <div className="h-48 rounded-2xl bg-gray-100 flex items-center justify-center">
      <div className="flex flex-col items-center gap-2 text-gray-400">
        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        <span className="text-xs">Loading map…</span>
      </div>
    </div>
  )

  return (
    <div className="relative rounded-2xl overflow-hidden border border-gray-100 shadow-sm" style={{ isolation: 'isolate', zIndex: 0 }}>
      <div ref={mapRef} style={{ height: '220px', width: '100%', position: 'relative', zIndex: 0 }} />
      <div className="absolute bottom-2 left-2 flex flex-col gap-0.5 bg-white/90 backdrop-blur-sm rounded-xl px-2.5 py-1.5 shadow text-xs">
        <div className="flex items-center gap-1.5"><span>🍳</span><span className="text-gray-600">Pickup</span></div>
        <div className="flex items-center gap-1.5"><span>🛵</span><span className="text-gray-600">You</span></div>
        <div className="flex items-center gap-1.5"><span>🏠</span><span className="text-gray-600">Drop-off</span></div>
      </div>
      {order.status !== 'delivered' && (
        <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 shadow text-xs font-semibold text-green-600">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Live
        </div>
      )}
    </div>
  )
}

// Earnings Chart
function EarningsChart({ history }) {
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  const today = new Date().getDay()
  // Build last-7-days buckets
  const buckets = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    return { label: days[d.getDay()], date: d.toDateString(), total: 0, count: 0 }
  })
  history.forEach(o => {
    const orderDate = new Date(o.placedAt || o.deliveredAt || Date.now()).toDateString()
    const bucket = buckets.find(b => b.date === orderDate)
    if (bucket) { bucket.total += (o.earning || 0) + (o.boost?.extra || 0); bucket.count++ }
  })
  // Add mock data so chart always looks good
  buckets.forEach((b, i) => { if (b.total === 0 && i < 6) { b.total = 80 + Math.floor(Math.sin(i)*40+i*30); b.count = Math.max(1, Math.floor(b.total/80)) } })
  const max = Math.max(...buckets.map(b => b.total), 1)
  const weekTotal = buckets.reduce((s, b) => s + b.total, 0)
  const weekDeliveries = buckets.reduce((s, b) => s + b.count, 0)
  const todayBucket = buckets[6]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Today's Earnings", val: `৳${todayBucket.total}`, icon: '📅', color: 'text-brand' },
          { label: 'Week Total', val: `৳${weekTotal}`, icon: '📊', color: 'text-green-600' },
          { label: 'Week Deliveries', val: weekDeliveries, icon: '📦', color: 'text-blue-600' },
        ].map(s => (
          <div key={s.label} className="bg-gray-50 rounded-2xl p-3 text-center">
            <div className="text-lg">{s.icon}</div>
            <div className={`font-bold text-sm ${s.color}`}>{s.val}</div>
            <div className="text-gray-400 text-xs mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Last 7 Days</p>
        <div className="flex items-end gap-2 h-28">
          {buckets.map((b, i) => {
            const pct = max > 0 ? (b.total / max) * 100 : 0
            const isToday = i === 6
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-gray-400" style={{fontSize:'10px'}}>৳{b.total}</span>
                <div className="w-full rounded-t-lg transition-all duration-500 relative group"
                  style={{ height: `${Math.max(pct, 4)}%`, background: isToday ? '#FF6B35' : '#e5e7eb' }}>
                  {isToday && <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-brand rounded-full" />}
                </div>
                <span className={`text-xs font-medium ${isToday ? 'text-brand' : 'text-gray-400'}`}
                  style={{fontSize:'10px'}}>{b.label}</span>
              </div>
            )
          })}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Payout History</p>
        <div className="space-y-2">
          {[
            { date: 'Jun 1, 2026', amount: 1240, status: 'Paid', method: 'bKash' },
            { date: 'May 25, 2026', amount: 980, status: 'Paid', method: 'bKash' },
            { date: 'May 18, 2026', amount: 1560, status: 'Paid', method: 'Nagad' },
          ].map(p => (
            <div key={p.date} className="flex items-center justify-between text-sm bg-gray-50 rounded-xl px-3 py-2.5">
              <div>
                <p className="font-medium text-dark text-xs">{p.date}</p>
                <p className="text-gray-400 text-xs">{p.method}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600 text-sm">৳{p.amount}</p>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{p.status}</span>
              </div>
            </div>
          ))}
        </div>
        <button className="w-full mt-3 border border-gray-200 text-gray-500 text-xs font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
          💳 Withdraw Earnings
        </button>
      </div>
    </div>
  )
}

// Ratings panel
function RatingsPanel({ deliveredOrders }) {
  const ratings = deliveredOrders.map(o => parseFloat(o.customerRating)).filter(Boolean)
  const avg = ratings.length ? (ratings.reduce((a,b)=>a+b,0)/ratings.length).toFixed(1) : '—'
  const dist = [5,4,3,2,1].map(star => ({
    star, count: ratings.filter(r => Math.round(r) === star).length
  }))
  const FEEDBACK = [
    'Fast delivery! 🚀',
    'Very polite rider 😊',
    'Delivered on time ⏱',
    'Food was still hot 🔥',
    'Great communication 📱',
    'Careful with the order 🙌',
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 bg-orange-50 border border-orange-100 rounded-2xl p-4">
        <div className="text-center">
          <div className="text-4xl font-bold text-brand">{avg}</div>
          <div className="text-xs text-gray-500 mt-0.5">Avg. Rating</div>
          <div className="flex mt-1">
            {[1,2,3,4,5].map(s => (
              <span key={s} className={`text-sm ${parseFloat(avg)>=s ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
            ))}
          </div>
        </div>
        <div className="flex-1 space-y-1.5">
          {dist.map(({ star, count }) => (
            <div key={star} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-3">{star}</span>
              <span className="text-yellow-400 text-xs">★</span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400 rounded-full transition-all duration-700"
                  style={{ width: ratings.length ? `${(count/ratings.length)*100}%` : '0%' }} />
              </div>
              <span className="text-xs text-gray-400 w-4">{count}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Recent Feedback</p>
        <div className="flex flex-wrap gap-2">
          {FEEDBACK.map(f => (
            <span key={f} className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full">{f}</span>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Recent Ratings</p>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {deliveredOrders.slice(0,8).map(o => (
            <div key={o.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-xl px-3 py-2">
              <div>
                <p className="font-medium text-dark text-xs">{o.customer?.name ?? 'Customer'}</p>
                <p className="text-gray-400 text-xs truncate max-w-[160px]">{o.items?.[0]?.name}</p>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-yellow-400 text-xs">★</span>
                <span className="font-bold text-xs text-dark">{o.customerRating}</span>
              </div>
            </div>
          ))}
          {deliveredOrders.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-4">Complete deliveries to see ratings</p>
          )}
        </div>
      </div>
    </div>
  )
}

// Profile settings panel
function ProfilePanel({ currentUser, deliveryCount }) {
  const [vehicle, setVehicle] = useState(() => localStorage.getItem('hcm_rider_vehicle') || 'Motorcycle')
  const [phone, setPhone] = useState(currentUser.phone || '')
  const [bank, setBank] = useState(() => localStorage.getItem('hcm_rider_bank') || '')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    localStorage.setItem('hcm_rider_vehicle', vehicle)
    localStorage.setItem('hcm_rider_bank', bank)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
        <img src={currentUser.avatar} alt="" className="w-16 h-16 rounded-2xl object-cover border-2 border-orange-100" />
        <div>
          <p className="font-bold text-dark">{currentUser.name}</p>
          <p className="text-xs text-gray-400">{currentUser.email}</p>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-yellow-400 text-xs">★</span>
            <span className="text-xs font-semibold text-dark">{currentUser.rating ?? '4.8'}</span>
            <span className="text-xs text-gray-400">· {deliveryCount ?? currentUser.totalDeliveries ?? 0} deliveries</span>
          </div>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1.5">Vehicle Type</label>
        <div className="grid grid-cols-3 gap-2">
          {VEHICLE_TYPES.map(v => (
            <button key={v} onClick={() => setVehicle(v)}
              className={`text-xs py-2 rounded-xl border font-medium transition-all ${
                vehicle === v ? 'bg-orange-50 border-brand text-brand' : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}>
              {v === 'Motorcycle' ? '🏍' : v === 'Bicycle' ? '🚲' : v === 'Scooter' ? '🛵' : v === 'Electric Bike' ? '⚡' : '🚐'} {v}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1.5">Phone Number</label>
        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
          className="input text-sm" placeholder="+8801XXXXXXXXX" />
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1.5">Payment Account (bKash / Nagad)</label>
        <input type="text" value={bank} onChange={e => setBank(e.target.value)}
          className="input text-sm" placeholder="e.g. 01712345678 (bKash)" />
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
        📍 Zone {currentUser.zone ?? '1'} · {currentUser.areaName ?? 'Dhaka'}
        <span className="block mt-0.5 text-blue-400">Contact support to change your delivery zone</span>
      </div>

      <button onClick={handleSave}
        className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${
          saved ? 'bg-green-500 text-white' : 'btn-primary'
        }`}>
        {saved ? '✅ Saved!' : '💾 Save Profile'}
      </button>
    </div>
  )
}

// Notification sound using Web Audio API
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4)
  } catch(_) {}
}

// ─────────────────────────────────────────────
//  Main Component
// ─────────────────────────────────────────────
export default function RiderDashboard() {
  const { currentUser } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [allOrders, setAllOrders] = useState([])
  const [generatedTasks, setGeneratedTasks] = useState(() =>
    [generateTask(), generateTask(), generateTask(), generateTask()].map(enrichOrder)
  )
  const [activeTab, setActiveTab] = useState('available')

  // Read ?panel= from URL — used when navigating from the navbar dropdown
  const VALID_PANELS = ['profile', 'earnings', 'ratings']
  const [activeSection, setActiveSection] = useState(() => {
    const p = searchParams.get('panel')
    return VALID_PANELS.includes(p) ? p : null
  })

  const [expandedId, setExpandedId] = useState(null)
  const [toast, setToast] = useState(null)
  const [codeInputs, setCodeInputs] = useState({})
  const [codeErrors, setCodeErrors] = useState({})
  const [accepting, setAccepting] = useState(null)
  const [isOnline, setIsOnline] = useState(() => localStorage.getItem('hcm_rider_online') !== 'false')
  const [photoProofs, setPhotoProofs] = useState({})  // orderId → dataURL
  const [ratings, setRatings] = useState({})          // orderId → star rating
  const [helpOpenId, setHelpOpenId] = useState(null)  // orderId with help panel open
  const [helpTicket, setHelpTicket] = useState({})    // orderId → { issue, note, submitted }
  const [codCollected, setCodCollected] = useState({}) // orderId → bool
  const [notifCount, setNotifCount] = useState(0)
  const [historyFilter, setHistoryFilter] = useState('all') // 'all' | 'today' | 'week'
  const [profilePopupOpen, setProfilePopupOpen] = useState(false)
  const [profileTab, setProfileTab] = useState('profile') // 'profile' | 'earnings' | 'ratings'
  // chefReadyTimers: { [orderId]: { countdown: number, ready: boolean } }
  const [chefReadyTimers, setChefReadyTimers] = useState({})
  const timeoutRef = useRef(null)
  const prevCountRef = useRef(0)
  const fileInputRefs = useRef({})
  const chefTimerRefs = useRef({}) // orderId → intervalId

  if (!currentUser || currentUser.role !== 'rider') return <Navigate to="/login" replace />

  // React to ?panel= changes — fires on first load AND on navigate from navbar
  useEffect(() => {
    const p = searchParams.get('panel')
    if (VALID_PANELS.includes(p)) {
      setActiveSection(p)
      setSearchParams({}, { replace: true }) // clean the URL
    }
  }, [searchParams.toString()])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const persistOrders = (updated) => {
    const local = JSON.parse(localStorage.getItem('hcm_orders') || '[]')
    const localMap = {}
    local.forEach(o => { localMap[o.id] = o })
    updated.forEach(o => { localMap[o.id] = o })
    localStorage.setItem('hcm_orders', JSON.stringify(Object.values(localMap)))
  }

  useEffect(() => {
    const local = JSON.parse(localStorage.getItem('hcm_orders') || '[]')
    const localIds = new Set(local.map(o => o.id))
    const merged = [...local, ...ordersData.filter(o => !localIds.has(o.id))]
    setAllOrders(merged.map(enrichOrder))
  }, [currentUser.id])

  // ── Auto-advance chef "preparing" timer ──────────────────────────────
  // Starts a 10-20s countdown the moment a rider accepts an order in
  // confirmed/preparing. Counts down visibly, then flips to "Order Ready"
  // and shows the pickup button.
  useEffect(() => {
    const myActive = allOrders.filter(
      o => o.riderId === currentUser.id && o.status !== 'delivered' && o.status !== 'rejected'
    )
    myActive.forEach(order => {
      if (order.status !== 'pending' && order.status !== 'confirmed' && order.status !== 'preparing') return
      if (chefTimerRefs.current[order.id]) return // already running

      // If still pending, auto-confirm in 3-6s first, then the normal prep timer kicks in
      if (order.status === 'pending') {
        const confirmDelay = 3000 + Math.random() * 3000
        const confirmTimer = setTimeout(() => {
          setAllOrders(orders => {
            const updated = orders.map(o =>
              o.id === order.id && o.status === 'pending'
                ? { ...o, status: 'confirmed' }
                : o
            )
            persistOrders(updated)
            return updated
          })
        }, confirmDelay)
        chefTimerRefs.current[order.id] = confirmTimer // reuse ref so it gets cleaned up
        return
      }

      const prepSecs = 10 + Math.floor(Math.random() * 11) // 10-20 s

      setChefReadyTimers(prev => ({
        ...prev,
        [order.id]: { countdown: prepSecs, ready: false },
      }))

      const interval = setInterval(() => {
        setChefReadyTimers(prev => {
          const cur = prev[order.id]
          if (!cur || cur.ready) return prev
          const next = cur.countdown - 1
          if (next <= 0) {
            clearInterval(chefTimerRefs.current[order.id])
            delete chefTimerRefs.current[order.id]
            // Advance to preparing if still confirmed
            setAllOrders(orders => {
              const updated = orders.map(o => {
                if (o.id !== order.id) return o
                const newStatus = o.status === 'confirmed' ? 'preparing' : o.status
                return { ...o, status: newStatus }
              })
              persistOrders(updated)
              return updated
            })
            showToast('🍳 Order is ready for pickup!')
            playNotificationSound()
            return { ...prev, [order.id]: { countdown: 0, ready: true } }
          }
          return { ...prev, [order.id]: { ...cur, countdown: next } }
        })
      }, 1000)

      chefTimerRefs.current[order.id] = interval
    })
    return () => {
      allOrders
        .filter(o => o.status === 'delivered' || o.status === 'rejected')
        .forEach(o => {
          if (chefTimerRefs.current[o.id]) {
            clearInterval(chefTimerRefs.current[o.id])
            delete chefTimerRefs.current[o.id]
          }
        })
    }
  }, [allOrders.map(o => o.id + o.status).join(',')])

  // Spawn + expire generated tasks naturally (max 13 on screen at once)
  useEffect(() => {
    if (!isOnline) return

    // Spawn a new task
    const spawn = () => {
      const task = enrichOrder(generateTask())
      task._expiresAt = Date.now() + 25000 + Math.random() * 20000 // expires in 25-45s
      setGeneratedTasks(prev => {
        // Don't exceed 13 total visible (combined with static)
        const visibleStatic = allOrders.filter(o =>
          !o.riderId && o.status !== 'delivered' && o.status !== 'rejected'
        ).length
        if (prev.length + visibleStatic >= 13) return prev
        const next = [...prev, task]
        if (task.boost && task.boost.extra >= 25) {
          playNotificationSound()
          setNotifCount(c => c + 1)
        }
        return next
      })
    }

    // Expire tasks that other "riders" already took
    const expireOld = () => {
      setGeneratedTasks(prev => {
        const now = Date.now()
        const filtered = prev.filter(t => !t._expiresAt || t._expiresAt > now)
        if (filtered.length < prev.length) {
          // one or more expired — subtle, no toast
        }
        return filtered
      })
    }

    const scheduleSpawn = () => {
      const delay = 12000 + Math.random() * 10000
      return setTimeout(() => { spawn(); timeoutRef.current = scheduleSpawn() }, delay)
    }
    timeoutRef.current = scheduleSpawn()

    // Run expiry check every 5 seconds
    const expireInterval = setInterval(expireOld, 5000)

    return () => {
      clearTimeout(timeoutRef.current)
      clearInterval(expireInterval)
    }
  }, [isOnline])

  // Toggle online / offline
  const toggleOnline = () => {
    if (isOnline && myActive.length > 0) {
      showToast('⚠️ Complete your active task before going offline.', 'error')
      return
    }
    const next = !isOnline
    setIsOnline(next)
    localStorage.setItem('hcm_rider_online', String(next))
    showToast(next ? '🟢 You are now Online' : '🔴 You are now Offline', next ? 'success' : 'error')
  }

  const riderZone = currentUser.zone ? Number(currentUser.zone) : null

  // Rider can see their own zone + up to 2 zones away (e.g. zone 3 → zones 1-5)
  const isInZoneRange = (orderChefZone) => {
    if (!riderZone || !orderChefZone) return true // no zone data → show everything
    return Math.abs(Number(orderChefZone) - riderZone) <= 2
  }

  // Zone-filtered static orders (±2 zones)
  const staticAvailable = allOrders.filter(o =>
    !o.riderId &&
    o.status !== 'delivered' &&
    o.status !== 'rejected' &&
    isInZoneRange(o.chef?.zone)
  )

  // Zone-filtered generated tasks (±2 zones, cap to 13 total, natural expiry handled below)
  const zoneGenTasks = generatedTasks.filter(o => isInZoneRange(o.chef?.zone))

  const combined = isOnline ? [...staticAvailable, ...zoneGenTasks] : []
  const availableOrders = combined.slice(0, 13)
  const myOrders  = allOrders.filter(o => o.riderId === currentUser.id)
  const myActive  = myOrders.filter(o => o.status !== 'delivered' && o.status !== 'rejected')
  const myDone    = myOrders.filter(o => o.status === 'delivered')

  // History filter
  const filteredDone = myDone.filter(o => {
    if (historyFilter === 'all') return true
    const placed = new Date(o.placedAt || o.deliveredAt || 0)
    const now = new Date()
    if (historyFilter === 'today') return placed.toDateString() === now.toDateString()
    if (historyFilter === 'week') {
      const weekAgo = new Date(); weekAgo.setDate(now.getDate() - 7)
      return placed >= weekAgo
    }
    return true
  })

  const activeZones = myActive.map(o => o.chef?.zone ? Number(o.chef.zone) : null).filter(Boolean)
  const sameZoneAllowed = (order) => {
    if (myActive.length === 0) return true
    if (myActive.length >= 2) return false
    if (myActive.length === 1) {
      const cz = order.chef?.zone ? Number(order.chef.zone) : null
      if (!cz || activeZones.length === 0) return true
      // Allow if within 1 zone of the active task's zone (stricter when already busy)
      return activeZones.some(az => Math.abs(cz - az) <= 1)
    }
    return false
  }
  const canAccept = (order) => myActive.length === 0 || sameZoneAllowed(order)

  const acceptTask = (orderId) => {
    setAccepting(orderId)
    setNotifCount(0)
    setTimeout(() => {
      const genTask = generatedTasks.find(t => t.id === orderId)
      if (genTask) {
        const claimed = { ...genTask, riderId: currentUser.id }
        setGeneratedTasks(prev => prev.filter(t => t.id !== orderId))
        setAllOrders(prev => { const u = [...prev, claimed]; persistOrders(u); return u })
      } else {
        setAllOrders(prev => {
          const updated = prev.map(o => o.id === orderId ? { ...o, riderId: currentUser.id } : o)
          persistOrders(updated); return updated
        })
      }
      setAccepting(null); setActiveTab('active'); setExpandedId(orderId)
      showToast('Task accepted! Head to pickup 🛵')
    }, 700)
  }

  const rejectTask = (orderId) => {
    setGeneratedTasks(prev => prev.filter(t => t.id !== orderId))
    setAllOrders(prev => prev.filter(o => o.id !== orderId))
    showToast('Task skipped', 'info')
  }

  const updateStatus = (orderId, nextStatus) => {
    setAllOrders(prev => {
      const updated = prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o)
      persistOrders(updated); return updated
    })
    showToast(nextStatus === 'delivered' ? '🎉 Delivery complete! Earning added.' : 'Status updated!')
  }

  // Photo proof handler
  const handlePhotoUpload = (orderId, e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setPhotoProofs(prev => ({ ...prev, [orderId]: ev.target.result }))
      showToast('📸 Photo proof saved!')
    }
    reader.readAsDataURL(file)
  }

  const totalEarnings = myDone.reduce((s, o) => s + (o.earning || 0) + (photoProofs[o.id] ? Math.round(o.total * 0.02) : 0), 0)
  const totalBonus    = myDone.reduce((s, o) => s + (o.boost?.extra || 0), 0)
  const avgRating     = myDone.length ? (myDone.reduce((s,o) => s + parseFloat(o.customerRating||0),0)/myDone.length).toFixed(1) : '—'

  const displayOrders =
    activeTab === 'available' ? availableOrders :
    activeTab === 'active'    ? myActive :
    filteredDone

  const TABS = [
    { key: 'available', label: '🗂 Available', count: availableOrders.length, live: isOnline },
    { key: 'active',    label: '🛵 My Tasks',  count: myActive.length },
    { key: 'done',      label: '✅ Done',      count: myDone.length },
  ]

  return (
    <div className="page-wrapper bg-gray-50 min-h-screen">
      <Toast message={toast?.message} type={toast?.type} />

      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 mb-4">
          <img src={currentUser.avatar} alt="" className="w-12 h-12 rounded-2xl border-2 border-gray-100 object-cover" />
          <div className="flex-1">
            <h1 className="text-lg font-bold text-dark leading-tight">{currentUser.name}</h1>
            <p className="text-xs text-gray-400">
              ⭐ {avgRating !== '—' ? avgRating : (currentUser.rating ?? '4.8')}
              &nbsp;·&nbsp; {myDone.length} deliveries
            </p>
            {currentUser.areaName && (
              <p className="text-xs text-purple-600 font-medium mt-0.5">
                📍 {currentUser.areaName} &nbsp;<span className="text-gray-300">|</span>&nbsp; Zone {currentUser.zone}
              </p>
            )}
          </div>
          {/* Online toggle */}
          <div className="relative group">
            <button onClick={toggleOnline}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                isOnline && myActive.length > 0
                  ? 'bg-green-100 text-green-700 cursor-not-allowed opacity-75'
                  : isOnline
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}>
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              {isOnline ? 'Online' : 'Offline'}
            </button>
            {isOnline && myActive.length > 0 && (
              <div className="absolute right-0 top-full mt-1.5 w-44 bg-gray-800 text-white text-xs rounded-xl px-3 py-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                Complete your active task to go offline
                <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-800 rotate-45" />
              </div>
            )}
          </div>
          {/* Notification badge */}
          {notifCount > 0 && (
            <div className="relative">
              <button onClick={() => { setNotifCount(0); setActiveTab('available') }}
                className="w-9 h-9 bg-brand text-white rounded-xl flex items-center justify-center relative animate-bounce">
                🔔
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {notifCount}
                </span>
              </button>
            </div>
          )}
        </div>



        {/* ── Stats strip ── */}
        <div className="grid grid-cols-4 gap-2.5 mb-4">
          {[
            { emoji: '📦', label: 'Done', val: myDone.length },
            { emoji: '🛵', label: 'Active', val: myActive.length },
            { emoji: '💰', label: 'Earned', val: `৳${totalEarnings}` },
            { emoji: '⭐', label: 'Rating', val: avgRating !== '—' ? avgRating : (currentUser.rating ?? '4.8') },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 text-center">
              <div className="text-xl mb-0.5">{s.emoji}</div>
              <div className="font-bold text-dark text-sm">{s.val}</div>
              <div className="text-gray-400 text-xs">{s.label}</div>
            </div>
          ))}
        </div>




        {/* ── Inline section view (Profile / Earnings / Ratings) ── */}
        {activeSection && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-4 overflow-hidden animate-slide-up">
            {/* Tab bar */}
            <div className="flex border-b border-gray-100">
              {[
                { key: 'profile',  icon: '👤', label: 'Profile' },
                { key: 'earnings', icon: '📊', label: 'Earnings' },
                { key: 'ratings',  icon: '⭐', label: 'Ratings' },
              ].map(t => (
                <button key={t.key} onClick={() => setActiveSection(t.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold border-b-2 transition-all ${
                    activeSection === t.key
                      ? 'border-brand text-brand bg-orange-50/50'
                      : 'border-transparent text-gray-400 hover:text-dark hover:bg-gray-50'
                  }`}>
                  {t.icon} {t.label}
                </button>
              ))}
              <button onClick={() => setActiveSection(null)}
                className="px-4 flex items-center text-gray-300 hover:text-gray-500 border-b-2 border-transparent transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Content */}
            <div className="p-4">
              {activeSection === 'profile'  && <ProfilePanel currentUser={currentUser} deliveryCount={myDone.length} />}
              {activeSection === 'earnings' && <EarningsChart history={myDone} />}
              {activeSection === 'ratings'  && <RatingsPanel deliveredOrders={myDone} />}
            </div>
          </div>
        )}

        {/* ── Capacity banners ── */}
        {!isOnline && (
          <div className="mb-4 bg-gray-100 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-600 flex items-center gap-2">
            <span className="text-lg">🔴</span>
            <span>You are <strong>offline</strong>. Toggle online to receive new orders.</span>
          </div>
        )}
        {myActive.length === 2 && (
          <div className="mb-4 bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3 text-sm text-orange-700 flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <span>2 active tasks. Complete one before accepting more.</span>
          </div>
        )}
        {myActive.length === 1 && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 text-sm text-blue-700 flex items-center gap-2">
            <span className="text-lg">💡</span>
            <span>You can accept 1 more task <strong>within 1 zone</strong> of your current delivery.</span>
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-5">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === tab.key ? 'bg-white text-dark shadow-sm' : 'text-gray-500 hover:text-dark'
              }`}>
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-orange-100 text-brand' : 'bg-gray-200 text-gray-500'}`}>
                {tab.count}
              </span>
              {tab.live && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
            </button>
          ))}
        </div>

        {/* ── History filter (done tab) ── */}
        {activeTab === 'done' && (
          <div className="flex gap-2 mb-4">
            {['all','today','week'].map(f => (
              <button key={f} onClick={() => setHistoryFilter(f)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  historyFilter === f ? 'bg-brand text-white' : 'bg-white border border-gray-100 text-gray-500'
                }`}>
                {f === 'all' ? 'All Time' : f === 'today' ? 'Today' : 'This Week'}
              </button>
            ))}
            <div className="ml-auto text-xs text-gray-400 flex items-center">
              {filteredDone.length} deliveries · ৳{filteredDone.reduce((s,o)=>s+(o.earning||0)+(o.boost?.extra||0),0)}
            </div>
          </div>
        )}

        {/* ── Order List ── */}
        {displayOrders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <div className="text-4xl mb-3">
              {activeTab === 'available' ? (isOnline ? '🔍' : '🔴') : activeTab === 'active' ? '🛵' : '🎉'}
            </div>
            <p className="font-semibold text-dark">
              {activeTab === 'available' ? (isOnline ? 'No available tasks right now' : 'You are offline')
               : activeTab === 'active'  ? 'No active tasks'
               : 'No completed deliveries'}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {activeTab === 'available' && isOnline ? 'New orders will appear here automatically.' : ''}
              {activeTab === 'available' && !isOnline ? 'Go online to start receiving orders.' : ''}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayOrders.map(order => {
              const isExpanded = expandedId === order.id
              const stepIdx    = STATUS_SEQUENCE.indexOf(order.status)
              const isAvail    = activeTab === 'available'
              const locked     = !canAccept(order)
              const isAccepting = accepting === order.id
              const proof      = photoProofs[order.id]

              return (
                <div key={order.id}
                  className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                    isAvail && order.boost ? 'border-yellow-300 ring-1 ring-yellow-200' : 'border-gray-100'
                  }`}>

                  {/* Boost badge */}
                  {isAvail && order.boost && (
                    <div className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b ${order.boost.color}`}>
                      <span>{order.boost.emoji} {order.boost.label}</span>
                      <span className="ml-auto opacity-75">{order.boost.reason}</span>
                    </div>
                  )}

                  {/* Card header */}
                  <div className="p-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : order.id)}>
                    <div className="flex items-start gap-3">
                      {order.chef && (
                        <img src={order.chef.avatar} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0 border border-gray-100" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-dark truncate">{order.chef?.name ?? 'Chef'}</span>
                          {!isAvail && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[order.status] ?? 'bg-gray-100 text-gray-500'}`}>
                              {statusLabel[order.status] ?? order.status}
                            </span>
                          )}
                          {!isAvail && order.isCOD && (
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">
                              💵 COD
                            </span>
                          )}
                          {isAvail && (() => {
                            const oz = order.chef?.zone ? Number(order.chef.zone) : null
                            const diff = (oz && riderZone) ? Math.abs(oz - riderZone) : null
                            return (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                diff === 0 ? 'bg-green-100 text-green-700'
                                : diff === 1 ? 'bg-blue-50 text-blue-600'
                                : diff === 2 ? 'bg-orange-50 text-orange-500'
                                : 'bg-gray-100 text-gray-500'
                              }`}>
                                Zone {order.chef?.zone ?? '—'}{diff !== null && diff > 0 ? ` · +${diff}` : diff === 0 ? ' · Nearby' : ''}
                              </span>
                            )
                          })()}
                          {isAvail && order.isCOD && (
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">
                              💵 COD
                            </span>
                          )}
                          {/* Customer rating badge on done */}
                          {activeTab === 'done' && order.customerRating && (
                            <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                              ★ {order.customerRating}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-1 flex-wrap">
                          <span className="font-medium text-gray-600">📍 {order.chef?.location ?? 'Pickup'}</span>
                          <span>→</span>
                          <span className="truncate">{order.address ?? 'Delivery'}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <span className="text-xs text-gray-400">{order.items?.length} item{order.items?.length !== 1 ? 's' : ''} · ৳{order.total}</span>
                          <span className="text-xs text-gray-400">🗺 {order.totalDist} km</span>
                          <span className="text-xs text-gray-400">⏱ ~{order.eta} min</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <div className="text-base font-bold text-green-600">৳{order.earning + (order.boost?.extra ?? 0)}</div>
                        {order.boost?.extra > 0 && (
                          <div className="text-xs text-yellow-600 font-medium">+৳{order.boost.extra}</div>
                        )}
                        <svg className={`w-4 h-4 text-gray-300 ml-auto mt-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {/* Progress bar */}
                    {!isAvail && order.status !== 'delivered' && (
                      <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-brand rounded-full transition-all duration-700"
                          style={{ width: `${((stepIdx + 1) / STATUS_SEQUENCE.length) * 100}%` }} />
                      </div>
                    )}
                  </div>

                  {/* ── Expanded ── */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 p-4 space-y-4">

                      {/* Earning breakdown */}
                      <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                        <p className="text-xs font-semibold text-green-700 mb-2">💰 Estimated Earning</p>
                        <div className="space-y-1 text-xs text-green-700">
                          <div className="flex justify-between"><span>Base pay</span><span>৳40</span></div>
                          <div className="flex justify-between"><span>Distance ({order.totalDist} km × ৳8)</span><span>৳{Math.round(order.totalDist * 8)}</span></div>
                          <div className="flex justify-between"><span>Order value tip (4%)</span><span>৳{Math.round(order.total * 0.04)}</span></div>
                          {order.boost?.extra > 0 && (
                            <div className="flex justify-between font-semibold text-yellow-700">
                              <span>{order.boost.emoji} {order.boost.label}</span><span>+৳{order.boost.extra}</span>
                            </div>
                          )}
                          {photoProofs[order.id] && (
                            <div className="flex justify-between font-semibold text-blue-700">
                              <span>📸 Photo Bonus (2%)</span><span>+৳{Math.round(order.total * 0.02)}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-bold text-green-800 border-t border-green-200 pt-1 mt-1">
                            <span>Total</span><span>৳{order.earning + (order.boost?.extra ?? 0) + (photoProofs[order.id] ? Math.round(order.total * 0.02) : 0)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Live map — show for active tasks */}
                      {activeTab === 'active' && order.status !== 'confirmed' && (
                        <div>
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Live Map</p>
                          <RiderMap order={order} />
                        </div>
                      )}

                      {/* Route info */}
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Route</p>
                        <div className="space-y-2">
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">🍳</div>
                            <div>
                              <p className="text-xs font-semibold text-dark">{order.chef?.name}</p>
                              <p className="text-xs text-gray-400">{order.chef?.location} · Pickup in ~{Math.round(order.pickupDist / 18 * 60)} min</p>
                            </div>
                          </div>
                          <div className="ml-3 border-l-2 border-dashed border-gray-200 h-4" />
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">🏠</div>
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-dark">{order.customer?.name ?? 'Customer'}</p>
                              <p className="text-xs text-gray-400">{order.address}</p>
                            </div>
                            {/* Customer contact */}
                            {activeTab === 'active' && (order.customer?.phone || order.customerPhone) && (
                              <a href={`tel:${order.customer?.phone || order.customerPhone}`}
                                className="flex-shrink-0 flex items-center gap-1 bg-green-50 text-green-700 border border-green-100 rounded-xl px-3 py-1.5 text-xs font-semibold hover:bg-green-100 transition-colors"
                                onClick={e => e.stopPropagation()}>
                                📱 Call
                              </a>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">📏 Total: {order.totalDist} km &nbsp;·&nbsp; ⏱ ~{order.eta} min</p>

                        {/* Navigate button */}
                        {activeTab === 'active' && (
                          <a href={`https://www.google.com/maps/dir/?api=1&destination=${order.custCoords?.lat},${order.custCoords?.lng}`}
                            target="_blank" rel="noopener noreferrer"
                            className="mt-2 flex items-center justify-center gap-2 w-full border border-blue-200 text-blue-600 text-xs font-semibold py-2.5 rounded-xl hover:bg-blue-50 transition-colors"
                            onClick={e => e.stopPropagation()}>
                            🗺 Open Navigation (Google Maps)
                          </a>
                        )}
                      </div>

                      {/* Items */}
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Order Items</p>
                        <div className="space-y-1">
                          {order.items?.map((item, i) => (
                            <div key={i} className="flex justify-between text-sm">
                              <span className="text-gray-600">{item.name} <span className="text-gray-400">×{item.quantity}</span></span>
                              <span className="font-medium text-dark">৳{item.price * item.quantity}</span>
                            </div>
                          ))}
                          <div className="flex justify-between text-sm font-semibold border-t border-gray-100 pt-1 mt-1">
                            <span>Total</span><span>৳{order.total}</span>
                          </div>
                        </div>
                      </div>

                      {/* ── Accept / Reject (available tab) ── */}
                      {isAvail && (
                        <div className="space-y-2">
                          {locked ? (
                            <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs text-gray-500 text-center">
                              {myActive.length >= 2
                                ? '❌ Complete an active task first.'
                                : '❌ Order is more than 1 zone away from your active delivery.'}
                            </div>
                          ) : (
                            <button onClick={() => acceptTask(order.id)} disabled={isAccepting}
                              className="btn-primary w-full py-3 text-sm font-bold flex items-center justify-center gap-2">
                              {isAccepting ? (
                                <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                </svg> Accepting…</>
                              ) : `✅ Accept · ৳${order.earning + (order.boost?.extra ?? 0)}`}
                            </button>
                          )}
                          <button onClick={() => rejectTask(order.id)}
                            className="w-full border border-gray-200 text-gray-400 text-xs font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                            ✗ Skip this task
                          </button>
                        </div>
                      )}

                      {/* ── Active task actions ── */}
                      {!isAvail && activeTab === 'active' && order.status !== 'delivered' && (() => {
                        const timer = chefReadyTimers[order.id]
                        const isWaiting = (order.status === 'pending' || order.status === 'confirmed' || order.status === 'preparing') && timer && !timer.ready
                        const isReady   = timer?.ready || (!timer && (order.status === 'preparing' || order.status === 'confirmed'))
                        return (
                        <div className="space-y-3">
                          {/* Waiting with countdown */}
                          {isWaiting && (
                            <div className="bg-yellow-50 border border-yellow-100 rounded-2xl px-4 py-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg animate-pulse">🍳</span>
                                  <span className="text-sm font-semibold text-yellow-800">
                                  {order.status === 'pending' ? 'Confirming order…' : 'Chef is preparing…'}
                                </span>
                                </div>
                                <span className="text-xs text-yellow-600 font-mono font-bold bg-yellow-100 px-2.5 py-1 rounded-full">
                                  ~{timer.countdown}s
                                </span>
                              </div>
                              {/* Progress bar */}
                              <div className="h-2 bg-yellow-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-yellow-400 rounded-full transition-all duration-1000"
                                  style={{ width: `${100 - (timer.countdown / (10 + 10)) * 100}%`, minWidth: '4%' }}
                                />
                              </div>
                              <p className="text-xs text-yellow-600 mt-2 text-center">
                                {order.status === 'pending'
                                  ? 'Order is being confirmed by the restaurant…'
                                  : 'Pickup button will appear when ready'}
                              </p>
                            </div>
                          )}

                          {/* Order ready — show pickup button */}
                          {isReady && (order.status === 'pending' || order.status === 'confirmed' || order.status === 'preparing') && (
                            <>
                              <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 flex items-center gap-3">
                                <span className="text-2xl">✅</span>
                                <div>
                                  <p className="text-sm font-bold text-green-800">Order Ready!</p>
                                  <p className="text-xs text-green-600">Head to chef and pick up the order</p>
                                </div>
                                <span className="ml-auto w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
                              </div>
                              <button onClick={() => updateStatus(order.id, 'picked_up')} className="btn-primary w-full py-3 text-sm font-bold">
                                📦 Confirm Pickup
                              </button>
                            </>
                          )}
                          {order.status === 'picked_up' && (
                            <button onClick={() => updateStatus(order.id, 'on_the_way')} className="btn-primary w-full py-3 text-sm font-bold">
                              🚀 Start Delivery
                            </button>
                          )}
                          {order.status === 'on_the_way' && (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-gray-500 mb-1">Enter customer's 3-digit delivery code</p>
                              {/* COD collection block — shown only for COD orders, ABOVE the code input */}
                              {order.isCOD && (
                                <div className={`rounded-2xl border-2 p-4 space-y-3 transition-all ${codCollected[order.id] ? 'border-green-300 bg-green-50' : 'border-orange-200 bg-orange-50'}`}>
                                  <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${codCollected[order.id] ? 'bg-green-100' : 'bg-orange-100'}`}>💵</div>
                                    <div className="flex-1">
                                      <p className={`text-sm font-bold ${codCollected[order.id] ? 'text-green-800' : 'text-orange-800'}`}>Cash on Delivery</p>
                                      <p className={`text-xs mt-0.5 ${codCollected[order.id] ? 'text-green-600' : 'text-orange-600'}`}>Collect <span className="font-bold text-lg">৳{order.total}</span> from customer before handing over the order</p>
                                    </div>
                                  </div>
                                  <label className={`flex items-start gap-3 cursor-pointer rounded-xl border px-3 py-3 transition-all ${codCollected[order.id] ? 'bg-green-100 border-green-300' : 'bg-white border-orange-200 hover:border-orange-400'}`}>
                                    <div className="relative flex-shrink-0 mt-0.5">
                                      <input
                                        type="checkbox"
                                        checked={!!codCollected[order.id]}
                                        onChange={e => setCodCollected(p => ({ ...p, [order.id]: e.target.checked }))}
                                        className="sr-only"
                                      />
                                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${codCollected[order.id] ? 'bg-green-500 border-green-500' : 'bg-white border-orange-300'}`}>
                                        {codCollected[order.id] && (
                                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                                        )}
                                      </div>
                                    </div>
                                    <p className={`text-xs font-semibold leading-relaxed ${codCollected[order.id] ? 'text-green-700' : 'text-orange-700'}`}>
                                      I confirm I have collected <span className="font-bold">৳{order.total}</span> cash from the customer
                                    </p>
                                  </label>
                                  {!codCollected[order.id] && (
                                    <p className="text-xs text-orange-500 text-center">⚠️ You must collect the cash and tick above before marking as delivered</p>
                                  )}
                                </div>
                              )}

                              <div className="flex gap-2 items-stretch">
                                <input type="text" inputMode="numeric" maxLength={3} placeholder="_ _ _"
                                  value={codeInputs[order.id] || ''}
                                  onChange={e => {
                                    const v = e.target.value.replace(/\D/g, '').slice(0, 3)
                                    setCodeInputs(p => ({ ...p, [order.id]: v }))
                                    setCodeErrors(p => ({ ...p, [order.id]: '' }))
                                  }}
                                  className="flex-1 min-w-0 border border-gray-200 rounded-xl px-4 py-3 text-center text-xl font-bold tracking-widest focus:outline-none focus:border-brand" />
                                <button onClick={() => {
                                  const entered = codeInputs[order.id] || ''
                                  const correct = order.securityCode || '000'
                                  if (order.isCOD && !codCollected[order.id]) {
                                    showToast('💵 Please confirm cash collection first.', 'error')
                                    return
                                  }
                                  if (entered !== correct && entered !== '679') {
                                    setCodeErrors(p => ({ ...p, [order.id]: 'Wrong code — ask customer to check their app.' }))
                                    return
                                  }
                                  updateStatus(order.id, 'delivered')
                                }} className={`flex-shrink-0 font-bold w-14 py-3 rounded-xl transition-colors ${order.isCOD && !codCollected[order.id] ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-brand text-white hover:bg-orange-600'}`}>✅</button>
                              </div>
                              {codeErrors[order.id] && <p className="text-xs text-red-500">{codeErrors[order.id]}</p>}
                              <p className="text-xs text-gray-400 text-center">Customer shares this code to confirm delivery</p>
                              <p className="text-xs text-center text-gray-300">🧪 Tester? Use <span className="font-mono font-semibold">679</span></p>

                              {/* Photo proof */}
                              <div className="border-t border-gray-100 pt-3">
                                <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 mb-2">
                                  <span className="text-base">📸</span>
                                  <div className="flex-1">
                                    <p className="text-xs font-bold text-blue-700">Add a delivery photo → earn +2% bonus!</p>
                                    <p className="text-xs text-blue-500">That's +৳{Math.round(order.total * 0.02)} on this order</p>
                                  </div>
                                </div>
                                <p className="text-xs font-semibold text-gray-500 mb-2">Delivery Photo Proof (optional)</p>
                                {proof ? (
                                  <div className="relative">
                                    <img src={proof} alt="proof" className="w-full h-32 object-cover rounded-xl border border-gray-100" />
                                    <button onClick={() => setPhotoProofs(p => { const n={...p}; delete n[order.id]; return n })}
                                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">✕</button>
                                    <span className="absolute bottom-2 left-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">✓ Saved</span>
                                  </div>
                                ) : (
                                  <>
                                    <input type="file" accept="image/*" capture="environment"
                                      ref={el => fileInputRefs.current[order.id] = el}
                                      onChange={e => handlePhotoUpload(order.id, e)}
                                      className="hidden" />
                                    <button onClick={() => fileInputRefs.current[order.id]?.click()}
                                      className="w-full border-2 border-dashed border-gray-200 text-gray-400 text-xs py-4 rounded-xl hover:border-brand hover:text-brand transition-colors">
                                      📷 Take or Upload Photo
                                    </button>
                                  </>
                                )}
                              </div>

                              {/* ── Help & Support ── */}
                              <div className="border-t border-gray-100 pt-3">
                                {helpOpenId !== order.id ? (
                                  <button
                                    onClick={() => setHelpOpenId(order.id)}
                                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 hover:border-red-200 hover:bg-red-50 transition-all group">
                                    <div className="flex items-center gap-2.5">
                                      <span className="text-base">🆘</span>
                                      <div className="text-left">
                                        <p className="text-xs font-bold text-gray-700 group-hover:text-red-600">Need Help?</p>
                                        <p className="text-xs text-gray-400">Report a problem with this delivery</p>
                                      </div>
                                    </div>
                                    <svg className="w-4 h-4 text-gray-300 group-hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </button>
                                ) : (() => {
                                  const ticket = helpTicket[order.id] || {}
                                  const ISSUES = [
                                    { key: 'no_answer',    emoji: '📵', label: 'Customer not responding',     detail: 'Customer is not picking up calls or the door.' },
                                    { key: 'wrong_address',emoji: '🗺',  label: 'Wrong / unclear address',     detail: 'Address is incorrect or cannot be found.' },
                                    { key: 'accident',     emoji: '🚨', label: 'Accident / breakdown',         detail: 'Involved in an accident or vehicle broke down.' },
                                    { key: 'order_damaged',emoji: '📦', label: 'Order damaged or spilled',     detail: 'Food was damaged during transit.' },
                                    { key: 'unsafe_area',  emoji: '⚠️', label: 'Unsafe delivery area',        detail: 'Delivery location feels unsafe to visit.' },
                                    { key: 'app_issue',    emoji: '📱', label: 'App / payment issue',          detail: 'Cannot complete the order due to a technical issue.' },
                                    { key: 'long_wait',    emoji: '⏳', label: 'Extremely long wait at chef',  detail: 'Food not ready and wait is excessive.' },
                                    { key: 'other',        emoji: '💬', label: 'Other issue',                  detail: 'Something else that isn\'t listed above.' },
                                  ]
                                  return (
                                    <div className="rounded-2xl border border-red-100 bg-red-50 overflow-hidden">
                                      {/* Header */}
                                      <div className="flex items-center justify-between px-4 py-3 border-b border-red-100 bg-white">
                                        <div className="flex items-center gap-2">
                                          <span className="text-base">🆘</span>
                                          <p className="text-sm font-bold text-dark">Report a Problem</p>
                                        </div>
                                        <button onClick={() => setHelpOpenId(null)} className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 text-xs">✕</button>
                                      </div>

                                      {ticket.submitted ? (
                                        /* ── Submitted confirmation ── */
                                        <div className="p-4 text-center space-y-2">
                                          <div className="text-3xl">✅</div>
                                          <p className="font-bold text-green-700 text-sm">Support ticket raised!</p>
                                          <p className="text-xs text-gray-500">Our team will contact you shortly on <span className="font-semibold">{currentUser.phone || 'your registered number'}</span>.</p>
                                          <div className="bg-white rounded-xl border border-gray-100 px-3 py-2 text-xs text-left mt-2 space-y-1">
                                            <div className="flex gap-2"><span className="text-gray-400">Issue:</span><span className="font-medium text-dark">{ISSUES.find(i=>i.key===ticket.issue)?.emoji} {ISSUES.find(i=>i.key===ticket.issue)?.label}</span></div>
                                            <div className="flex gap-2"><span className="text-gray-400">Order:</span><span className="font-medium text-dark">#{order.id.slice(-6).toUpperCase()}</span></div>
                                            {ticket.note && <div className="flex gap-2"><span className="text-gray-400">Note:</span><span className="font-medium text-dark">{ticket.note}</span></div>}
                                          </div>
                                          <div className="flex gap-2 mt-3">
                                            <a href="tel:+8801700000000"
                                              className="flex-1 flex items-center justify-center gap-1.5 bg-green-500 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-green-600 transition-colors">
                                              📞 Call Support
                                            </a>
                                            <button onClick={() => { setHelpOpenId(null); setHelpTicket(p=>({...p,[order.id]:null})) }}
                                              className="flex-1 border border-gray-200 text-gray-500 text-xs font-semibold py-2.5 rounded-xl hover:bg-white transition-colors">
                                              Close
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        /* ── Issue picker ── */
                                        <div className="p-3 space-y-3">
                                          <p className="text-xs font-semibold text-gray-500 px-1">What's the problem?</p>
                                          <div className="space-y-2">
                                            {ISSUES.map(issue => (
                                              <button key={issue.key}
                                                onClick={() => setHelpTicket(p => ({ ...p, [order.id]: { ...p[order.id], issue: issue.key } }))}
                                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
                                                  ticket.issue === issue.key
                                                    ? 'bg-white border-red-300 shadow-sm'
                                                    : 'bg-white/60 border-transparent hover:bg-white hover:border-gray-200'
                                                }`}>
                                                <span className="text-base flex-shrink-0">{issue.emoji}</span>
                                                <div className="flex-1 min-w-0">
                                                  <p className={`text-xs font-semibold leading-tight ${ticket.issue === issue.key ? 'text-red-700' : 'text-dark'}`}>{issue.label}</p>
                                                  <p className="text-xs text-gray-400 mt-0.5 leading-tight">{issue.detail}</p>
                                                </div>
                                                {ticket.issue === issue.key && (
                                                  <span className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                                                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                                                  </span>
                                                )}
                                              </button>
                                            ))}
                                          </div>

                                          {/* Optional note */}
                                          {ticket.issue && (
                                            <div className="space-y-1.5 animate-slide-up">
                                              <p className="text-xs font-semibold text-gray-500 px-1">Add a note (optional)</p>
                                              <textarea
                                                rows={2}
                                                placeholder="Any extra details for support…"
                                                value={ticket.note || ''}
                                                onChange={e => setHelpTicket(p => ({ ...p, [order.id]: { ...p[order.id], note: e.target.value } }))}
                                                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-dark resize-none focus:outline-none focus:border-red-300 bg-white"
                                              />
                                            </div>
                                          )}

                                          {/* Emergency call strip — always visible */}
                                          <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-100 px-3 py-2">
                                            <span className="text-xs text-gray-400 flex-1">Emergency? Call support directly</span>
                                            <a href="tel:+8801700000000"
                                              className="flex items-center gap-1 bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-green-600 transition-colors flex-shrink-0">
                                              📞 Call Now
                                            </a>
                                          </div>

                                          {/* Submit */}
                                          <button
                                            disabled={!ticket.issue}
                                            onClick={() => {
                                              if (!ticket.issue) return
                                              setHelpTicket(p => ({ ...p, [order.id]: { ...p[order.id], submitted: true } }))
                                              showToast('🆘 Support ticket raised! Team will contact you soon.', 'info')
                                            }}
                                            className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${
                                              ticket.issue
                                                ? 'bg-red-500 text-white hover:bg-red-600 shadow-sm'
                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            }`}>
                                            {ticket.issue ? '🆘 Submit to Support' : 'Select an issue first'}
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )
                                })()}
                              </div>
                            </div>
                          )}
                        </div>
                        )
                      })()}

                      {/* ── Completed ── */}
                      {order.status === 'delivered' && (
                        <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-4 text-center">
                          <div className="text-2xl mb-1">🎉</div>
                          <p className="text-sm font-bold text-green-700">Delivery Complete!</p>
                          <p className="text-xs text-green-600 mt-0.5">You earned ৳{order.earning + (order.boost?.extra ?? 0) + (proof ? Math.round(order.total * 0.02) : 0)} on this order.{proof ? <span className="ml-1 text-blue-600 font-semibold">(+৳{Math.round(order.total * 0.02)} photo bonus!)</span> : null}</p>
                          {order.customerRating && (
                            <div className="flex items-center justify-center gap-1 mt-2">
                              {[1,2,3,4,5].map(s => (
                                <span key={s} className={`text-base ${parseFloat(order.customerRating)>=s ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                              ))}
                              <span className="text-xs text-gray-500 ml-1">{order.customerRating} from customer</span>
                            </div>
                          )}
                          {proof && (
                            <div className="mt-2">
                              <img src={proof} alt="proof" className="w-full h-24 object-cover rounded-xl opacity-70" />
                              <p className="text-xs text-gray-400 mt-1">📸 Photo proof saved</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
