import { useState, useEffect, useRef } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Toast from '../components/Toast'
import mealsData from '../data/meals.json'
import ordersData from '../data/orders.json'
import chefs from '../data/chefs.json'
import users from '../data/users.json'

const EMPTY_FORM = {
  name: '', description: '', price: '', category: 'Bengali',
  image: '', prepTime: '', tags: '',
}

const CATEGORIES = [
  'Bengali', 'Mughlai', 'Indian', 'Chinese', 'Thai', 'Japanese',
  'Korean', 'Italian', 'Pizza', 'BBQ', 'Bar Food', 'Mexican',
  'Middle Eastern', 'Desserts', 'Street Food', 'Healthy', 'African', 'Continental',
]

const ORDER_PIPELINE = ['confirmed', 'preparing', 'ready_for_pickup', 'rider_assigned', 'picked_up', 'delivered']
const PIPELINE_LABELS = {
  confirmed: 'Accepted',
  preparing: 'Preparing',
  ready_for_pickup: 'Ready',
  rider_assigned: 'Rider Assigned',
  picked_up: 'Picked Up',
  on_the_way: 'Picked Up',
  delivered: 'Delivered',
}

const NEW_ORDER_STATUSES = ['placed', 'pending']
const RUNNING_STATUSES = ['confirmed', 'preparing', 'ready_for_pickup', 'rider_assigned', 'picked_up', 'on_the_way']
const DONE_STATUSES = ['delivered']

function useInterval(callback, delay) {
  const savedCallback = useRef()
  useEffect(() => { savedCallback.current = callback }, [callback])
  useEffect(() => {
    if (delay !== null) {
      const id = setInterval(() => savedCallback.current(), delay)
      return () => clearInterval(id)
    }
  }, [delay])
}

