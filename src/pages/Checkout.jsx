import { useState, useMemo, useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import Toast from '../components/Toast'
import PromoInput, { PROMO_CODES } from '../components/PromoInput'
import chefs from '../data/chefs.json'
import users from '../data/users.json'

const RIDER_IDS = users.filter(u => u.role === 'rider').map(u => u.id)
function pickRandomRider() {
  return RIDER_IDS[Math.floor(Math.random() * RIDER_IDS.length)]
}

// ── Constants ──────────────────────────────────────────────────
const FREE_DELIVERY_THRESHOLD = 500
const BAG_FEE     = 10
const SERVICE_FEE = 15
const VAT_RATE    = 0.05

// ── Fee helpers ────────────────────────────────────────────────
function getDeliveryFee(cartItems, selectedArea, isFreeDelivery) {
  if (isFreeDelivery) return 0
  if (!cartItems.length) return 0
  if (!selectedArea) return 40
  const chef = chefs.find((c) => c.id === cartItems[0]?.chefId)
  const dist = Math.abs((chef?.zone ?? 1) - (selectedArea.zone ?? 1))
  if (dist === 0) return 30
  if (dist === 1) return 50
  return 80
}

function getDistanceLabel(cartItems, selectedArea) {
  if (!selectedArea) return null
  const chef = chefs.find((c) => c.id === cartItems[0]?.chefId)
  const dist = Math.abs((chef?.zone ?? 1) - (selectedArea.zone ?? 1))
  if (dist === 0) return 'Same area'
  if (dist === 1) return '1 zone away'
  return '2+ zones away'
}

const PAYMENT_METHODS = [
  { id: 'wallet', label: 'HomeChef Wallet',   icon: '💰', desc: 'Pay from your wallet balance' },
  { id: 'cod',    label: 'Cash on Delivery',  icon: '💵', desc: 'Pay when your order arrives' },
  { id: 'bkash',  label: 'bKash',             icon: '📱', desc: 'Mobile banking · bKash' },
  { id: 'nagad',  label: 'Nagad',             icon: '📲', desc: 'Mobile banking · Nagad' },
  { id: 'card',   label: 'Card',              icon: '💳', desc: 'Debit / Credit card' },
]

function FeeRow({ label, value, sub, highlight, strike, green, bold }) {
  return (
    <div className={`flex justify-between items-center text-sm ${bold ? 'font-bold text-dark' : 'text-gray-500'}`}>
      <span>
        {label}
        {sub && <span className="ml-1 text-xs text-gray-400">({sub})</span>}
      </span>
      <span className={`${green ? 'text-green-600 font-semibold' : ''} ${strike ? 'line-through text-gray-300' : ''} ${highlight ? 'text-brand font-bold text-base' : ''}`}>
        {value}
      </span>
    </div>
  )
}

// ── Schedule helpers ───────────────────────────────────────────
function getScheduleDays() {
  const days = []
  const today = new Date()
  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    days.push({
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : DAY_NAMES[d.getDay()],
      date: `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`,
      value: d.toISOString().split('T')[0],
      dateObj: d,
    })
  }
  return days
}

function getTimeSlots(selectedDateStr) {
  const slots = []
  const now = new Date()
  const selectedDate = new Date(selectedDateStr)
  const isToday = selectedDate.toDateString() === now.toDateString()
  const startHour = isToday ? now.getHours() + 2 : 10
  const endHour = 22
  for (let h = Math.max(startHour, 10); h < endHour; h++) {
    for (const m of [0, 30]) {
      if (isToday) {
        const slotTime = new Date()
        slotTime.setHours(h, m, 0, 0)
        if (slotTime <= new Date(now.getTime() + 60 * 60 * 1000)) continue
      }
      const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h
      const ampm = h >= 12 ? 'PM' : 'AM'
      const minStr = m === 0 ? '00' : '30'
      slots.push({ label: `${hour12}:${minStr} ${ampm}`, value: `${String(h).padStart(2, '0')}:${minStr}` })
    }
  }
  return slots
}

