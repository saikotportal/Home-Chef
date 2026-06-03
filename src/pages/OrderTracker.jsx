import { useEffect, useState, useRef } from 'react'
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ordersData from '../data/orders.json'
import chefs from '../data/chefs.json'
import users from '../data/users.json'

// ── Timeline: total ~3 minutes (180s) ─────────────────────────
// confirmed(0s) → preparing(15s) → picked_up(60s) → on_the_way(90s) → delivered(180s)
const PHASE_DURATIONS = { confirmed: 15, preparing: 45, picked_up: 30, on_the_way: 90 }
const STATUS_SEQUENCE = ['confirmed', 'preparing', 'picked_up', 'on_the_way', 'delivered']
const TOTAL_SECONDS = 180

const STATUS_META = {
  confirmed:  { label: 'Order Confirmed',       sub: 'Chef is reviewing your order',             emoji: '✅' },
  preparing:  { label: 'Chef is Cooking',        sub: 'Your meal is being freshly prepared',       emoji: '🍳' },
  picked_up:  { label: 'Rider Picked Up',        sub: 'Rider has collected your order',            emoji: '🛵' },
  on_the_way: { label: 'On the Way!',            sub: 'Your rider is heading to you now',          emoji: '🚀' },
  delivered:  { label: 'Order Delivered!',       sub: 'Enjoy your homemade meal. Bon appétit!',   emoji: '🎉' },
  cancelled:  { label: 'Order Cancelled',        sub: 'Your order has been cancelled.',            emoji: '❌' },
}

function lerp(a, b, t) { return a + (b - a) * t }

// ── Circular countdown ring (Wolt-style) ──────────────────────
function CountdownRing({ secondsLeft, totalSeconds }) {
  const r = 54
  const circ = 2 * Math.PI * r
  const progress = Math.max(0, Math.min(1, secondsLeft / totalSeconds))
  const dashOffset = circ * (1 - progress)
  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60

  return (
    <div className="relative w-40 h-40 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#2a2a2a" strokeWidth="10" />
        <circle
          cx="60" cy="60" r={r}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00d2ff" />
            <stop offset="100%" stopColor="#3a7bd5" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white leading-none">
          {mins > 0 ? `${mins}:${String(secs).padStart(2, '0')}` : secs}
        </span>
        <span className="text-xs text-gray-400 mt-1">{mins > 0 ? 'min' : 'sec'}</span>
      </div>
    </div>
  )
}

// ── Mini map (Leaflet) ─────────────────────────────────────────
// Seeded random using order id hash so coords are stable per order but vary across orders
function seededRand(seed, min, max) {
  const x = Math.sin(seed) * 10000
  return min + (x - Math.floor(x)) * (max - min)
}