function CountdownTimer({ placedAt, onExpire }) {
  const [remaining, setRemaining] = useState(null)
  useEffect(() => {
    const placed = new Date(placedAt).getTime()
    const expiry = placed + 90 * 1000
    const calc = () => {
      const diff = Math.max(0, Math.floor((expiry - Date.now()) / 1000))
      setRemaining(diff)
      if (diff === 0 && onExpire) onExpire()
    }
    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [placedAt])
  if (remaining === null) return null
  const m = Math.floor(remaining / 60)
  const s = remaining % 60
  const urgent = remaining <= 20
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded-full font-bold ${urgent ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-amber-100 text-amber-700'}`}>
      ⏱ {m}:{String(s).padStart(2, '0')}
    </span>
  )
}

function NotificationBell({ notifications, onClear }) {
  const [open, setOpen] = useState(false)
  const unread = notifications.filter(n => !n.read).length
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-100 shadow-sm hover:border-brand transition-colors"
      >
        <svg className="w-5 h-5 text-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-12 w-72 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="font-bold text-dark text-sm">Notifications</span>
            <button onClick={() => { onClear(); setOpen(false) }} className="text-xs text-gray-400 hover:text-brand">Clear all</button>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-center py-8 text-gray-400 text-sm">No notifications</p>
            ) : (
              notifications.slice().reverse().map((n, i) => (
                <div key={i} className={`px-4 py-3 border-b border-gray-50 text-sm ${!n.read ? 'bg-orange-50' : ''}`}>
                  <div className="flex gap-2 items-start">
                    <span>{n.icon}</span>
                    <div>
                      <p className="text-dark text-xs leading-snug">{n.message}</p>
                      <p className="text-gray-400 text-[10px] mt-0.5">{n.time}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function PrepModal({ order, onClose, onConfirm }) {
  const [prepTime, setPrepTime] = useState(30)
  const [note, setNote] = useState('')
  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
        <h3 className="font-bold text-dark mb-1">Accept Order #{order.id}</h3>
        <p className="text-xs text-gray-400 mb-5">Set your prep time for the customer</p>
        <div className="mb-4">
          <label className="text-sm font-medium text-dark mb-2 block">Prep Time</label>
          <div className="flex gap-2">
            {[15, 30, 45].map(t => (
              <button key={t} onClick={() => setPrepTime(t)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors ${prepTime === t ? 'border-brand bg-orange-50 text-brand' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                {t} min
              </button>
            ))}
          </div>
        </div>
        <div className="mb-5">
          <label className="text-sm font-medium text-dark mb-1.5 block">Note to customer <span className="font-normal text-gray-400">(optional)</span></label>
          <input className="input text-sm" placeholder="e.g. Adding extra care to your dish…" value={note} onChange={e => setNote(e.target.value)} />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-outline flex-1 py-2.5 text-sm">Cancel</button>
          <button onClick={() => onConfirm(prepTime, note)} className="btn-primary flex-1 py-2.5 text-sm">✅ Confirm</button>
        </div>
      </div>
    </div>
  )
}

function DeclineModal({ order, onClose, onConfirm }) {
  const [reason, setReason] = useState('')
  const reasons = ['Too busy', 'Item unavailable', 'Closing soon', 'Other']
  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
        <h3 className="font-bold text-dark mb-1">Decline Order #{order.id}</h3>
        <p className="text-xs text-gray-400 mb-5">Select a reason for declining</p>
        <div className="space-y-2 mb-5">
          {reasons.map(r => (
            <button key={r} onClick={() => setReason(r)}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm border-2 transition-colors ${reason === r ? 'border-red-400 bg-red-50 text-red-600 font-medium' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
              {r}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-outline flex-1 py-2.5 text-sm">Cancel</button>
          <button onClick={() => reason && onConfirm(reason)}
            className={`flex-1 py-2.5 text-sm rounded-xl font-semibold transition-colors ${reason ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
            ❌ Decline
          </button>
        </div>
      </div>
    </div>
  )
}

function OrderPipeline({ status }) {
  const steps = ORDER_PIPELINE
  const currentIdx = steps.indexOf(status)
  return (
    <div className="flex items-center gap-1 mt-2">
      {steps.map((step, i) => {
        const done = i <= currentIdx
        const active = i === currentIdx
        return (
          <div key={step} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full transition-colors ${done ? (active ? 'bg-brand scale-125' : 'bg-green-400') : 'bg-gray-200'}`} title={PIPELINE_LABELS[step]} />
            {i < steps.length - 1 && <div className={`w-4 h-0.5 ${i < currentIdx ? 'bg-green-400' : 'bg-gray-200'}`} />}
          </div>
        )
      })}
      <span className="ml-2 text-[10px] text-gray-500 font-medium">{PIPELINE_LABELS[status] || status.replace(/_/g, ' ')}</span>
    </div>
  )
}

function WeeklyChart({ orders }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay() + 1)
  const data = days.map((_, i) => {
    const day = new Date(weekStart)
    day.setDate(weekStart.getDate() + i)
    const dayOrders = orders.filter(o => {
      const d = new Date(o.placedAt)
      return d.toDateString() === day.toDateString() && o.status === 'delivered'
    })
    return dayOrders.reduce((sum, o) => sum + o.total, 0)
  })
  const max = Math.max(...data, 1)
  return (
    <div className="flex items-end gap-2 h-16">
      {data.map((val, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full rounded-t-lg bg-orange-100 relative overflow-hidden" style={{ height: 48 }}>
            <div className="absolute bottom-0 left-0 right-0 bg-brand rounded-t-lg transition-all" style={{ height: `${(val / max) * 100}%` }} />
          </div>
          <span className="text-[9px] text-gray-400">{days[i]}</span>
        </div>
      ))}
    </div>
  )
}

export default function ChefDashboard() {
  const { currentUser } = useAuth()
  const [meals, setMeals] = useState([])
  const [orders, setOrders] = useState([])
  const [chefProfile, setChefProfile] = useState(null)
  const [available, setAvailable] = useState(true)
  const [capacity, setCapacity] = useState(5)
  const [activeTab, setActiveTab] = useState('new')
  const [showForm, setShowForm] = useState(false)
  const [editingMeal, setEditingMeal] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState({})
  const [toast, setToast] = useState(null)
  const [muted, setMuted] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [prepModal, setPrepModal] = useState(null)
  const [declineModal, setDeclineModal] = useState(null)
  const [specialPinMeal, setSpecialPinMeal] = useState(null)
  const [soldOutMeals, setSoldOutMeals] = useState({})
  const [expiredOrders, setExpiredOrders] = useState(new Set())
  const prevOrderCountRef = useRef(0)
  const bellAudioRef = useRef(null)
  const unackTimerRef = useRef({})
  const responseRateRef = useRef({ responded: 0, total: 0 })

  if (!currentUser || currentUser.role !== 'chef') return <Navigate to="/login" replace />

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const addNotification = (icon, message) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setNotifications(prev => [...prev, { icon, message, time, read: false }])
  }

  const playBell = () => {
    if (muted) return
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3)
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
      osc.start(); osc.stop(ctx.currentTime + 0.5)
    } catch (e) {}
  }

  useEffect(() => {
    const storedMeals = JSON.parse(localStorage.getItem('hcm_chef_meals_' + currentUser.id) || 'null')
    const myMeals = storedMeals || mealsData.filter(m => m.chefId === currentUser.id)
    setMeals(myMeals)

    const localOrders = JSON.parse(localStorage.getItem('hcm_orders') || '[]')
    const allOrders = [...localOrders, ...ordersData]
    const seen = new Set()
    const myOrders = allOrders.filter(o => {
      if (o.chefId !== currentUser.id || seen.has(o.id)) return false
      seen.add(o.id); return true
    })
    setOrders(myOrders)
    prevOrderCountRef.current = myOrders.filter(o => NEW_ORDER_STATUSES.includes(o.status)).length

    const profile = chefs.find(c => c.id === currentUser.id)
    setChefProfile(profile)
    if (profile) setAvailable(profile.available)

    // Load pinned special
    const pin = localStorage.getItem('hcm_special_pin_' + currentUser.id)
    if (pin) setSpecialPinMeal(JSON.parse(pin))

    // Load sold out
    const so = JSON.parse(localStorage.getItem('hcm_sold_out_' + currentUser.id) || '{}')
    setSoldOutMeals(so)

    // Response rate
    const responded = myOrders.filter(o => !NEW_ORDER_STATUSES.includes(o.status)).length
    responseRateRef.current = { responded, total: myOrders.length }
  }, [currentUser.id])

  // Random customer pool for simulation
  const FAKE_CUSTOMERS = [
    { id: 'fc_1', name: 'Abir Rahman',    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80', address: 'House 12, Road 5, Dhanmondi' },
    { id: 'fc_2', name: 'Nadia Islam',    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80', address: 'Flat 3B, Gulshan Avenue' },
    { id: 'fc_3', name: 'Tanvir Hossain', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80', address: 'Road 11, Banani, Dhaka' },
    { id: 'fc_4', name: 'Sumaiya Akter',  avatar: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=200&q=80', address: 'Block C, Mirpur DOHS' },
    { id: 'fc_5', name: 'Rafiq Uddin',    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80', address: 'Bashundhara R/A, Gate 4' },
    { id: 'fc_6', name: 'Mithila Roy',    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80', address: '52 Eskaton Garden, Dhaka' },
    { id: 'fc_7', name: 'Imran Kabir',    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80', address: 'Jigatola, Dhaka-1209' },
    { id: 'fc_8', name: 'Priya Saha',     avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&q=80', address: 'New DOHS, Mohakhali' },
  ]

  // Simulate random new order every 20–40s
  useInterval(() => {
    // Pick random customer
    if (Math.random() < 0.3) return // 30% chance skip — makes timing feel organic
    const customer = FAKE_CUSTOMERS[Math.floor(Math.random() * FAKE_CUSTOMERS.length)]

    // Pick 1–3 random items from THIS chef's current meal list
    const chefMeals = meals.filter(m => m.available && !soldOutMeals[m.id])
    if (chefMeals.length === 0) return
    const shuffled = [...chefMeals].sort(() => Math.random() - 0.5)
    const count = Math.min(Math.floor(Math.random() * 3) + 1, shuffled.length)
    const picked = shuffled.slice(0, count)
    const items = picked.map(m => ({
      mealId: m.id,
      name: m.name,
      price: m.price,
      quantity: Math.random() < 0.3 ? 2 : 1,
    }))
    const total = items.reduce((s, i) => s + i.price * i.quantity, 0)

    const newOrder = {
      id: 'o_live_' + Date.now(),
      customerId: customer.id,
      customerName: customer.name,
      customerAvatar: customer.avatar,
      chefId: currentUser.id,
      riderId: null,
      items,
      total,
      address: customer.address,
      status: 'placed',
      securityCode: String(Math.floor(100 + Math.random() * 900)),
      placedAt: new Date().toISOString(),
      deliveredAt: null,
    }

    setOrders(prev => [newOrder, ...prev])
    addNotification('🆕', `New order from ${customer.name} — ৳${total}`)
    playBell()
    setActiveTab('new')

    // Unack ping after 30s
    unackTimerRef.current[newOrder.id] = setTimeout(() => {
      playBell(); playBell()
      addNotification('🔔', `Order from ${customer.name} still unacknowledged!`)
    }, 30000)
  }, 25000)

  const saveMeals = (updated) => {
    setMeals(updated)
    localStorage.setItem('hcm_chef_meals_' + currentUser.id, JSON.stringify(updated))
  }

  const validateForm = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Required'
    if (!form.description.trim()) e.description = 'Required'
    if (!form.price || isNaN(form.price) || Number(form.price) <= 0) e.price = 'Enter a valid price'
    if (!form.prepTime.trim()) e.prepTime = 'Required'
    setFormErrors(e)
    return Object.keys(e).length === 0
  }

  const handleFormSubmit = () => {
    if (!validateForm()) return
    const mealObj = {
      id: editingMeal ? editingMeal.id : 'm_' + Date.now(),
      chefId: currentUser.id,
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      category: form.category,
      image: form.image.trim() || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80',
      prepTime: form.prepTime.trim(),
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      available: true,
      rating: editingMeal?.rating || 4.5,
      totalOrders: editingMeal?.totalOrders || 0,
    }
    let updated
    if (editingMeal) {
      updated = meals.map(m => m.id === editingMeal.id ? mealObj : m)
      showToast('Meal updated!')
    } else {
      updated = [...meals, mealObj]
      showToast('Meal added!')
    }
    saveMeals(updated)
    setShowForm(false); setEditingMeal(null); setForm(EMPTY_FORM); setFormErrors({})
  }

  const handleEdit = (meal) => {
    setEditingMeal(meal)
    setForm({ name: meal.name, description: meal.description, price: String(meal.price), category: meal.category, image: meal.image || '', prepTime: meal.prepTime || '', tags: (meal.tags || []).join(', ') })
    setShowForm(true); setActiveTab('my_meals')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = (mealId) => {
    if (!window.confirm('Delete this meal?')) return
    saveMeals(meals.filter(m => m.id !== mealId))
    showToast('Meal deleted', 'error')
  }

  const toggleMealAvailability = (mealId) => {
    saveMeals(meals.map(m => m.id === mealId ? { ...m, available: !m.available } : m))
  }

  const persistOrderUpdate = (updatedOrders) => {
    setOrders(updatedOrders)
    const local = JSON.parse(localStorage.getItem('hcm_orders') || '[]')
    const ids = new Set(updatedOrders.map(o => o.id))
    const merged = [...updatedOrders.filter(o => local.find(l => l.id === o.id)), ...local.filter(o => !ids.has(o.id))]
    localStorage.setItem('hcm_orders', JSON.stringify(merged))
  }

  const handleAccept = (order, prepTime, note) => {
    clearTimeout(unackTimerRef.current[order.id])
    const updated = orders.map(o =>
      o.id === order.id ? { ...o, status: 'confirmed', prepTime, note, acceptedAt: new Date().toISOString() } : o
    )
    persistOrderUpdate(updated)
    setPrepModal(null)
    showToast(`Order accepted! Prep time: ${prepTime} min`)
    addNotification('✅', `Order ${order.id} accepted`)
    responseRateRef.current.responded++
    responseRateRef.current.total = Math.max(responseRateRef.current.total, orders.length)
    // Auto-fake delivery after 2-4 min for demo
    setTimeout(() => {
      setOrders(prev => prev.map(o => o.id === order.id && o.status === 'confirmed' ? { ...o, status: 'preparing' } : o))
    }, 60000)
  }

  const handleDecline = (order, reason) => {
    clearTimeout(unackTimerRef.current[order.id])
    const updated = orders.map(o =>
      o.id === order.id ? { ...o, status: 'rejected', declineReason: reason } : o
    )
    persistOrderUpdate(updated)
    setDeclineModal(null)
    showToast('Order declined', 'error')
    addNotification('❌', `Order ${order.id} declined: ${reason}`)
  }

  const markPreparing = (orderId) => {
    persistOrderUpdate(orders.map(o => o.id === orderId ? { ...o, status: 'preparing' } : o))
    showToast('Marked as Preparing')
  }

  const FAKE_RIDERS = [
    { id: 'r1', name: 'Rakib Hasan',   phone: '+880 1711-223344', avatar: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=200&q=80', rating: 4.8 },
    { id: 'r2', name: 'Jahidul Islam', phone: '+880 1833-445566', avatar: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=200&q=80', rating: 4.6 },
    { id: 'r3', name: 'Sagor Mia',     phone: '+880 1922-667788', avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=200&q=80', rating: 4.9 },
    { id: 'r4', name: 'Bellal Uddin',  phone: '+880 1600-889900', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&q=80', rating: 4.7 },
    { id: 'r5', name: 'Mizan Sheikh',  phone: '+880 1755-001122', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80', rating: 4.5 },
  ]

  const markReady = (orderId) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'ready_for_pickup' } : o))
    showToast('Marked Ready — finding rider…')
    addNotification('🛵', 'Finding rider for order ' + orderId)
    const delay = Math.floor(Math.random() * 3000) + 3000
    setTimeout(() => {
      const rider = FAKE_RIDERS[Math.floor(Math.random() * FAKE_RIDERS.length)]
      setOrders(prev => prev.map(o =>
        o.id === orderId ? { ...o, status: 'rider_assigned', riderId: rider.id, riderInfo: rider } : o
      ))
      addNotification('🧑', rider.name + ' assigned to order ' + orderId)
      showToast('🛵 ' + rider.name + ' is coming to pick up!')
    }, delay)
  }

  const confirmRiderPickup = (orderId) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'picked_up', pickedAt: new Date().toISOString() } : o))
    showToast('Rider picked up the food! 🛵')
    addNotification('📦', 'Rider picked up order ' + orderId)
    const deliverDelay = Math.floor(Math.random() * 60000) + 60000
    setTimeout(() => {
      setOrders(prev => {
        const order = prev.find(o => o.id === orderId)
        const earned = order ? Math.round(order.total * 0.8) : 0
        const updated = prev.map(o =>
          o.id === orderId ? { ...o, status: 'delivered', deliveredAt: new Date().toISOString() } : o
        )
        setTimeout(() => {
          showToast('💰 Order delivered! You earned ৳' + earned, 'success')
          addNotification('💰', 'Order ' + orderId + ' delivered — ৳' + earned + ' earned')
          setActiveTab('done')
        }, 100)
        return updated
      })
    }, deliverDelay)
  }

  const toggleSoldOut = (orderId) => {
    const updated = orders.map(o => o.id === orderId ? { ...o, soldOut: !o.soldOut } : o)
    persistOrderUpdate(updated)
    showToast('Updated sold out status')
  }

  const handleOrderExpire = (orderId) => {
    setExpiredOrders(prev => new Set([...prev, orderId]))
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'rejected', declineReason: 'Auto-expired' } : o))
    showToast('Order auto-expired (no response)', 'error')
    addNotification('🔴', `Order ${orderId} expired (no response)`)
  }

  const setSpecialPin = (meal) => {
    setSpecialPinMeal(meal)
    localStorage.setItem('hcm_special_pin_' + currentUser.id, JSON.stringify(meal))
    showToast(`"${meal.name}" pinned as Today's Special!`)
  }

  const toggleSoldOutMeal = (mealId) => {
    const updated = { ...soldOutMeals, [mealId]: !soldOutMeals[mealId] }
    setSoldOutMeals(updated)
    localStorage.setItem('hcm_sold_out_' + currentUser.id, JSON.stringify(updated))
  }

  // --- Computed ---
  const newOrders = orders.filter(o => NEW_ORDER_STATUSES.includes(o.status))
  const runningOrders = orders.filter(o => RUNNING_STATUSES.includes(o.status))
  const doneOrders = orders.filter(o => DONE_STATUSES.includes(o.status))

  const totalEarnings = doneOrders.reduce((sum, o) => sum + o.total, 0)
  const todayEarnings = doneOrders.filter(o => new Date(o.placedAt).toDateString() === new Date().toDateString()).reduce((sum, o) => sum + o.total, 0)
  const avgOrderValue = doneOrders.length > 0 ? Math.round(totalEarnings / doneOrders.length) : 0
  const cancellationRate = orders.length > 0 ? Math.round((orders.filter(o => o.status === 'rejected').length / orders.length) * 100) : 0
  const responseRate = responseRateRef.current.total > 0
    ? Math.round((responseRateRef.current.responded / responseRateRef.current.total) * 100)
    : 94

  // Running orders rider info lookup
  const getRiderName = (riderId) => {
    if (!riderId) return null
    const u = users.find(u => u.id === riderId)
    return u ? u.name : 'Rider'
  }

  const tabs = [
    { key: 'new', label: '🆕 New Orders', count: newOrders.length, alert: newOrders.length > 0 },
    { key: 'running', label: '🔥 Running', count: runningOrders.length },
    { key: 'done', label: '✅ Done', count: doneOrders.length },
    { key: 'my_meals', label: '🍽️ My Meals', count: meals.length },
  ]

  return (
    <div className="page-wrapper">
      <Toast message={toast?.message} type={toast?.type} />
      {prepModal && <PrepModal order={prepModal} onClose={() => setPrepModal(null)} onConfirm={(prepTime, note) => handleAccept(prepModal, prepTime, note)} />}
      {declineModal && <DeclineModal order={declineModal} onClose={() => setDeclineModal(null)} onConfirm={(reason) => handleDecline(declineModal, reason)} />}

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header / Top Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <img src={currentUser.avatar} alt={currentUser.name} className="w-14 h-14 rounded-2xl bg-gray-100 border-2 border-gray-100" />
            <div>
              <h1 className="text-xl font-bold text-dark">Chef Dashboard</h1>
              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                <p className="text-gray-400 text-sm">{currentUser.name}</p>
                {chefProfile && (
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {chefProfile.specialty}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Capacity Indicator */}
            <div className="flex items-center gap-1.5 bg-white border border-gray-100 rounded-xl px-3 py-2 text-xs shadow-sm">
              <span className="text-gray-500">Capacity</span>
              {[1,2,3,4,5].map(i => (
                <button key={i} onClick={() => setCapacity(i)}
                  className={`w-3 h-3 rounded-full border transition-colors ${i <= capacity ? 'bg-brand border-brand' : 'bg-gray-200 border-gray-200'}`}
                  title={`${i}/5`} />
              ))}
              <span className="text-gray-400 ml-1">{capacity}/5</span>
            </div>

            {/* Response Rate */}
            <div className="bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-sm">
              <span className="text-xs text-gray-400">{responseRate}% </span>
              <span className="text-xs font-semibold text-dark">response</span>
            </div>

            {/* Snooze */}
            <button
              onClick={() => { showToast('Snoozed new orders for 15 min'); addNotification('😴', 'Kitchen snoozed until 15 min') }}
              className="bg-white border border-gray-100 rounded-xl px-3 py-2 text-xs text-gray-500 hover:border-brand transition-colors shadow-sm"
              title="Snooze orders"
            >
              😴 Snooze
            </button>

            {/* Mute */}
            <button
              onClick={() => setMuted(!muted)}
              className={`w-10 h-10 flex items-center justify-center rounded-xl border shadow-sm transition-colors ${muted ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-100 hover:border-brand'}`}
              title={muted ? 'Unmute' : 'Mute sound'}
            >
              {muted ? '🔇' : '🔔'}
            </button>

            {/* Bell */}
            <NotificationBell notifications={notifications} onClear={() => setNotifications([])} />

            {/* Kitchen Status Toggle */}
            <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-sm">
              <span className="text-xs font-medium text-dark hidden sm:block">Kitchen</span>
              <button
                onClick={() => { setAvailable(!available); addNotification(available ? '🔴' : '🟢', `Kitchen ${available ? 'closed' : 'opened'}`) }}
                className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none ${available ? 'bg-green-400' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${available ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
              <span className={`text-xs font-semibold ${available ? 'text-green-500' : 'text-gray-400'}`}>
                {available ? '🟢' : '🔴'}
              </span>
            </div>
          </div>
        </div>

        {/* Kitchen Full Banner */}
        {!available && newOrders.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-6 flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-amber-800">Kitchen is closed — new orders tab shows "Kitchen Full"</p>
              <p className="text-xs text-amber-600">Toggle kitchen open to accept new orders</p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Earned', value: `৳${totalEarnings.toLocaleString()}`, sub: `Today ৳${todayEarnings}`, emoji: '💰', color: 'text-green-600' },
            { label: 'Avg Order', value: `৳${avgOrderValue}`, sub: `${doneOrders.length} delivered`, emoji: '📊', color: 'text-blue-500' },
            { label: 'Running', value: runningOrders.length, sub: `${newOrders.length} pending`, emoji: '🔥', color: 'text-orange-500' },
            { label: 'Cancel Rate', value: `${cancellationRate}%`, sub: `${meals.length} meals`, emoji: '📉', color: cancellationRate > 10 ? 'text-red-500' : 'text-gray-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="text-xl mb-1">{s.emoji}</div>
              <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-gray-400 text-[10px] mt-0.5">{s.label}</div>
              <div className="text-gray-300 text-[10px]">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Weekly chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-dark">Last 7 Days Earnings</span>
            <span className="text-xs text-gray-400">৳{totalEarnings.toLocaleString()} total</span>
          </div>
          <WeeklyChart orders={orders} />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-6 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setShowForm(false) }}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.key ? 'bg-white text-dark shadow-sm' : 'text-gray-500 hover:text-dark'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${tab.alert ? 'bg-brand text-white animate-pulse' : activeTab === tab.key ? 'bg-orange-100 text-brand' : 'bg-gray-200 text-gray-500'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ═══ TAB: NEW ORDERS ═══ */}
        {activeTab === 'new' && (
          <div className="space-y-4">
            {newOrders.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <div className="text-4xl mb-3">📦</div>
                <p className="font-semibold text-dark">No new orders</p>
                <p className="text-gray-400 text-sm mt-1">{available ? 'Waiting for new orders…' : 'Kitchen is closed'}</p>
              </div>
            ) : (
              newOrders.map(order => {
                const customer = users.find(u => u.id === order.customerId)
                const customerName = customer?.name || order.customerName || 'Customer'
                const customerAvatar = customer?.avatar || order.customerAvatar
                const isRepeat = orders.filter(o => o.customerId === order.customerId && o.status === 'delivered').length > 0
                const expired = expiredOrders.has(order.id)
                return (
                  <div key={order.id} className={`bg-white rounded-2xl border shadow-sm p-5 ${expired ? 'opacity-50' : 'border-orange-100'}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        {customerAvatar && <img src={customerAvatar} className="w-9 h-9 rounded-xl object-cover bg-gray-100" />}
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-dark text-sm">{customerName}</span>
                            {isRepeat && <span className="text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full font-medium">⭐ Repeat</span>}
                            <span className="font-mono text-xs text-gray-400">#{order.id}</span>
                          </div>
                          <p className="text-xs text-gray-400">{new Date(order.placedAt).toLocaleTimeString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <CountdownTimer placedAt={order.placedAt} onExpire={() => handleOrderExpire(order.id)} />
                        <span className="font-bold text-dark">৳{order.total}</span>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-1 mb-3">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm text-gray-600">
                          <span>{item.name} <span className="text-gray-400">×{item.quantity}</span></span>
                          <span>৳{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    {order.address && <p className="text-xs text-gray-400 mb-1">📍 {order.address}</p>}
                    {order.note && <p className="text-xs text-orange-500 mb-3">📝 {order.note}</p>}

                    {!expired && (
                      <div className="flex gap-3 pt-4 border-t border-gray-100">
                        <button onClick={() => setPrepModal(order)} className="btn-primary flex-1 py-2.5 text-sm">
                          ✅ Accept
                        </button>
                        <button onClick={() => setDeclineModal(order)}
                          className="flex-1 py-2.5 text-sm border-2 border-red-200 text-red-500 rounded-xl hover:bg-red-50 transition-colors font-semibold">
                          ❌ Decline
                        </button>
                      </div>
                    )}
                    {expired && <p className="text-center text-xs text-red-400 pt-3 border-t border-gray-100">Auto-expired — no response</p>}
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* ═══ TAB: RUNNING ORDERS ═══ */}
        {activeTab === 'running' && (
          <div className="space-y-4">
            {runningOrders.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <div className="text-4xl mb-3">🔥</div>
                <p className="font-semibold text-dark">No running orders</p>
              </div>
            ) : (
              runningOrders.map(order => {
                const rider = order.riderInfo || null
                const statusColors = {
                  confirmed: 'bg-blue-100 text-blue-600',
                  preparing: 'bg-orange-100 text-orange-600',
                  ready_for_pickup: 'bg-amber-100 text-amber-700',
                  rider_assigned: 'bg-purple-100 text-purple-600',
                  picked_up: 'bg-indigo-100 text-indigo-600',
                  on_the_way: 'bg-indigo-100 text-indigo-600',
                }
                return (
                  <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs text-gray-400">#{order.id}</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[order.status] || 'bg-gray-100 text-gray-500'}`}>
                            {order.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <OrderPipeline status={order.status} />
                      </div>
                      <span className="font-bold text-dark">৳{order.total}</span>
                    </div>

                    {/* Items */}
                    <div className="space-y-1 mb-3">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm text-gray-600">
                          <span>{item.name} <span className="text-gray-400">×{item.quantity}</span></span>
                          <span>৳{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                    {order.address && <p className="text-xs text-gray-400 mb-2">📍 {order.address}</p>}
                    {order.prepTime && <p className="text-xs text-gray-400 mb-2">⏱ Prep: {order.prepTime} min</p>}

                    {/* Rider card — shown once assigned */}
                    {rider && (order.status === 'rider_assigned' || order.status === 'picked_up' || order.status === 'on_the_way') && (
                      <div className="flex items-center gap-3 bg-purple-50 border border-purple-100 rounded-xl px-3 py-2.5 mb-3">
                        <img src={rider.avatar} className="w-9 h-9 rounded-xl object-cover bg-gray-200"
                          onError={e => e.target.src='https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=200&q=80'} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-dark leading-tight">{rider.name}</p>
                          <p className="text-xs text-gray-400">{rider.phone} · ⭐ {rider.rating}</p>
                        </div>
                        <span className="text-xs bg-purple-200 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                          {order.status === 'picked_up' ? '🛵 En Route' : '🔔 Arriving'}
                        </span>
                      </div>
                    )}

                    {/* Rider finding spinner */}
                    {order.status === 'ready_for_pickup' && !rider && (
                      <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mb-3">
                        <span className="animate-spin text-base">🔄</span>
                        <span className="text-xs text-amber-700 font-medium">Finding nearby rider…</span>
                      </div>
                    )}

                    {/* Chef actions */}
                    <div className="flex gap-2 pt-3 border-t border-gray-100 flex-wrap">
                      {order.status === 'confirmed' && (
                        <button onClick={() => markPreparing(order.id)} className="btn-primary py-2 px-4 text-xs">
                          🍳 Mark Preparing
                        </button>
                      )}
                      {order.status === 'preparing' && (
                        <button onClick={() => markReady(order.id)} className="btn-primary py-2 px-4 text-xs">
                          ✅ Mark Ready for Pickup
                        </button>
                      )}
                      {order.status === 'rider_assigned' && (
                        <button
                          onClick={() => confirmRiderPickup(order.id)}
                          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2 px-4 text-xs rounded-xl font-semibold transition-colors animate-pulse"
                        >
                          🤝 Rider Took the Food
                        </button>
                      )}
                      {(order.status === 'picked_up' || order.status === 'on_the_way') && (
                        <div className="flex items-center gap-2 text-xs text-indigo-600 font-medium">
                          <span className="animate-bounce">🛵</span> Rider on the way — delivery soon
                        </div>
                      )}
                      <button
                        onClick={() => toggleSoldOut(order.id)}
                        className="py-2 px-3 text-xs border border-gray-200 rounded-xl text-gray-500 hover:border-red-300 hover:text-red-500 transition-colors font-medium"
                      >
                        {order.soldOut ? '✅ Unsold Out' : '🚫 Sold Out'}
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* ═══ TAB: DONE ═══ */}
        {activeTab === 'done' && (
          <div>
            {/* Daily summary */}
            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
                <p className="text-xs text-green-600 mb-1">Today Total</p>
                <p className="text-2xl font-bold text-green-700">৳{todayEarnings.toLocaleString()}</p>
              </div>
              <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                <p className="text-xs text-blue-600 mb-1">Avg Order Value</p>
                <p className="text-2xl font-bold text-blue-700">৳{avgOrderValue}</p>
              </div>
              <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
                <p className="text-xs text-purple-600 mb-1">Cancellation Rate</p>
                <p className="text-2xl font-bold text-purple-700">{cancellationRate}%</p>
              </div>
            </div>

            <div className="space-y-3">
              {doneOrders.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                  <div className="text-4xl mb-3">✅</div>
                  <p className="font-semibold text-dark">No completed orders yet</p>
                </div>
              ) : (
                doneOrders.map(order => {
                  const customer = users.find(u => u.id === order.customerId)
                  const customerName = customer?.name || order.customerName || 'Customer'
                  const customerAvatar = customer?.avatar || order.customerAvatar
                  const earned = Math.round(order.total * 0.8)
                  const rider = order.riderInfo
                  const deliveredTime = order.deliveredAt ? new Date(order.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null
                  return (
                    <div key={order.id} className="bg-white rounded-2xl border border-green-100 shadow-sm p-4 overflow-hidden relative">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-emerald-500" />
                      <div className="flex flex-wrap items-start justify-between gap-2 pt-1">
                        <div className="flex items-center gap-3">
                          {customerAvatar && <img src={customerAvatar} className="w-10 h-10 rounded-xl object-cover bg-gray-100" onError={e => e.target.style.display='none'} />}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-gray-400">#{order.id}</span>
                              <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-semibold">✅ Delivered</span>
                            </div>
                            <p className="text-sm font-medium text-dark mt-0.5">{customerName}</p>
                            <p className="text-xs text-gray-400">{order.items.map(i => i.name).join(', ')}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-dark">৳{order.total}</p>
                          <p className="text-sm font-semibold text-green-600">+৳{earned} earned</p>
                          {deliveredTime && <p className="text-[10px] text-gray-400">{deliveredTime}</p>}
                        </div>
                      </div>
                      {rider && (
                        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-50 text-xs text-gray-400">
                          <img src={rider.avatar} className="w-5 h-5 rounded-full object-cover" onError={e => e.target.style.display='none'} />
                          <span>Delivered by <span className="font-medium text-gray-600">{rider.name}</span></span>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* ═══ TAB: MY MEALS ═══ */}
        {activeTab === 'my_meals' && (
          <div>
            {/* Today's Special Pin */}
            {specialPinMeal && (
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-4 mb-5 flex items-center gap-4">
                <img src={specialPinMeal.image} className="w-12 h-12 rounded-xl object-cover" onError={e => e.target.src='https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&q=80'} />
                <div className="flex-1">
                  <p className="text-xs text-orange-500 font-semibold">⭐ Today's Special</p>
                  <p className="text-sm font-bold text-dark">{specialPinMeal.name}</p>
                  <p className="text-xs text-gray-400">Pinned on your chef profile & listing</p>
                </div>
                <button onClick={() => { setSpecialPinMeal(null); localStorage.removeItem('hcm_special_pin_' + currentUser.id) }}
                  className="text-gray-400 hover:text-dark text-xs">Remove</button>
              </div>
            )}

            {/* Add/Edit Form */}
            {showForm && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-bold text-dark">{editingMeal ? 'Edit Meal' : 'Add New Meal'}</h2>
                  <button onClick={() => { setShowForm(false); setEditingMeal(null); setForm(EMPTY_FORM); setFormErrors({}) }} className="text-gray-400 hover:text-dark">✕</button>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark mb-1.5">Meal Name *</label>
                    <input className={`input ${formErrors.name ? 'border-red-300' : ''}`} placeholder="e.g. Shorshe Ilish" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    {formErrors.name && <p className="text-red-400 text-xs mt-1">{formErrors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark mb-1.5">Category *</label>
                    <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-dark mb-1.5">Description *</label>
                    <textarea className={`input resize-none h-20 ${formErrors.description ? 'border-red-300' : ''}`} placeholder="Describe your dish…" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                    {formErrors.description && <p className="text-red-400 text-xs mt-1">{formErrors.description}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark mb-1.5">Price (৳) *</label>
                    <input type="number" className={`input ${formErrors.price ? 'border-red-300' : ''}`} placeholder="e.g. 250" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
                    {formErrors.price && <p className="text-red-400 text-xs mt-1">{formErrors.price}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark mb-1.5">Prep Time *</label>
                    <input className={`input ${formErrors.prepTime ? 'border-red-300' : ''}`} placeholder="e.g. 30 min" value={form.prepTime} onChange={e => setForm({ ...form, prepTime: e.target.value })} />
                    {formErrors.prepTime && <p className="text-red-400 text-xs mt-1">{formErrors.prepTime}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-dark mb-1.5">Image URL <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input className="input" placeholder="https://…" value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-dark mb-1.5">Tags <span className="text-gray-400 font-normal">(comma separated)</span></label>
                    <input className="input" placeholder="spicy, fish, traditional" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={handleFormSubmit} className="btn-primary flex-1 py-3">{editingMeal ? 'Save Changes' : 'Add Meal'}</button>
                  <button onClick={() => { setShowForm(false); setEditingMeal(null); setForm(EMPTY_FORM); setFormErrors({}) }} className="btn-outline flex-1 py-3">Cancel</button>
                </div>
              </div>
            )}

            {!showForm && (
              <button onClick={() => { setShowForm(true); setEditingMeal(null); setForm(EMPTY_FORM) }} className="btn-primary mb-6 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add New Meal
              </button>
            )}

            {meals.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <div className="text-4xl mb-3">🍽️</div>
                <p className="font-semibold text-dark">No meals yet</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {meals.map(meal => (
                  <div key={meal.id} className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${!meal.available || soldOutMeals[meal.id] ? 'opacity-60' : ''}`}>
                    <div className="relative h-40 bg-gray-100">
                      <img src={meal.image} alt={meal.name} className="w-full h-full object-cover"
                        onError={e => { e.target.src = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80' }} />
                      <div className="absolute top-2 right-2 flex gap-1.5 flex-wrap justify-end">
                        {specialPinMeal?.id === meal.id && (
                          <span className="text-[10px] bg-orange-500 text-white px-1.5 py-0.5 rounded-full font-bold">⭐ Special</span>
                        )}
                        {soldOutMeals[meal.id] && (
                          <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold">Sold Out</span>
                        )}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${meal.available ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'}`}>
                          {meal.available ? 'On' : 'Off'}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-dark text-sm leading-snug">{meal.name}</h3>
                        <span className="font-bold text-brand text-sm flex-shrink-0">৳{meal.price}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">{meal.description}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                        <span>⭐ {meal.rating}</span>
                        <span>•</span>
                        <span>🕐 {meal.prepTime}</span>
                        <span>•</span>
                        <span>{meal.totalOrders} orders</span>
                      </div>
                      <div className="flex gap-1.5 mt-3 pt-3 border-t border-gray-100 flex-wrap">
                        <button onClick={() => toggleMealAvailability(meal.id)}
                          className="flex-1 text-xs py-1.5 border border-gray-200 rounded-xl hover:border-brand hover:text-brand transition-colors font-medium text-gray-600 min-w-[48px]">
                          {meal.available ? 'Hide' : 'Show'}
                        </button>
                        <button onClick={() => handleEdit(meal)}
                          className="flex-1 text-xs py-1.5 border border-gray-200 rounded-xl hover:border-brand hover:text-brand transition-colors font-medium text-gray-600 min-w-[48px]">
                          Edit
                        </button>
                        <button
                          onClick={() => setSpecialPin(meal)}
                          className={`flex-1 text-xs py-1.5 border rounded-xl transition-colors font-medium min-w-[48px] ${specialPinMeal?.id === meal.id ? 'border-orange-300 text-orange-500 bg-orange-50' : 'border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-500'}`}
                          title="Pin as Today's Special"
                        >
                          ⭐
                        </button>
                        <button
                          onClick={() => toggleSoldOutMeal(meal.id)}
                          className={`flex-1 text-xs py-1.5 border rounded-xl transition-colors font-medium min-w-[48px] ${soldOutMeals[meal.id] ? 'border-red-300 text-red-500 bg-red-50' : 'border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500'}`}
                          title="Mark Sold Out"
                        >
                          🚫
                        </button>
                        <button onClick={() => handleDelete(meal.id)}
                          className="flex-1 text-xs py-1.5 border border-red-100 rounded-xl hover:border-red-300 hover:text-red-500 transition-colors font-medium text-gray-400 min-w-[48px]">
                          Del
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
