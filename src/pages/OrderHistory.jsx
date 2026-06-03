import { useState, useEffect } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import ordersData from '../data/orders.json'
import chefs from '../data/chefs.json'
import meals from '../data/meals.json'

const STATUS_COLOR = {
  confirmed:   'bg-yellow-100 text-yellow-700',
  preparing:   'bg-orange-100 text-orange-700',
  picked_up:   'bg-blue-100 text-blue-700',
  on_the_way:  'bg-blue-100 text-blue-700',
  delivered:   'bg-green-100 text-green-700',
  cancelled:   'bg-red-100 text-red-500',
}

const STATUS_LABEL = {
  confirmed:  'Confirmed',
  preparing:  'Preparing',
  picked_up:  'Picked Up',
  on_the_way: 'On the Way',
  delivered:  'Delivered',
  cancelled:  'Cancelled',
}

export default function OrderHistory() {
  const { currentUser } = useAuth()
  const { addToCart, showToast } = useCart()
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')  // 'all' | 'active' | 'delivered'
  const [expandedId, setExpandedId] = useState(null)

  const [orders, setOrders] = useState([])

  useEffect(() => {
    // Merge static seed orders (for demo) + any localStorage orders
    const stored = JSON.parse(localStorage.getItem('hcm_orders') || '[]')
    const seedForUser = ordersData.filter((o) => o.customerId === currentUser?.id)
    // dedupe by id
    const ids = new Set(stored.map((o) => o.id))
    const merged = [...stored, ...seedForUser.filter((o) => !ids.has(o.id))]
    merged.sort((a, b) => new Date(b.placedAt) - new Date(a.placedAt))
    setOrders(merged)
  }, [currentUser])

  if (!currentUser) return <Navigate to="/login" replace />

  const ACTIVE_STATUSES = ['confirmed', 'preparing', 'picked_up', 'on_the_way']

  const filtered = orders.filter((o) => {
    if (filter === 'active') return ACTIVE_STATUSES.includes(o.status)
    if (filter === 'delivered') return o.status === 'delivered'
    return true
  })

  const handleReorder = (order) => {
    order.items.forEach((item) => {
      const meal = meals.find((m) => m.id === item.mealId)
      if (meal) {
        for (let i = 0; i < item.quantity; i++) addToCart(meal)
      }
    })
    navigate('/cart')
  }

  const totalSpent = orders
    .filter((o) => o.status === 'delivered')
    .reduce((sum, o) => sum + o.total, 0)

  return (
    <div className="page-wrapper">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="section-title mb-1">Order History</h1>
        <p className="text-gray-400 text-sm mb-6">{orders.length} orders placed</p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Orders', value: orders.length, emoji: '📦' },
            { label: 'Delivered', value: orders.filter((o) => o.status === 'delivered').length, emoji: '✅' },
            { label: 'Total Spent', value: `৳${totalSpent}`, emoji: '💰' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
              <div className="text-2xl mb-1">{s.emoji}</div>
              <div className="font-bold text-dark text-lg">{s.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl w-fit mb-6">
          {[
            { key: 'all', label: 'All' },
            { key: 'active', label: '🔴 Active' },
            { key: 'delivered', label: '✅ Delivered' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                filter === f.key ? 'bg-white text-dark shadow-sm' : 'text-gray-500 hover:text-dark'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">📭</div>
            <h3 className="font-semibold text-dark">No orders here</h3>
            <p className="text-gray-400 text-sm mt-1 mb-4">
              {filter === 'active' ? 'You have no active orders right now.' : 'No orders yet — start exploring!'}
            </p>
            <Link to="/listings" className="btn-primary text-sm">Browse Meals</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((order) => {
              const chef = chefs.find((c) => c.id === order.chefId)
              const isExpanded = expandedId === order.id
              const isActive = ACTIVE_STATUSES.includes(order.status)

              return (
                <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {/* Order header */}
                  <div
                    className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={chef?.avatar}
                        alt={chef?.name}
                        className="w-12 h-12 rounded-xl object-cover bg-gray-100 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold text-dark text-sm">{chef?.name || 'Chef'}</span>
                          <span className={`badge text-xs ${STATUS_COLOR[order.status] || 'bg-gray-100 text-gray-500'}`}>
                            {STATUS_LABEL[order.status] || order.status}
                          </span>
                          {isActive && (
                            <span className="flex items-center gap-1 text-xs text-orange-500 font-semibold">
                              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                              Live
                            </span>
                          )}
                          {order.scheduledFor && (
                            <span className="flex items-center gap-1 text-xs text-brand font-semibold bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                              ⏰ Scheduled
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                          {order.items.map((i) => `${i.name} ×${i.quantity}`).join(' · ')}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                          <span>#{order.id}</span>
                          <span>·</span>
                          <span>{new Date(order.placedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          <span>·</span>
                          <span className="font-semibold text-dark">৳{order.total}</span>
                        </div>
                      </div>
                      <svg className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 p-5 space-y-4 bg-gray-50">
                      {/* Items breakdown */}
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Items</p>
                        <div className="space-y-2">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex justify-between text-sm">
                              <span className="text-dark">{item.name} <span className="text-gray-400">×{item.quantity}</span></span>
                              <span className="font-medium text-dark">৳{item.price * item.quantity}</span>
                            </div>
                          ))}
                          <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-sm">
                            <span>Total</span>
                            <span className="text-brand">৳{order.total}</span>
                          </div>
                        </div>
                      </div>

                      {/* Delivery address */}
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Delivered to</p>
                        <p className="text-sm text-dark">{order.address}</p>
                      </div>

                      {/* Timestamps */}
                      <div className="flex gap-6 text-xs text-gray-400">
                        <span>📅 Placed: {new Date(order.placedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                        {order.scheduledFor && (
                          <span>⏰ Scheduled: {new Date(order.scheduledFor).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        )}
                        {order.deliveredAt && (
                          <span>✅ Delivered: {new Date(order.deliveredAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-3 pt-1">
                        {isActive && (
                          <Link
                            to={`/order-tracker/${order.id}`}
                            className="btn-primary text-sm py-2"
                          >
                            Track Order →
                          </Link>
                        )}
                        {order.status === 'delivered' && (
                          <button
                            onClick={() => handleReorder(order)}
                            className="btn-outline text-sm py-2"
                          >
                            🔄 Reorder
                          </button>
                        )}
                        <Link
                          to={`/chef/${order.chefId}`}
                          className="px-4 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 hover:border-brand hover:text-brand transition-all"
                        >
                          View Chef
                        </Link>
                      </div>
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