function TrackingMap({ chef, riderProgress, status, orderId }) {
  const mapRef = useRef(null)
  const mapObj = useRef(null)
  const riderMarker = useRef(null)
  const [ready, setReady] = useState(!!window.L)

  // Use a seed from orderId so each order gets unique but stable offsets
  const seed = orderId ? orderId.split('').reduce((a, c) => a + c.charCodeAt(0), 0) : 42

  const chefCoord = chef?.lat ? [chef.lat, chef.lng] : [23.7634, 90.389]

  // Random customer location: 0.8–2.5 km away in a natural direction
  const latOffset = seededRand(seed, 0.008, 0.024) * (seededRand(seed + 1, 0, 1) > 0.5 ? 1 : -1)
  const lngOffset = seededRand(seed + 2, 0.006, 0.020) * (seededRand(seed + 3, 0, 1) > 0.5 ? 1 : -1)
  const customerCoord = [chefCoord[0] + latOffset, chefCoord[1] + lngOffset]

  useEffect(() => {
    if (window.L) { setReady(true); return }
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'; link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }
    if (!document.getElementById('leaflet-js')) {
      const s = document.createElement('script')
      s.id = 'leaflet-js'; s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      s.onload = () => setReady(true)
      document.head.appendChild(s)
    }
  }, [])

  useEffect(() => {
    if (!ready || !mapRef.current || mapObj.current) return
    const L = window.L
    const center = [(chefCoord[0] + customerCoord[0]) / 2, (chefCoord[1] + customerCoord[1]) / 2]
    const map = L.map(mapRef.current, { center, zoom: 14, zoomControl: false, attributionControl: false })
    // Dark tile
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map)

    // Chef pin
    L.marker(chefCoord, { icon: L.divIcon({ className: '', html: `<div style="background:#FF6B35;width:32px;height:32px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:16px;">🍳</div>`, iconSize:[32,32], iconAnchor:[16,16] }) }).addTo(map)

    // Customer pin
    L.marker(customerCoord, { icon: L.divIcon({ className: '', html: `<div style="background:#3B82F6;width:32px;height:32px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:16px;">🏠</div>`, iconSize:[32,32], iconAnchor:[16,16] }) }).addTo(map)

    // Route line
    L.polyline([chefCoord, customerCoord], { color: '#3a7bd5', weight: 3, dashArray: '8 6', opacity: 0.8 }).addTo(map)

    // Rider pin
    const rm = L.marker(chefCoord, { icon: L.divIcon({ className: '', html: `<div style="background:white;width:38px;height:38px;border-radius:50%;border:3px solid #00d2ff;box-shadow:0 0 12px rgba(0,210,255,0.5);display:flex;align-items:center;justify-content:center;font-size:20px;">🛵</div>`, iconSize:[38,38], iconAnchor:[19,19] }), zIndexOffset: 1000 }).addTo(map)
    riderMarker.current = rm
    mapObj.current = map
  }, [ready])

  useEffect(() => {
    if (!riderMarker.current) return
    const t = Math.max(0, Math.min(1, riderProgress))
    const lat = lerp(chefCoord[0], customerCoord[0], t)
    const lng = lerp(chefCoord[1], customerCoord[1], t)
    riderMarker.current.setLatLng([lat, lng])
  }, [riderProgress])

  if (!ready) return <div className="h-56 bg-gray-900 rounded-t-2xl flex items-center justify-center"><span className="text-gray-500 text-sm">Loading map…</span></div>

  return (
    <div style={{ position: 'relative', zIndex: 0, isolation: 'isolate' }}>
      <div ref={mapRef} style={{ height: '240px', width: '100%' }} />
    </div>
  )
}

// ── Security Code Display ─────────────────────────────────────
function SecurityCode({ code }) {
  const [copied, setCopied] = useState(false)
  const copy = () => { navigator.clipboard?.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  return (
    <div className="flex items-center justify-between px-5 py-4 border-t border-white/10">
      <div>
        <p className="text-xs text-gray-400">Share this code with your rider to confirm delivery</p>
      </div>
      <button onClick={copy} className="flex items-center gap-2 bg-white text-gray-900 font-black text-2xl tracking-widest px-4 py-2 rounded-2xl shadow-lg active:scale-95 transition-transform">
        {code}
        {copied && <span className="text-xs font-normal text-green-600 ml-1">Copied!</span>}
      </button>
    </div>
  )
}

// ── Rate Meal Nudge ───────────────────────────────────────────
function RateMealNudge({ order, onClose, onRate }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="text-5xl mb-3">🎉</div>
        <h2 className="text-xl font-bold text-dark mb-1">Your order arrived!</h2>
        <p className="text-sm text-gray-400 mb-5">How was the food? Share your experience.</p>
        <div className="space-y-2 mb-5">
          {order.items.slice(0, 3).map((item, i) => (
            <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-2 text-sm text-left">
              <span>🍽️</span>
              <span className="font-medium text-dark">{item.name}</span>
              <span className="text-gray-400 text-xs ml-auto">×{item.quantity}</span>
            </div>
          ))}
        </div>
        <button onClick={onRate} className="btn-primary w-full py-3 text-base mb-3">⭐ Rate Your Meal</button>
        <button onClick={onClose} className="text-sm text-gray-400 hover:text-gray-600">Maybe later</button>
      </div>
    </div>
  )
}