export default function Checkout() {
  const { cartItems, cartTotal, clearCart, toast } = useCart()
  const { currentUser, selectedArea, wallet, updateWallet, addStamp } = useAuth()
  const navigate = useNavigate()

  const [payStep, setPayStep] = useState(false)
  const [placing, setPlacing] = useState(false)

  // Delivery form
  const [form, setForm] = useState({ name: currentUser?.name || '', phone: '', address: '', note: '' })
  const [deliveryInstruction, setDeliveryInstruction] = useState('')
  const [errors, setErrors] = useState({})

  // Schedule state
  const [deliveryMode, setDeliveryMode] = useState('now')
  const scheduleDays = useMemo(() => getScheduleDays(), [])
  const [schedDay, setSchedDay] = useState(scheduleDays[0].value)
  const timeSlots = useMemo(() => getTimeSlots(schedDay), [schedDay])
  const [schedTime, setSchedTime] = useState('')

  const handleSchedDay = (val) => {
    setSchedDay(val)
    const slots = getTimeSlots(val)
    setSchedTime(slots[0]?.value || '')
  }

  const defaultTime = timeSlots[0]?.value || ''
  const activeSchedTime = schedTime || defaultTime

  // Promo
  const [appliedPromo, setAppliedPromo] = useState(null)
  const [promoSuccess, setPromoSuccess] = useState('')

  // Payment — pre-select saved method
  const [payMethod, setPayMethod] = useState(() => {
    return localStorage.getItem('hcm_last_payment') || 'cod'
  })
  const [mobileNum, setMobileNum] = useState('')
  const [cardNum, setCardNum]     = useState('')
  const [expiry, setExpiry]       = useState('')
  const [cvv, setCvv]             = useState('')

  // Wallet apply toggle
  const [useWallet, setUseWallet] = useState(false)

  if (!currentUser) return <Navigate to="/login" replace />
  if (cartItems.length === 0) return <Navigate to="/cart" replace />

  // minOrder guard
  const cartChef = chefs.find((c) => c.id === cartItems[0]?.chefId)
  const minOrder = cartChef?.minOrder ?? 0

  // ── Fee calculations ─────────────────────────────────────────
  const subtotalFreeDelivery = cartTotal >= FREE_DELIVERY_THRESHOLD

  let promoDiscount = 0
  let promoBkashFreeDelivery = false
  if (appliedPromo) {
    const p = PROMO_CODES[appliedPromo]
    if (p.type === 'percent')  promoDiscount = Math.round(cartTotal * p.value / 100)
    if (p.type === 'flat')     promoDiscount = p.value
    if (p.type === 'delivery') promoBkashFreeDelivery = true
  }

  const freeDelivery = subtotalFreeDelivery || promoBkashFreeDelivery
  const deliveryFeeBase = getDeliveryFee(cartItems, selectedArea, false)
  const deliveryFee     = freeDelivery ? 0 : deliveryFeeBase
  const distanceLabel   = getDistanceLabel(cartItems, selectedArea)
  const vatBase = cartTotal - promoDiscount
  const vat     = Math.round(vatBase * VAT_RATE)
  const totalBeforeWallet = cartTotal + BAG_FEE + deliveryFee + SERVICE_FEE + vat - promoDiscount

  // Wallet deduction
  const walletDeduction = useWallet ? Math.min(wallet, totalBeforeWallet) : 0
  const grandTotal = Math.max(0, totalBeforeWallet - walletDeduction)

  const chefIds = [...new Set(cartItems.map((i) => i.chefId))]

  // ── Validation ────────────────────────────────────────────────
  const validate = () => {
    const e = {}
    if (!form.name.trim())    e.name    = 'Name is required'
    if (!form.phone.trim())   e.phone   = 'Phone is required'
    else if (!/^[0-9+\-\s]{7,15}$/.test(form.phone.trim())) e.phone = 'Enter a valid phone number'
    if (!form.address.trim()) e.address = 'Delivery address is required'
    if (deliveryMode === 'later' && !activeSchedTime) e.time = 'Please select a delivery time'
    if (cartTotal < minOrder) e.minOrder = `Minimum order for ${cartChef?.name} is ৳${minOrder}`
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const scheduledLabel = deliveryMode === 'later' ? (() => {
    const day = scheduleDays.find((d) => d.value === schedDay)
    const slot = timeSlots.find((s) => s.value === activeSchedTime) || { label: activeSchedTime }
    return `${day?.label}, ${day?.date} at ${slot.label}`
  })() : null

  const handlePlaceOrder = () => {
    if (!validate()) return
    setPlacing(true)
    try {
      // Save payment method preference
      localStorage.setItem('hcm_last_payment', payMethod)

      const existing = JSON.parse(localStorage.getItem('hcm_orders') || '[]')

      // Check first-order bonus BEFORE creating the order
      const orderedThisChefBefore = existing.some(
        (o) => o.customerId === currentUser.id && o.chefId === chefIds[0]
      )

      // Deduct wallet if used
      if (walletDeduction > 0) updateWallet(-walletDeduction)

      const securityCode = String(Math.floor(100 + Math.random() * 900))
      const newOrder = {
        id: 'o' + Date.now(),
        securityCode,
        customerId: currentUser.id,
        chefId: chefIds[0],
        riderId: pickRandomRider(),
        items: cartItems.map((i) => ({
          mealId: i.id,
          name: i.name,
          price: i.effectivePrice ?? i.price,
          quantity: i.quantity,
          selectedAddons: i.selectedAddons || [],
        })),
        subtotal: cartTotal,
        bagFee: BAG_FEE,
        deliveryFee,
        serviceFee: SERVICE_FEE,
        vat,
        promoCode: appliedPromo,
        promoDiscount,
        walletUsed: walletDeduction,
        total: grandTotal,
        paymentMethod: payMethod,
        address: form.address,
        firstOrderBonus: !orderedThisChefBefore,
        note: form.note.trim() || null,
        status: 'confirmed',
        placedAt: new Date().toISOString(),
        scheduledFor: deliveryMode === 'later' ? `${schedDay}T${activeSchedTime}:00` : null,
        deliveredAt: null,
      }

      localStorage.setItem('hcm_orders', JSON.stringify([...existing, newOrder]))

      // Loyalty stamp for this order
      addStamp(currentUser.id)

      // Bonus stamp if first order from this chef
      if (!orderedThisChefBefore) {
        addStamp(currentUser.id)
      }

      clearCart()
      setTimeout(() => navigate(`/order-tracker/${newOrder.id}`), 800)
    } catch (err) {
      console.error('Order placement failed:', err)
      setPlacing(false)
      alert('Something went wrong placing your order. Please try again.')
    }
  }

  const handleChange = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }))
    if (errors[field]) setErrors((p) => ({ ...p, [field]: '' }))
  }

  const toFreeDelivery = FREE_DELIVERY_THRESHOLD - cartTotal

  return (
    <div className="page-wrapper">
      <Toast message={toast?.message} type={toast?.type} />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="section-title">Checkout</h1>
          <p className="text-gray-400 text-sm mt-1">Almost there — just a few more details</p>
        </div>

        {/* Free delivery banner */}
        {!freeDelivery && toFreeDelivery > 0 && (
          <div className="mb-4 bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3 flex items-center gap-3">
            <span className="text-lg">🚀</span>
            <p className="text-sm font-semibold text-dark">
              Add ৳{toFreeDelivery} more for <span className="text-brand">free delivery!</span>
            </p>
          </div>
        )}
        {freeDelivery && (
          <div className="mb-4 bg-green-50 border border-green-100 rounded-2xl px-4 py-3 flex items-center gap-2">
            <span className="text-lg">🎉</span>
            <p className="text-sm font-semibold text-green-700">Free delivery unlocked on this order!</p>
          </div>
        )}

        {/* minOrder warning */}
        {cartTotal < minOrder && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-2xl px-4 py-3 flex items-center gap-3">
            <span className="text-lg">⚠️</span>
            <p className="text-sm text-yellow-800">
              <span className="font-semibold">{cartChef?.name}</span> requires a minimum order of{' '}
              <span className="font-bold">৳{minOrder}</span>. Go back and add more items.
            </p>
          </div>
        )}

        {/* Progress */}
        <div className="flex items-center gap-3 mb-8">
          {['Delivery Details', 'Payment'].map((step, i) => (
            <div key={step} className="flex items-center gap-3">
              <div className={`flex items-center gap-2 text-sm font-medium ${
                i === 0 && !payStep ? 'text-brand' :
                i === 1 && payStep  ? 'text-brand' :
                i === 0 && payStep  ? 'text-green-500' : 'text-gray-300'
              }`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  i === 0 && payStep ? 'bg-green-500 text-white' :
                  (i === 0 && !payStep) || (i === 1 && payStep) ? 'bg-brand text-white' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {i === 0 && payStep ? '✓' : i + 1}
                </span>
                {step}
              </div>
              {i === 0 && <div className={`h-px w-12 ${payStep ? 'bg-green-400' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── LEFT — Form ─────────────────────────────────────── */}
          <div className="flex-1 space-y-4">
            {!payStep ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                <h2 className="font-bold text-dark">Delivery Details</h2>

                <div>
                  <label className="block text-sm font-medium text-dark mb-1.5">Full Name</label>
                  <input className={`input ${errors.name ? 'border-red-300' : ''}`} placeholder="Your full name" value={form.name} onChange={handleChange('name')} />
                  {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark mb-1.5">Phone Number</label>
                  <input className={`input ${errors.phone ? 'border-red-300' : ''}`} placeholder="+880 17xx xxxxxx" value={form.phone} onChange={handleChange('phone')} />
                  {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark mb-1.5">Delivery Address</label>
                  <textarea className={`input resize-none h-24 ${errors.address ? 'border-red-300' : ''}`} placeholder="House no, Road no, Area, City…" value={form.address} onChange={handleChange('address')} />
                  {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address}</p>}
                </div>
                {/* Delivery Instructions — exclusive preset toggle */}
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">Delivery Instructions</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {[
                      { label: 'Leave at door', icon: '🚪' },
                      { label: 'Call on arrival', icon: '📞' },
                      { label: 'Ring doorbell', icon: '🔔' },
                    ].map((opt) => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => setDeliveryInstruction((prev) => prev === opt.label ? '' : opt.label)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                          deliveryInstruction === opt.label
                            ? 'bg-brand text-white border-brand shadow-sm'
                            : 'border-gray-200 text-gray-600 hover:border-brand hover:text-brand bg-gray-50'
                        }`}
                      >
                        <span>{opt.icon}</span>{opt.label}
                      </button>
                    ))}
                  </div>
                  <input
                    className="input text-sm"
                    placeholder="Free-text note — e.g. 'Leave with the guard', 'No bell after 10pm'…"
                    value={form.note}
                    onChange={handleChange('note')}
                  />
                </div>

                {/* Delivery Time */}
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">Delivery Time</label>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {[
                      { value: 'now', icon: '⚡', label: 'Deliver Now', sub: '30–45 min' },
                      { value: 'later', icon: '⏰', label: 'Schedule', sub: 'Pick a time' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setDeliveryMode(opt.value)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                          deliveryMode === opt.value
                            ? 'border-brand bg-orange-50'
                            : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-xl">{opt.icon}</span>
                        <div>
                          <p className={`text-sm font-semibold ${deliveryMode === opt.value ? 'text-brand' : 'text-dark'}`}>{opt.label}</p>
                          <p className="text-xs text-gray-400">{opt.sub}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {deliveryMode === 'later' && (
                    <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-dark mb-2">Select Day</p>
                        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                          {scheduleDays.map((day) => (
                            <button
                              key={day.value}
                              onClick={() => handleSchedDay(day.value)}
                              className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl border transition-all min-w-[60px] ${
                                schedDay === day.value
                                  ? 'bg-brand text-white border-brand'
                                  : 'bg-white text-dark border-gray-200 hover:border-brand'
                              }`}
                            >
                              <span className="text-xs font-bold">{day.label}</span>
                              <span className={`text-xs mt-0.5 ${schedDay === day.value ? 'text-white/80' : 'text-gray-400'}`}>{day.date}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-dark mb-2">Select Time</p>
                        {timeSlots.length === 0 ? (
                          <p className="text-xs text-gray-400 italic">No slots available for today. Try tomorrow.</p>
                        ) : (
                          <div className="grid grid-cols-4 gap-2">
                            {timeSlots.map((slot) => (
                              <button
                                key={slot.value}
                                onClick={() => setSchedTime(slot.value)}
                                className={`py-2 rounded-xl border text-xs font-semibold transition-all ${
                                  activeSchedTime === slot.value
                                    ? 'bg-brand text-white border-brand'
                                    : 'bg-white text-dark border-gray-200 hover:border-brand'
                                }`}
                              >
                                {slot.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {errors.time && <p className="text-red-400 text-xs">{errors.time}</p>}
                    </div>
                  )}
                </div>

                <button onClick={() => { if (validate()) setPayStep(true) }} className="btn-primary w-full py-3">
                  Continue to Payment →
                </button>
              </div>
            ) : (
              <>
                {/* Delivery summary */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-bold text-dark text-sm">Delivery Details</h2>
                    <button onClick={() => setPayStep(false)} className="text-xs text-brand font-semibold hover:underline">Edit</button>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1.5">
                    {[
                      ['Deliver to', form.name],
                      ['Phone', form.phone],
                      ['Address', form.address],
                      deliveryInstruction ? ['Delivery', deliveryInstruction] : null,
                      form.note ? ['Note', form.note] : null,
                      scheduledLabel ? ['Scheduled', scheduledLabel] : ['Delivery', 'As soon as possible (30–45 min)'],
                    ].filter(Boolean).map(([k, v]) => (
                      <div key={k} className="flex gap-2">
                        <span className="text-gray-400 w-20 flex-shrink-0 text-xs">{k}</span>
                        <span className={`text-xs ${k === 'Scheduled' ? 'text-brand font-semibold' : 'text-dark'}`}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Wallet apply toggle */}
                {wallet > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">💰</span>
                        <div>
                          <p className="text-sm font-bold text-dark">HomeChef Wallet</p>
                          <p className="text-xs text-gray-400">Balance: <span className="font-semibold text-green-600">৳{wallet}</span></p>
                        </div>
                      </div>
                      <button
                        onClick={() => setUseWallet((v) => !v)}
                        className={`relative w-11 h-6 rounded-full transition-colors ${useWallet ? 'bg-brand' : 'bg-gray-200'}`}
                      >
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${useWallet ? 'left-6' : 'left-1'}`} />
                      </button>
                    </div>
                    {useWallet && (
                      <div className="mt-3 bg-green-50 border border-green-100 rounded-xl px-3 py-2 text-xs text-green-700 font-medium">
                        ৳{walletDeduction} will be deducted from your wallet
                        {walletDeduction < totalBeforeWallet && ` · remaining ৳${grandTotal} via ${PAYMENT_METHODS.find(p=>p.id===payMethod)?.label || payMethod}`}
                      </div>
                    )}
                  </div>
                )}

                {/* Promo Code */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                  <h2 className="font-bold text-dark text-sm">Promo Code</h2>
                  <PromoInput
                    appliedPromo={appliedPromo}
                    onApply={(code) => { setAppliedPromo(code); setPromoSuccess(`✓ ${PROMO_CODES[code].label} applied!`) }}
                    onRemove={() => { setAppliedPromo(null); setPromoSuccess('') }}
                  />
                </div>

                {/* Payment Method */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold text-dark text-sm">Payment Method</h2>
                    {localStorage.getItem('hcm_last_payment') && (
                      <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">Last used pre-selected</span>
                    )}
                  </div>

                  <div className="space-y-2">
                    {PAYMENT_METHODS.map((pm) => {
                      // Skip wallet as standalone if no balance
                      if (pm.id === 'wallet' && wallet === 0) return null
                      // If wallet is toggled on and covers everything, still show other methods (for partial payment labeling)
                      return (
                        <div key={pm.id}>
                          <button
                            onClick={() => setPayMethod(pm.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                              payMethod === pm.id
                                ? 'border-brand bg-orange-50'
                                : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                            }`}
                          >
                            <span className="text-xl flex-shrink-0">{pm.icon}</span>
                            <div className="flex-1 text-left">
                              <p className={`text-sm font-semibold ${payMethod === pm.id ? 'text-brand' : 'text-dark'}`}>{pm.label}</p>
                              <p className="text-xs text-gray-400">
                                {pm.id === 'wallet' ? `Balance: ৳${wallet}` : pm.desc}
                              </p>
                            </div>
                            <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                              payMethod === pm.id ? 'border-brand bg-brand' : 'border-gray-300'
                            }`}>
                              {payMethod === pm.id && (
                                <div className="w-full h-full rounded-full flex items-center justify-center">
                                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                </div>
                              )}
                            </div>
                          </button>

                          {payMethod === pm.id && (pm.id === 'bkash' || pm.id === 'nagad') && (
                            <div className="mt-2 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                              <label className="block text-xs font-medium text-dark">{pm.label} Number</label>
                              <input className="input text-sm" placeholder="01XXXXXXXXX" value={mobileNum} onChange={(e) => setMobileNum(e.target.value)} maxLength={11} />
                              <p className="text-xs text-gray-400">You'll get a payment request on this number</p>
                            </div>
                          )}

                          {payMethod === pm.id && pm.id === 'card' && (
                            <div className="mt-2 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                              <div>
                                <label className="block text-xs font-medium text-dark mb-1">Card Number</label>
                                <input className="input font-mono text-sm" placeholder="4242 4242 4242 4242" value={cardNum} onChange={(e) => setCardNum(e.target.value)} maxLength={19} />
                              </div>
                              <div className="flex gap-3">
                                <div className="flex-1">
                                  <label className="block text-xs font-medium text-dark mb-1">Expiry</label>
                                  <input className="input text-sm" placeholder="MM/YY" value={expiry} onChange={(e) => setExpiry(e.target.value)} maxLength={5} />
                                </div>
                                <div className="flex-1">
                                  <label className="block text-xs font-medium text-dark mb-1">CVV</label>
                                  <input className="input text-sm" placeholder="•••" value={cvv} onChange={(e) => setCvv(e.target.value)} maxLength={3} type="password" />
                                </div>
                              </div>
                              <div className="bg-yellow-50 border border-yellow-100 rounded-xl px-3 py-2 text-xs text-yellow-700">
                                💳 Demo only — no real payment processed
                              </div>
                            </div>
                          )}

                          {payMethod === pm.id && pm.id === 'cod' && (
                            <div className="mt-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100">
                              <p className="text-xs text-gray-400">Please have exact change ready. Our rider will collect ৳{grandTotal} on delivery.</p>
                            </div>
                          )}

                          {payMethod === pm.id && pm.id === 'wallet' && wallet >= totalBeforeWallet && (
                            <div className="mt-2 px-4 py-2 bg-green-50 rounded-xl border border-green-100">
                              <p className="text-xs text-green-700">✓ Full amount covered by your wallet balance.</p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <button
                    onClick={handlePlaceOrder}
                    disabled={placing}
                    className="btn-primary w-full py-3 text-base mt-2"
                  >
                    {placing ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Placing Order…
                      </span>
                    ) : `Place Order · ৳${grandTotal}`}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* ── RIGHT — Order Summary ────────────────────────────── */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-20">
              <h2 className="font-bold text-dark text-base mb-4">Order Summary</h2>

              {/* Items */}
              <div className="space-y-3 mb-5">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=100&q=80' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-dark truncate">{item.name}</p>
                      {item.selectedAddons?.length > 0 && (
                        <p className="text-xs text-brand truncate">+{item.selectedAddons.map(a => a.name).join(', ')}</p>
                      )}
                      <p className="text-xs text-gray-400">x{item.quantity} · ৳{item.effectivePrice ?? item.price} each</p>
                    </div>
                    <span className="text-xs font-semibold text-dark">৳{(item.effectivePrice ?? item.price) * item.quantity}</span>
                  </div>
                ))}
              </div>

              {/* Wallet balance pill */}
              {wallet > 0 && (
                <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
                  <span className="text-sm">💰</span>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400">Wallet balance</p>
                    <p className="text-xs font-semibold text-green-700">৳{wallet}</p>
                  </div>
                </div>
              )}

              {/* Delivery area pill */}
              {selectedArea && (
                <div className="mb-4 flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                  <span className="text-sm">📍</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400">Delivering to</p>
                    <p className="text-xs font-semibold text-dark truncate">{selectedArea.name}</p>
                  </div>
                  {distanceLabel && <span className="text-xs text-gray-400 flex-shrink-0">{distanceLabel}</span>}
                </div>
              )}

              {/* Scheduled pill */}
              {deliveryMode === 'later' && (
                <div className="mb-4 flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2">
                  <span className="text-sm">⏰</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400">Scheduled for</p>
                    <p className="text-xs font-semibold text-brand truncate">{scheduledLabel}</p>
                  </div>
                </div>
              )}

              {/* Fee breakdown */}
              <div className="border-t border-gray-100 pt-4 space-y-2.5">
                <FeeRow label="Subtotal" value={`৳${cartTotal}`} />
                <FeeRow label="Bag / packaging" value={`৳${BAG_FEE}`} />
                <FeeRow
                  label="Delivery fee"
                  sub={distanceLabel}
                  value={freeDelivery ? 'FREE 🎉' : `৳${deliveryFee}`}
                  green={freeDelivery}
                  strike={freeDelivery && deliveryFeeBase > 0}
                />
                <FeeRow label="Platform / service" value={`৳${SERVICE_FEE}`} />
                <FeeRow label="VAT" sub="5% on subtotal" value={`৳${vat}`} />

                {appliedPromo && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-green-600 font-medium">Promo ({appliedPromo})</span>
                    <span className="text-green-600 font-semibold">−৳{promoDiscount}</span>
                  </div>
                )}

                {walletDeduction > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-green-600 font-medium">💰 Wallet</span>
                    <span className="text-green-600 font-semibold">−৳{walletDeduction}</span>
                  </div>
                )}

                <div className="border-t border-gray-100 pt-3">
                  <FeeRow label="Grand Total" value={`৳${grandTotal}`} bold highlight />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
