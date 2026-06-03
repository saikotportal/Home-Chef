import { useState, useEffect, useRef } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useFavorites } from '../context/FavoritesContext'
import meals from '../data/meals.json'
import chefs from '../data/chefs.json'
import MealCard from '../components/MealCard'

const ADDRESS_LABELS = ['Home', 'Work', 'Other']
const TABS = ['Overview', 'Saved', 'Addresses', 'Orders']

function StampCard({ stamps }) {
  const total = 10
  return (
    <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-bold text-dark text-sm">Loyalty Stamps</h3>
          <p className="text-xs text-gray-400 mt-0.5">Collect 10 stamps → get ৳100 reward</p>
        </div>
        <span className="text-2xl">🎟️</span>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`aspect-square rounded-xl flex items-center justify-center text-lg border-2 transition-all ${
              i < stamps
                ? 'bg-brand border-brand text-white shadow-sm'
                : 'bg-white border-orange-100 text-gray-200'
            }`}
          >
            {i < stamps ? '🍳' : '○'}
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-3 text-center">
        {stamps < total
          ? `${total - stamps} more stamp${total - stamps !== 1 ? 's' : ''} until your next reward`
          : '🎉 Reward ready!'}
      </p>
    </div>
  )
}

function ReferralCard({ code, onApply }) {
  const [copied, setCopied] = useState(false)
  const [refInput, setRefInput] = useState('')
  const [refMsg, setRefMsg] = useState(null)

  const copyCode = () => {
    navigator.clipboard.writeText(code).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleApply = () => {
    if (!refInput.trim()) return
    const result = onApply(refInput.trim())
    setRefMsg(result)
    if (result.success) setRefInput('')
    setTimeout(() => setRefMsg(null), 3000)
  }

  return (
    <div className="bg-purple-50 border border-purple-100 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🎁</span>
        <div>
          <h3 className="font-bold text-dark text-sm">Referral Program</h3>
          <p className="text-xs text-gray-400 mt-0.5">Share & earn ৳50 each when a friend orders</p>
        </div>
      </div>

      {/* Your code */}
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-1.5">Your referral code</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-white border border-purple-200 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-purple-700 tracking-widest">
            {code}
          </div>
          <button
            onClick={copyCode}
            className="flex-shrink-0 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Enter a friend's code */}
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-1.5">Have a friend's code? Enter it below</p>
        <div className="flex items-center gap-2">
          <input
            className="input flex-1 text-sm font-mono uppercase"
            placeholder="e.g. HC1A2B3C"
            value={refInput}
            onChange={(e) => setRefInput(e.target.value.toUpperCase())}
            maxLength={8}
          />
          <button
            onClick={handleApply}
            className="flex-shrink-0 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            Apply
          </button>
        </div>
        {refMsg && (
          <p className={`text-xs mt-1.5 font-medium ${refMsg.success ? 'text-green-600' : 'text-red-500'}`}>
            {refMsg.success ? '🎉 ৳50 added to your wallet!' : refMsg.message}
          </p>
        )}
      </div>
    </div>
  )
}

function ProCard({ isPro, onToggle }) {
  const [confirm, setConfirm] = useState(false)

  const handleClick = () => {
    if (!confirm) { setConfirm(true); return }
    onToggle()
    setConfirm(false)
  }

  return (
    <div className={`rounded-2xl p-5 border ${isPro ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-100'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{isPro ? '⭐' : '🔓'}</span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-dark text-sm">HomeChef Pro</h3>
              {isPro && (
                <span className="text-xs bg-yellow-400 text-yellow-900 font-bold px-2 py-0.5 rounded-full">ACTIVE</span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {isPro ? 'Free delivery on all orders · Pro badge' : '৳199/month · Free delivery on all orders'}
            </p>
          </div>
        </div>
        <button
          onClick={handleClick}
          className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all ${
            isPro
              ? confirm
                ? 'bg-red-500 text-white'
                : 'bg-white border border-red-200 text-red-500 hover:border-red-400'
              : 'bg-brand text-white hover:bg-brand-dark'
          }`}
        >
          {isPro
            ? confirm ? 'Confirm cancel?' : 'Cancel'
            : 'Subscribe ৳199/mo'}
        </button>
      </div>
    </div>
  )
}

export default function Profile() {
  const { currentUser, selectedArea, changeArea, logout, wallet, stamps, isPro, applyReferral, getReferralCode, togglePro } = useAuth()
  const { favorites, toggleMeal, toggleChef } = useFavorites()

  const storageKey = currentUser ? `hcm_addresses_${currentUser.id}` : null

  const [activeTab, setActiveTab] = useState('Overview')
  const [addresses, setAddresses] = useState(() => {
    if (!storageKey) return []
    try { return JSON.parse(localStorage.getItem(storageKey) || '[]') } catch { return [] }
  })
  const [orders, setOrders] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editIndex, setEditIndex] = useState(null)
  const [addrForm, setAddrForm] = useState({ label: 'Home', text: '' })
  const [addrError, setAddrError] = useState('')

  useEffect(() => {
    try {
      const all = JSON.parse(localStorage.getItem('hcm_orders') || '[]')
      const mine = all.filter((o) => o.customerId === currentUser?.id)
      setOrders(mine.reverse())
    } catch { setOrders([]) }
  }, [currentUser])

  if (!currentUser) return <Navigate to="/login" replace />

  const saveAddresses = (updated) => {
    setAddresses(updated)
    localStorage.setItem(storageKey, JSON.stringify(updated))
  }

  const openAdd = () => {
    setAddrForm({ label: 'Home', text: '' })
    setAddrError('')
    setEditIndex(null)
    setShowAddForm(true)
  }

  const openEdit = (i) => {
    setAddrForm({ ...addresses[i] })
    setAddrError('')
    setEditIndex(i)
    setShowAddForm(true)
  }

  const handleSaveAddr = () => {
    if (!addrForm.text.trim()) { setAddrError('Address cannot be empty'); return }
    if (editIndex !== null) {
      saveAddresses(addresses.map((a, i) => i === editIndex ? addrForm : a))
    } else {
      saveAddresses([...addresses, addrForm])
    }
    setShowAddForm(false)
    setEditIndex(null)
  }

  const handleDeleteAddr = (i) => {
    saveAddresses(addresses.filter((_, idx) => idx !== i))
  }

  const roleColor = {
    customer: 'bg-blue-100 text-blue-700',
    chef: 'bg-orange-100 text-orange-700',
    rider: 'bg-green-100 text-green-700',
  }

  const statusColor = {
    confirmed: 'bg-yellow-100 text-yellow-700',
    preparing: 'bg-orange-100 text-orange-700',
    picked_up: 'bg-blue-100 text-blue-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-600',
  }

  const favMeals = meals.filter((m) => favorites.meals.includes(m.id))
  const favChefs = chefs.filter((c) => favorites.chefs.includes(c.id))

  const tabsForRole = currentUser.role === 'customer' ? TABS : ['Overview', 'Addresses']
  const referralCode = getReferralCode()

  return (
    <div className="page-wrapper">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* ── Avatar + Info ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-5">
            <div className="relative flex-shrink-0">
              <img
                src={currentUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=FF6B35&color=fff&size=80`}
                alt={currentUser.name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-gray-100"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=FF6B35&color=fff&size=80`
                }}
              />
              <span className={`absolute -bottom-1 -right-1 text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${roleColor[currentUser.role] || 'bg-gray-100 text-gray-600'}`}>
                {currentUser.role}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-dark truncate">{currentUser.name}</h1>
                {isPro && (
                  <span className="text-xs bg-yellow-400 text-yellow-900 font-bold px-2 py-0.5 rounded-full flex-shrink-0">⭐ PRO</span>
                )}
              </div>
              <p className="text-sm text-gray-400 mt-0.5 truncate">{currentUser.email}</p>
              <p className="text-xs text-gray-300 mt-1">ID: {currentUser.id}</p>
            </div>
            <button
              onClick={logout}
              className="flex-shrink-0 text-sm text-red-400 hover:text-red-600 font-medium transition-colors border border-red-100 hover:border-red-300 rounded-xl px-3 py-1.5"
            >
              Logout
            </button>
          </div>

          {/* Stats pills */}
          {currentUser.role === 'customer' && (
            <div className="flex gap-3 mt-5 pt-5 border-t border-gray-100">
              <div className="flex-1 bg-orange-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-brand">{orders.length}</p>
                <p className="text-xs text-gray-400 mt-0.5">Orders</p>
              </div>
              <div className="flex-1 bg-green-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-green-600">৳{wallet}</p>
                <p className="text-xs text-gray-400 mt-0.5">Wallet</p>
              </div>
              <div className="flex-1 bg-orange-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-brand">{stamps}/10</p>
                <p className="text-xs text-gray-400 mt-0.5">Stamps</p>
              </div>
              <div className="flex-1 bg-red-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-red-500">{favMeals.length}</p>
                <p className="text-xs text-gray-400 mt-0.5">Saved</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Tab Bar ── */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {tabsForRole.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                activeTab === tab
                  ? 'bg-white text-dark shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab === 'Saved' ? `❤️ ${tab}` : tab}
            </button>
          ))}
        </div>

        {/* ── Overview Tab ── */}
        {activeTab === 'Overview' && (
          <div className="space-y-4">
            {/* Delivery Area */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h2 className="font-bold text-dark">Delivery Area</h2>
              <div className="flex items-center justify-between">
                {selectedArea ? (
                  <div className="flex items-center gap-3 bg-blue-50 rounded-xl px-4 py-3 flex-1">
                    <span className="text-xl">📍</span>
                    <div>
                      <p className="font-semibold text-dark text-sm">{selectedArea.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{selectedArea.city} · Zone {selectedArea.zone}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-100 rounded-xl px-4 py-3 flex-1">
                    <span className="text-xl">📍</span>
                    <p className="text-sm text-gray-500">No area selected</p>
                  </div>
                )}
                <button onClick={changeArea} className="ml-3 text-sm text-brand font-semibold hover:underline flex-shrink-0">
                  {selectedArea ? 'Change' : 'Select'}
                </button>
              </div>
            </div>

            {/* Loyalty + Referral + Pro — customers only */}
            {currentUser.role === 'customer' && (
              <>
                <StampCard stamps={stamps} />
                <ReferralCard code={referralCode} onApply={applyReferral} />
                <ProCard isPro={isPro} onToggle={togglePro} />
              </>
            )}
          </div>
        )}

        {/* ── Saved Tab ── */}
        {activeTab === 'Saved' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-dark mb-4">❤️ Saved Meals <span className="text-gray-400 font-normal text-sm">({favMeals.length})</span></h2>
              {favMeals.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-3xl mb-2">🍽️</p>
                  <p className="text-sm text-gray-400">No saved meals yet</p>
                  <Link to="/listings" className="mt-3 text-sm text-brand font-semibold hover:underline inline-block">Browse meals →</Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {favMeals.map((meal) => <MealCard key={meal.id} meal={meal} />)}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-dark mb-4">👨‍🍳 Saved Chefs <span className="text-gray-400 font-normal text-sm">({favChefs.length})</span></h2>
              {favChefs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-3xl mb-2">👨‍🍳</p>
                  <p className="text-sm text-gray-400">No saved chefs yet</p>
                  <Link to="/chefs" className="mt-3 text-sm text-brand font-semibold hover:underline inline-block">Browse chefs →</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {favChefs.map((chef) => (
                    <div key={chef.id} className="flex items-center gap-4 bg-gray-50 rounded-xl p-4 group">
                      <img src={chef.avatar} alt={chef.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-gray-100"
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1607631568010-a87245c0daf4?w=200&q=80' }} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-dark text-sm truncate">{chef.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{chef.specialty}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                          <span>⭐ {chef.rating}</span><span>·</span><span>📍 {chef.location}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Link to={`/chef/${chef.id}`} className="text-xs text-brand font-semibold border border-brand/30 hover:border-brand px-3 py-1.5 rounded-lg transition-colors">View</Link>
                        <button onClick={() => toggleChef(chef.id)} className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors border border-red-100 hover:border-red-300 px-3 py-1.5 rounded-lg">Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Addresses Tab ── */}
        {activeTab === 'Addresses' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-dark">Saved Addresses</h2>
              {!showAddForm && (
                <button onClick={openAdd} className="text-sm text-brand font-semibold hover:underline flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Add new
                </button>
              )}
            </div>

            {showAddForm && (
              <div className="mb-4 bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
                <p className="text-sm font-semibold text-dark">{editIndex !== null ? 'Edit Address' : 'New Address'}</p>
                <div className="flex gap-2">
                  {ADDRESS_LABELS.map((lbl) => (
                    <button key={lbl} onClick={() => setAddrForm((p) => ({ ...p, label: lbl }))}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${addrForm.label === lbl ? 'bg-brand text-white border-brand' : 'bg-white text-gray-500 border-gray-200 hover:border-brand'}`}>
                      {lbl}
                    </button>
                  ))}
                </div>
                <textarea className="input resize-none h-20 text-sm" placeholder="House no, Road no, Area, City…"
                  value={addrForm.text} onChange={(e) => { setAddrForm((p) => ({ ...p, text: e.target.value })); setAddrError('') }} />
                {addrError && <p className="text-red-400 text-xs">{addrError}</p>}
                <div className="flex gap-2">
                  <button onClick={handleSaveAddr} className="btn-primary px-5 py-2 text-sm">Save</button>
                  <button onClick={() => { setShowAddForm(false); setEditIndex(null) }} className="px-5 py-2 text-sm rounded-xl border border-gray-200 text-gray-500 hover:border-gray-300 transition-colors">Cancel</button>
                </div>
              </div>
            )}

            {addresses.length === 0 && !showAddForm && (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">🏠</p>
                <p className="text-sm text-gray-400">No saved addresses yet</p>
                <button onClick={openAdd} className="mt-3 text-sm text-brand font-semibold hover:underline">Add your first address</button>
              </div>
            )}

            {addresses.length > 0 && (
              <div className="space-y-3">
                {addresses.map((addr, i) => (
                  <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
                    <div className="flex-shrink-0 mt-0.5">
                      <span className="text-lg">{addr.label === 'Home' ? '🏠' : addr.label === 'Work' ? '💼' : '📌'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-brand uppercase tracking-wide">{addr.label}</p>
                      <p className="text-sm text-dark mt-0.5 leading-snug">{addr.text}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => openEdit(i)} className="text-xs text-gray-400 hover:text-brand font-medium transition-colors">Edit</button>
                      <button onClick={() => handleDeleteAddr(i)} className="text-xs text-gray-400 hover:text-red-500 font-medium transition-colors">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Orders Tab ── */}
        {activeTab === 'Orders' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-dark mb-4">Order History</h2>
            {orders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">📦</p>
                <p className="text-sm text-gray-400">No orders yet</p>
                <Link to="/listings" className="mt-3 text-sm text-brand font-semibold hover:underline inline-block">Browse meals →</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <Link key={order.id} to={`/order-tracker/${order.id}`}
                    className="flex items-center gap-4 bg-gray-50 hover:bg-gray-100 rounded-xl p-4 transition-colors group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs font-mono text-gray-400">#{order.id.slice(-6)}</p>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${statusColor[order.status] || 'bg-gray-100 text-gray-500'}`}>
                          {order.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-dark truncate">{order.items.map((i) => i.name).join(', ')}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(order.placedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {' · '}
                        {order.items.reduce((s, i) => s + i.quantity, 0)} item{order.items.reduce((s, i) => s + i.quantity, 0) !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-bold text-dark text-sm">৳{order.total}</span>
                      <svg className="w-4 h-4 text-gray-300 group-hover:text-brand transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