// ── Report Issue ──────────────────────────────────────────────
const ISSUE_TYPES = [
  { id: 'wrong_item', label: 'Wrong item delivered', icon: '❌' },
  { id: 'missing', label: 'Missing item(s)', icon: '📦' },
  { id: 'cold_food', label: 'Food arrived cold', icon: '🧊' },
  { id: 'quality', label: 'Poor food quality', icon: '😞' },
  { id: 'late', label: 'Very late delivery', icon: '⏰' },
  { id: 'other', label: 'Other', icon: '💬' },
]
function ReportIssueModal({ order, onClose }) {
  const [step, setStep] = useState('type')
  const [issueType, setIssueType] = useState(null)
  const [details, setDetails] = useState('')
  const handleSubmit = () => {
    const r = { id: `rpt_${Date.now()}`, orderId: order.id, type: issueType, details: details.trim(), createdAt: new Date().toISOString() }
    const ex = JSON.parse(localStorage.getItem('hcm_reports') || '[]')
    localStorage.setItem('hcm_reports', JSON.stringify([...ex, r]))
    setStep('done')
  }
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
        {step === 'done' ? (
          <div className="text-center py-4">
            <div className="text-5xl mb-3">✅</div>
            <h2 className="text-lg font-bold text-dark mb-1">Report received</h2>
            <p className="text-sm text-gray-400 mb-5">Our team will review and reach out within 24h.</p>
            <button onClick={onClose} className="btn-primary w-full py-3">Close</button>
          </div>
        ) : step === 'type' ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-dark">Report an Issue</h2>
              <button onClick={onClose} className="text-gray-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="space-y-2">
              {ISSUE_TYPES.map((t) => (
                <button key={t.id} onClick={() => { setIssueType(t.id); setStep('details') }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 hover:border-brand hover:bg-orange-50 text-sm font-medium text-dark transition-all text-left">
                  <span className="text-lg">{t.icon}</span>{t.label}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => setStep('type')} className="text-gray-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
              <h2 className="font-bold text-dark">{ISSUE_TYPES.find(t => t.id === issueType)?.icon} {ISSUE_TYPES.find(t => t.id === issueType)?.label}</h2>
            </div>
            <textarea className="input resize-none h-28 text-sm mb-4" placeholder="Describe what happened…" value={details} onChange={e => setDetails(e.target.value)} />
            <button onClick={handleSubmit} className="btn-primary w-full py-3">Submit Report</button>
          </>
        )}
      </div>
    </div>
  )
}

// ── Rate Rider ────────────────────────────────────────────────
function RateRiderCard({ rider }) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [comment, setComment] = useState('')
  const handleSubmit = () => {
    if (!rating) return
    const ex = JSON.parse(localStorage.getItem('hcm_rider_ratings') || '[]')
    localStorage.setItem('hcm_rider_ratings', JSON.stringify([...ex, { riderId: rider?.id, rating, comment: comment.trim(), createdAt: new Date().toISOString() }]))
    setSubmitted(true)
  }
  if (submitted) return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5 text-center">
      <div className="text-4xl mb-2">🙏</div>
      <p className="font-bold text-dark">Thanks for rating!</p>
      <p className="text-sm text-gray-400 mt-1">Your feedback helps improve delivery quality.</p>
    </div>
  )
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
      <div className="flex items-center gap-3 mb-4">
        <img src={rider?.avatar || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80'} alt="rider" className="w-11 h-11 rounded-full object-cover bg-gray-100" />
        <div><p className="font-bold text-dark text-sm">Rate your rider{rider ? `, ${rider.name.split(' ')[0]}` : ''}</p><p className="text-xs text-gray-400">How was delivery?</p></div>
      </div>
      <div className="flex gap-2 justify-center mb-4">
        {[1,2,3,4,5].map(s => <button key={s} onClick={() => setRating(s)} onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)} className="text-3xl transition-transform hover:scale-110">{s <= (hover||rating) ? '⭐' : '☆'}</button>)}
      </div>
      {rating > 0 && <textarea className="input resize-none h-20 text-sm mb-3" placeholder="Optional comment…" value={comment} onChange={e => setComment(e.target.value)} />}
      <button onClick={handleSubmit} disabled={!rating} className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${rating ? 'bg-brand text-white hover:bg-orange-600' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}>{rating ? `Submit ${rating}★ Rating` : 'Tap a star to rate'}</button>
    </div>
  )
}

