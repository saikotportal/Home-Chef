import { useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Seed notifications — in a real app this would come from a backend
function generateSeedNotifications(userId) {
  const now = new Date()
  const mins = (m) => new Date(now - m * 60 * 1000).toISOString()
  const hrs  = (h) => new Date(now - h * 3600 * 1000).toISOString()
  const days = (d) => new Date(now - d * 86400 * 1000).toISOString()

  return [
    {
      id: 'n001',
      type: 'order',
      title: 'Order Delivered! 🎉',
      message: 'Your Shorshe Ilish & Beef Bhuna from Rashida Begum has been delivered. Enjoy your meal!',
      link: '/order-tracker/o001',
      read: false,
      createdAt: mins(8),
    },
    {
      id: 'n002',
      type: 'order',
      title: 'Rider picked up your order 🛵',
      message: 'Rakib Islam is on the way with your Kacchi Biryani from Karim Mia.',
      link: '/order-tracker/o002',
      read: false,
      createdAt: mins(22),
    },
    {
      id: 'n003',
      type: 'promo',
      title: '🎁 Exclusive offer just for you!',
      message: 'Use code HOMECHEF20 to get 20% off your next order. Valid today only!',
      link: '/listings',
      read: false,
      createdAt: hrs(2),
    },
    {
      id: 'n004',
      type: 'chef',
      title: 'Karim Mia added new items 👨‍🍳',
      message: 'Chef Karim has added Beef Kala Bhuna back to the menu — grab it before it sells out!',
      link: '/chef/u002',
      read: true,
      createdAt: hrs(5),
    },
    {
      id: 'n005',
      type: 'order',
      title: 'Order is being prepared 🍳',
      message: 'Rashida Begum has started cooking your Chingri Malai Curry & Vegetable Khichuri.',
      link: '/order-tracker/o003',
      read: true,
      createdAt: hrs(6),
    },
    {
      id: 'n006',
      type: 'promo',
      title: '🆓 Free delivery this weekend!',
      message: 'No delivery charges on all orders above ৳200 this Saturday and Sunday.',
      link: '/listings',
      read: true,
      createdAt: days(1),
    },
    {
      id: 'n007',
      type: 'system',
      title: 'Welcome to HomeChef! 🏠',
      message: 'Discover authentic homemade meals from talented chefs in your community. Set your area to get started.',
      link: '/',
      read: true,
      createdAt: days(3),
    },
  ]
}

const TYPE_ICON = {
  order:  { emoji: '📦', bg: 'bg-blue-50',   color: 'text-blue-600' },
  promo:  { emoji: '🎁', bg: 'bg-orange-50', color: 'text-brand' },
  chef:   { emoji: '👨‍🍳', bg: 'bg-green-50',  color: 'text-green-600' },
  system: { emoji: '🔔', bg: 'bg-gray-50',   color: 'text-gray-600' },
}

function timeAgo(isoStr) {
  const diff = (Date.now() - new Date(isoStr)) / 1000
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

const STORAGE_KEY = (id) => `hcm_notifications_${id}`

export default function Notifications() {
  const { currentUser } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [filter, setFilter] = useState('all') // 'all' | 'unread' | 'orders' | 'promos'

  useEffect(() => {
    if (!currentUser) return
    const key = STORAGE_KEY(currentUser.id)
    const stored = localStorage.getItem(key)
    if (stored) {
      setNotifications(JSON.parse(stored))
    } else {
      const seed = generateSeedNotifications(currentUser.id)
      localStorage.setItem(key, JSON.stringify(seed))
      setNotifications(seed)
    }
  }, [currentUser])

  if (!currentUser) return <Navigate to="/login" replace />

  const save = (updated) => {
    setNotifications(updated)
    localStorage.setItem(STORAGE_KEY(currentUser.id), JSON.stringify(updated))
  }

  const markRead = (id) => {
    save(notifications.map((n) => n.id === id ? { ...n, read: true } : n))
  }

  const markAllRead = () => {
    save(notifications.map((n) => ({ ...n, read: true })))
  }

  const deleteNotif = (id) => {
    save(notifications.filter((n) => n.id !== id))
  }

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.read
    if (filter === 'orders') return n.type === 'order'
    if (filter === 'promos') return n.type === 'promo'
    return true
  })

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="page-wrapper">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="section-title">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-brand font-semibold mt-0.5">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-sm text-brand font-semibold hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl w-fit mb-6 flex-wrap">
          {[
            { key: 'all', label: 'All' },
            { key: 'unread', label: `Unread${unreadCount ? ` (${unreadCount})` : ''}` },
            { key: 'orders', label: '📦 Orders' },
            { key: 'promos', label: '🎁 Promos' },
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

        {/* List */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">🔔</div>
            <h3 className="font-semibold text-dark">All caught up!</h3>
            <p className="text-gray-400 text-sm mt-1">No {filter !== 'all' ? filter + ' ' : ''}notifications yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((n) => {
              const meta = TYPE_ICON[n.type] || TYPE_ICON.system
              return (
                <div
                  key={n.id}
                  className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                    !n.read ? 'border-orange-200' : 'border-gray-100'
                  }`}
                >
                  <div className="flex items-start gap-4 p-4">
                    {/* Icon */}
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${meta.bg}`}>
                      {meta.emoji}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-semibold ${!n.read ? 'text-dark' : 'text-gray-600'}`}>
                          {n.title}
                          {!n.read && <span className="ml-2 inline-block w-2 h-2 bg-brand rounded-full align-middle" />}
                        </p>
                        <button
                          onClick={() => deleteNotif(n.id)}
                          className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5 leading-snug">{n.message}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-gray-400">{timeAgo(n.createdAt)}</span>
                        {n.link && (
                          <Link
                            to={n.link}
                            onClick={() => markRead(n.id)}
                            className="text-xs text-brand font-semibold hover:underline"
                          >
                            View →
                          </Link>
                        )}
                        {!n.read && (
                          <button
                            onClick={() => markRead(n.id)}
                            className="text-xs text-gray-400 hover:text-dark transition-colors"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {notifications.length > 0 && filtered.length > 0 && (
          <button
            onClick={() => save([])}
            className="mt-6 w-full py-3 text-sm text-gray-400 hover:text-red-400 transition-colors border border-dashed border-gray-200 rounded-2xl hover:border-red-200"
          >
            Clear all notifications
          </button>
        )}
      </div>
    </div>
  )
}