// ── Tip Rider ─────────────────────────────────────────────────
const TIP_PRESETS = [10, 20, 30, 50]
function TipRiderCard({ rider }) {
  const [selected, setSelected] = useState(null)
  const [customVal, setCustomVal] = useState('')
  const [step, setStep] = useState('choose')
  const inputRef = useRef(null)
  const tipAmount = selected === 'custom' ? (parseInt(customVal) || 0) : (selected ?? 0)
  if (step === 'thankyou') return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5 text-center">
      <div className="text-4xl mb-3">💚</div>
      <p className="font-bold text-dark">Thank you for tipping!</p>
      <p className="text-sm text-gray-400 mt-1">৳{tipAmount} sent to {rider?.name || 'your rider'}.</p>
    </div>
  )
  if (step === 'confirm') return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Confirm Tip</p>
      {rider && <div className="flex items-center gap-3 mb-5"><img src={rider.avatar || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80'} alt={rider.name} className="w-12 h-12 rounded-full object-cover" /><div><p className="font-semibold text-dark text-sm">{rider.name}</p><p className="text-xs text-gray-400">Delivery Rider</p></div><div className="ml-auto text-right"><p className="text-2xl font-bold text-brand">৳{tipAmount}</p><p className="text-xs text-gray-400">tip</p></div></div>}
      <div className="flex gap-3"><button onClick={() => setStep('thankyou')} className="flex-1 bg-brand hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-colors">Send ৳{tipAmount} 💚</button><button onClick={() => setStep('choose')} className="px-5 py-3 rounded-xl border border-gray-200 text-gray-500 text-sm">Edit</button></div>
    </div>
  )
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
      <div className="flex items-center gap-3 mb-4"><div className="w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center text-lg">🛵</div><div><p className="font-bold text-dark text-sm">Tip your rider</p><p className="text-xs text-gray-400">100% goes to {rider?.name || 'your rider'}</p></div></div>
      <div className="grid grid-cols-4 gap-2 mb-3">
        {TIP_PRESETS.map(amt => <button key={amt} onClick={() => { setSelected(amt); setCustomVal('') }} className={`py-2.5 rounded-xl border text-sm font-semibold transition-all ${selected === amt ? 'bg-brand text-white border-brand scale-105' : 'border-gray-200 text-gray-600 hover:border-brand'}`}>৳{amt}</button>)}
      </div>
      <button onClick={() => { setSelected('custom'); setTimeout(() => inputRef.current?.focus(), 50) }} className={`w-full mb-4 flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-all ${selected === 'custom' ? 'border-brand bg-orange-50' : 'border-gray-200'}`}>
        <span className="text-gray-400">৳</span>
        {selected === 'custom' ? <input ref={inputRef} type="number" min="1" placeholder="Custom amount" value={customVal} onChange={e => setCustomVal(e.target.value)} onClick={e => e.stopPropagation()} className="flex-1 bg-transparent outline-none text-dark font-semibold text-sm" /> : <span className="text-gray-400">Custom amount</span>}
      </button>
      <div className="flex gap-3">
        <button onClick={() => { setSelected(null); setCustomVal('') }} className="px-4 py-3 rounded-xl border border-gray-200 text-gray-400 text-xs">No thanks</button>
        <button onClick={() => { if (tipAmount > 0) setStep('confirm') }} disabled={tipAmount <= 0} className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${tipAmount > 0 ? 'bg-brand text-white' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}>{tipAmount > 0 ? `Tip ৳${tipAmount}` : 'Select amount'}</button>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────
export default function OrderTracker() {
  const { id } = useParams()
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [order, setOrder] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS)
  const [showNudge, setShowNudge] = useState(false)
  const [nudgeDismissed, setNudgeDismissed] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [cancelState, setCancelState] = useState('idle')
  const [cancelTimeLeft, setCancelTimeLeft] = useState(null)

  // Load order
  useEffect(() => {
    const local = JSON.parse(localStorage.getItem('hcm_orders') || '[]')
    const found = [...local, ...ordersData].find(o => o.id === id)
    if (found) {
      // Generate security code if missing
      if (!found.securityCode) {
        const code = String(Math.floor(100 + Math.random() * 900))
        const updated = local.map(o => o.id === id ? { ...o, securityCode: code } : o)
        localStorage.setItem('hcm_orders', JSON.stringify(updated))
        found.securityCode = code
      }
      setOrder(found)
    } else {
      setNotFound(true)
    }
  }, [id])

  // 3-minute countdown driving status transitions
  useEffect(() => {
    if (!order || order.status === 'delivered' || order.status === 'cancelled') return

    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        const next = prev - 1
        if (next <= 0) {
          clearInterval(interval)
          // Force delivered
          setOrder(p => ({ ...p, status: 'delivered' }))
          const stored = JSON.parse(localStorage.getItem('hcm_orders') || '[]')
          localStorage.setItem('hcm_orders', JSON.stringify(stored.map(o => o.id === id ? { ...o, status: 'delivered', deliveredAt: new Date().toISOString() } : o)))
          return 0
        }

        // Transition status based on time elapsed
        const elapsed = TOTAL_SECONDS - next
        let targetStatus = 'confirmed'
        let acc = 0
        for (const s of STATUS_SEQUENCE.slice(0, -1)) {
          acc += PHASE_DURATIONS[s]
          if (elapsed < acc) { targetStatus = s; break }
          targetStatus = STATUS_SEQUENCE[STATUS_SEQUENCE.indexOf(s) + 1]
        }

        setOrder(p => {
          if (!p || p.status === targetStatus || p.status === 'delivered') return p
          const stored = JSON.parse(localStorage.getItem('hcm_orders') || '[]')
          localStorage.setItem('hcm_orders', JSON.stringify(stored.map(o => o.id === id ? { ...o, status: targetStatus } : o)))
          return { ...p, status: targetStatus }
        })

        return next
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [order?.id, order?.status === 'delivered', order?.status === 'cancelled'])

  // Show nudge on delivery
  useEffect(() => {
    if (order?.status === 'delivered' && !nudgeDismissed) {
      const t = setTimeout(() => setShowNudge(true), 800)
      return () => clearTimeout(t)
    }
  }, [order?.status, nudgeDismissed])

  // Cancel window
  useEffect(() => {
    if (!order || order.status !== 'confirmed') return
    const placedAt = new Date(order.placedAt).getTime()
    const tick = () => setCancelTimeLeft(Math.max(0, Math.ceil((placedAt + 60000 - Date.now()) / 1000)))
    tick()
    const iv = setInterval(tick, 1000)
    return () => clearInterval(iv)
  }, [order?.id, order?.status])

  const handleCancel = () => {
    if (cancelState === 'idle') { setCancelState('confirming'); return }
    const stored = JSON.parse(localStorage.getItem('hcm_orders') || '[]')
    localStorage.setItem('hcm_orders', JSON.stringify(stored.map(o => o.id === id ? { ...o, status: 'cancelled' } : o)))
    setOrder(p => ({ ...p, status: 'cancelled' }))
    setCancelState('cancelled')
  }

  if (!currentUser) return <Navigate to="/login" replace />
  if (notFound) return (
    <div className="page-wrapper flex items-center justify-center py-32">
      <div className="text-center"><div className="text-5xl mb-4">📦</div><h2 className="section-title">Order not found</h2><Link to="/" className="btn-primary mt-6 inline-block">Back to Home</Link></div>
    </div>
  )
  if (!order) return (
    <div className="page-wrapper flex items-center justify-center py-32">
      <svg className="w-8 h-8 animate-spin text-brand" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
    </div>
  )

  const chef = chefs.find(c => c.id === order.chefId)
  const rider = users.find(u => u.id === order.riderId)
  const statusIdx = STATUS_SEQUENCE.indexOf(order.status)
  const isDelivered = order.status === 'delivered'
  const isCancelled = order.status === 'cancelled'
  const meta = STATUS_META[order.status] || STATUS_META.confirmed
  const canCancel = order.status === 'confirmed' && cancelTimeLeft > 0

  // Rider progress 0→1 based on on_the_way phase
  const elapsed = TOTAL_SECONDS - secondsLeft
  const riderStartAt = PHASE_DURATIONS.confirmed + PHASE_DURATIONS.preparing + PHASE_DURATIONS.picked_up
  const riderProgress = isDelivered ? 1 : Math.max(0, Math.min(1, (elapsed - riderStartAt) / PHASE_DURATIONS.on_the_way))

  const steps = [
    { key: 'confirmed', label: 'Confirmed', icon: '✅' },
    { key: 'preparing', label: 'Preparing', icon: '🍳' },
    { key: 'picked_up', label: 'Picked Up', icon: '🛵' },
    { key: 'on_the_way', label: 'On the Way', icon: '🚀' },
    { key: 'delivered', label: 'Delivered', icon: '🎉' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {showNudge && <RateMealNudge order={order} onClose={() => { setShowNudge(false); setNudgeDismissed(true) }} onRate={() => { setShowNudge(false); setNudgeDismissed(true); navigate('/reviews') }} />}
      {showReport && <ReportIssueModal order={order} onClose={() => setShowReport(false)} />}

      {/* ── Dark top card: map + timer + status ── */}
      {!isCancelled && (
        <div className="bg-gray-900 rounded-b-3xl overflow-hidden shadow-2xl">
          {/* Map — isolated so Leaflet z-indexes can't escape into modal layer */}
          <div className="relative" style={{ isolation: 'isolate', zIndex: 0 }}>
            <TrackingMap chef={chef} riderProgress={riderProgress} status={order.status} orderId={order.id} />
            {/* Live pill */}
            {!isDelivered && (
              <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold text-green-400">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />LIVE
              </div>
            )}
            {/* Collapse handle */}
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-900 to-transparent" />
          </div>

          {/* Timer + status */}
          <div className="px-5 pt-4 pb-2 text-center">
            {isDelivered ? (
              <div className="py-4">
                <div className="text-5xl mb-2">🎉</div>
                <p className="text-white font-bold text-xl">Order Delivered!</p>
                <p className="text-gray-400 text-sm mt-1">Enjoy your homemade meal. Bon appétit!</p>
              </div>
            ) : (
              <>
                <CountdownRing secondsLeft={secondsLeft} totalSeconds={TOTAL_SECONDS} />
                <p className="text-white font-bold text-lg mt-3">{meta.label}</p>
                <p className="text-gray-400 text-sm mt-1 mb-3">{meta.sub}</p>
              </>
            )}
          </div>

          {/* Step pills */}
          {!isDelivered && (
            <div className="flex justify-between px-4 pb-4 gap-1">
              {steps.map((s, i) => {
                const done = statusIdx > i
                const active = statusIdx === i
                return (
                  <div key={s.key} className="flex-1 flex flex-col items-center gap-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all ${done ? 'bg-green-500 text-white' : active ? 'bg-blue-500 text-white ring-2 ring-blue-300' : 'bg-white/10 text-gray-500'}`}>
                      {done ? '✓' : s.icon}
                    </div>
                    <span className={`text-xs ${active ? 'text-blue-400 font-semibold' : done ? 'text-green-400' : 'text-gray-600'}`}>{s.label}</span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Security code */}
          {!isCancelled && order.securityCode && (
            <SecurityCode code={order.securityCode} />
          )}
        </div>
      )}

      {/* ── Cancelled state ── */}
      {isCancelled && (
        <div className="bg-gray-900 rounded-b-3xl p-10 text-center shadow-2xl">
          <div className="text-5xl mb-3">❌</div>
          <h1 className="text-white font-bold text-xl">Order Cancelled</h1>
          <p className="text-gray-400 text-sm mt-1">Your order has been cancelled.</p>
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* First order bonus */}
        {order.firstOrderBonus && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl px-5 py-4 flex items-center gap-4">
            <span className="text-3xl">🎟️</span>
            <div><p className="text-sm font-bold text-yellow-800">First order bonus! +2 stamps</p><p className="text-xs text-yellow-700 mt-0.5">Extra stamp for ordering from this chef for the first time.</p></div>
          </div>
        )}

        {/* Cancel banner */}
        {canCancel && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl px-5 py-4 flex items-center gap-4">
            <div className="flex-1"><p className="text-sm font-semibold text-dark">Changed your mind?</p><p className="text-xs text-gray-500 mt-0.5">Cancel within 1 minute. <span className="font-bold text-yellow-700">{cancelTimeLeft}s left</span></p></div>
            {cancelState === 'confirming' ? (
              <div className="flex gap-2">
                <button onClick={handleCancel} className="px-3 py-1.5 rounded-xl bg-red-500 text-white text-xs font-bold">Confirm</button>
                <button onClick={() => setCancelState('idle')} className="px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 text-xs">Keep</button>
              </div>
            ) : (
              <button onClick={handleCancel} className="px-4 py-2 rounded-xl border border-red-200 text-red-500 text-xs font-semibold hover:bg-red-50">Cancel</button>
            )}
          </div>
        )}

        {/* Rider card */}
        {!isCancelled && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Your Rider</p>
            {rider && statusIdx >= 2 ? (
              <div className="flex items-center gap-3">
                <img src={rider.avatar || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80'} alt={rider.name} className="w-12 h-12 rounded-full object-cover bg-gray-100" />
                <div className="flex-1">
                  <p className="font-semibold text-dark text-sm">{rider.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {rider.rating && (
                      <span className="text-xs text-amber-500 font-medium">⭐ {rider.rating}</span>
                    )}
                    {rider.totalDeliveries && (
                      <span className="text-xs text-gray-400">{rider.totalDeliveries} deliveries</span>
                    )}
                  </div>
                  <p className={`text-xs mt-0.5 ${isDelivered ? 'text-green-500' : 'text-blue-500'}`}>{isDelivered ? '✓ Delivered' : '🛵 En route'}</p>
                </div>
                {order.status === 'on_the_way' && !isDelivered && (
                  <a href={`tel:${rider.phone || '+8801700000000'}`} className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 hover:bg-green-100 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  </a>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-xl">🛵</div>
                <div><p className="font-semibold text-dark text-sm">Assigning rider…</p><p className="text-xs text-gray-400">Will be assigned after chef confirms</p></div>
              </div>
            )}
          </div>
        )}

        {/* Post-delivery cards */}
        {isDelivered && <TipRiderCard rider={rider} />}
        {isDelivered && <RateRiderCard rider={rider} />}
        {isDelivered && (
          <button onClick={() => setShowReport(true)} className="w-full flex items-center gap-3 px-5 py-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-red-200 hover:bg-red-50 transition-all text-left">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1"><p className="text-sm font-semibold text-dark">Report an Issue</p><p className="text-xs text-gray-400">Wrong item, missing food, or other problem?</p></div>
            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        )}

        {/* Order Summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Order Summary</p>
            <span className="badge bg-gray-100 text-gray-500 text-xs font-mono">#{order.id}</span>
          </div>
          <div className="space-y-3">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm gap-2">
                <div><span className="text-gray-600">{item.name} <span className="text-gray-400">x{item.quantity}</span></span>{item.selectedAddons?.length > 0 && <p className="text-xs text-brand mt-0.5">+{item.selectedAddons.map(a => a.name).join(', ')}</p>}</div>
                <span className="font-medium text-dark flex-shrink-0">৳{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 mt-4 pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-gray-400"><span>Delivery fee</span><span>৳{order.deliveryFee ?? 40}</span></div>
            <div className="flex justify-between font-bold text-dark"><span>Total Paid</span><span className="text-brand">৳{order.total}</span></div>
          </div>
          {order.address && <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2 text-sm"><span className="text-gray-400">📍</span><span className="text-gray-600">{order.address}</span></div>}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pb-6">
          {isCancelled ? (
            <><Link to="/listings" className="btn-primary flex-1 text-center py-3">Browse Meals 🍽️</Link><Link to="/" className="btn-outline flex-1 text-center py-3">Back to Home</Link></>
          ) : isDelivered ? (
            <><Link to="/reviews" className="btn-primary flex-1 text-center py-3">⭐ Rate Your Meal</Link><Link to="/listings" className="btn-outline flex-1 text-center py-3">Order Again</Link></>
          ) : (
            <Link to="/" className="btn-outline w-full text-center py-3">Back to Home</Link>
          )}
        </div>
      </div>
    </div>
  )
}
