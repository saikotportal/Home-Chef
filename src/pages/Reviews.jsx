import { useState, useEffect, useRef } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ordersData from '../data/orders.json'
import chefs from '../data/chefs.json'
import meals from '../data/meals.json'

const SEED_REVIEWS = [
  {
    id: 'r001', orderId: 'o001', customerId: 'u005', chefId: 'u001',
    mealId: 'm001', mealName: 'Shorshe Ilish', chefName: 'Rashida Begum',
    chefAvatar: 'https://images.unsplash.com/photo-1607631568010-a87245c0daf4?w=200&q=80',
    rating: 5, comment: 'Absolutely divine! The mustard gravy was perfectly balanced — not too sharp, not too mild. Felt just like my grandmother used to make. Will definitely order again.',
    createdAt: '2026-05-30T12:00:00Z', helpful: 4, photos: [],
  },
  {
    id: 'r002', orderId: 'o001', customerId: 'u005', chefId: 'u001',
    mealId: 'm003', mealName: 'Beef Bhuna', chefName: 'Rashida Begum',
    chefAvatar: 'https://images.unsplash.com/photo-1607631568010-a87245c0daf4?w=200&q=80',
    rating: 4, comment: 'Rich, hearty and very well spiced. The beef was tender and the dry gravy clung to every piece. Would pair perfectly with lachha paratha.',
    createdAt: '2026-05-30T12:05:00Z', helpful: 2, photos: [],
  },
]

const STAR_LABELS = ['', 'Terrible', 'Poor', 'Okay', 'Good', 'Excellent']

function StarInput({ value, onChange }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button" onClick={() => onChange(star)} onMouseEnter={() => setHovered(star)} onMouseLeave={() => setHovered(0)} className="text-3xl transition-transform hover:scale-110">
          <span className={(hovered || value) >= star ? 'text-yellow-400' : 'text-gray-200'}>★</span>
        </button>
      ))}
      {(hovered || value) > 0 && (
        <span className="ml-2 text-sm font-semibold text-gray-500 self-center">{STAR_LABELS[hovered || value]}</span>
      )}
    </div>
  )
}

function StarDisplay({ rating, size = 'sm' }) {
  const sz = size === 'lg' ? 'text-xl' : 'text-sm'
  return (
    <span className={sz}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}>★</span>
      ))}
    </span>
  )
}

// ── Photo Upload Component ─────────────────────────────────────
function PhotoUpload({ photos, onChange }) {
  const fileRef = useRef(null)
  const MAX = 3

  const handleFiles = (files) => {
    const remaining = MAX - photos.length
    const toProcess = Array.from(files).slice(0, remaining)
    toProcess.forEach((file) => {
      if (!file.type.startsWith('image/')) return
      const reader = new FileReader()
      reader.onload = (e) => {
        onChange((prev) => [...prev, { id: Date.now() + Math.random(), dataUrl: e.target.result }])
      }
      reader.readAsDataURL(file)
    })
  }

  const removePhoto = (id) => onChange((prev) => prev.filter((p) => p.id !== id))

  return (
    <div>
      <label className="text-sm font-semibold text-dark block mb-2">
        Photos <span className="text-gray-400 font-normal">(optional, up to {MAX})</span>
      </label>
      <div className="flex gap-3 flex-wrap">
        {photos.map((p) => (
          <div key={p.id} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0">
            <img src={p.dataUrl} alt="review" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removePhoto(p.id)}
              className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white text-xs hover:bg-black/80 transition-colors"
            >×</button>
          </div>
        ))}
        {photos.length < MAX && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-brand hover:text-brand transition-all"
          >
            <span className="text-2xl">📷</span>
            <span className="text-xs font-medium">Add</span>
          </button>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}

const STORAGE_KEY = (id) => `hcm_reviews_${id}`

export default function Reviews() {
  const { currentUser } = useAuth()
  const [reviews, setReviews] = useState([])
  const [tab, setTab] = useState('mine')
  const [pendingOrders, setPendingOrders] = useState([])

  const [selectedOrder, setSelectedOrder] = useState(null)
  const [selectedMealId, setSelectedMealId] = useState('')
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [photos, setPhotos] = useState([])
  const [submitMsg, setSubmitMsg] = useState('')
  const [lightbox, setLightbox] = useState(null) // { src }

  useEffect(() => {
    if (!currentUser) return
    const key = STORAGE_KEY(currentUser.id)
    const stored = localStorage.getItem(key)
    if (stored) {
      setReviews(JSON.parse(stored))
    } else {
      const seed = SEED_REVIEWS.filter((r) => r.customerId === currentUser.id)
      localStorage.setItem(key, JSON.stringify(seed))
      setReviews(seed)
    }
    const storedOrders = JSON.parse(localStorage.getItem('hcm_orders') || '[]')
    const seedForUser = ordersData.filter((o) => o.customerId === currentUser.id)
    const ids = new Set(storedOrders.map((o) => o.id))
    const allOrders = [...storedOrders, ...seedForUser.filter((o) => !ids.has(o.id))]
    setPendingOrders(allOrders.filter((o) => o.status === 'delivered'))
  }, [currentUser])

  if (!currentUser) return <Navigate to="/login" replace />

  const save = (updated) => {
    setReviews(updated)
    localStorage.setItem(STORAGE_KEY(currentUser.id), JSON.stringify(updated))
  }

  const markHelpful = (id) => save(reviews.map((r) => r.id === id ? { ...r, helpful: (r.helpful || 0) + 1 } : r))
  const deleteReview = (id) => save(reviews.filter((r) => r.id !== id))

  const handleSubmit = () => {
    if (!selectedOrder || !selectedMealId || rating === 0) { setSubmitMsg('Please select a meal and rating.'); return }
    if (comment.trim().length < 10) { setSubmitMsg('Please write at least 10 characters.'); return }
    const chef = chefs.find((c) => c.id === selectedOrder.chefId)
    const meal = meals.find((m) => m.id === selectedMealId)
    const newReview = {
      id: `r_${Date.now()}`,
      orderId: selectedOrder.id,
      customerId: currentUser.id,
      chefId: selectedOrder.chefId,
      mealId: selectedMealId,
      mealName: meal?.name || 'Meal',
      chefName: chef?.name || 'Chef',
      chefAvatar: chef?.avatar || '',
      rating,
      comment: comment.trim(),
      createdAt: new Date().toISOString(),
      helpful: 0,
      photos: photos.map((p) => p.dataUrl),
    }
    save([newReview, ...reviews])
    setSelectedOrder(null)
    setSelectedMealId('')
    setRating(0)
    setComment('')
    setPhotos([])
    setSubmitMsg('✅ Review submitted! Thank you.')
    setTab('mine')
  }

  const allReviews = [...SEED_REVIEWS, ...reviews.filter((r) => !SEED_REVIEWS.find((s) => s.id === r.id))]
  const chefStats = chefs.map((chef) => {
    const chefRevs = allReviews.filter((r) => r.chefId === chef.id)
    const avg = chefRevs.length ? (chefRevs.reduce((s, r) => s + r.rating, 0) / chefRevs.length).toFixed(1) : null
    return { chef, reviews: chefRevs, avg }
  })

  return (
    <div className="page-wrapper">
      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setLightbox(null)}>
          <img src={lightbox.src} alt="review" className="max-w-full max-h-full rounded-2xl object-contain shadow-2xl" />
          <button className="absolute top-4 right-4 text-white text-3xl font-bold hover:text-gray-300">×</button>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="section-title mb-1">Ratings & Reviews</h1>
        <p className="text-gray-400 text-sm mb-6">Share your experience with the community</p>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl w-fit mb-6">
          {[
            { key: 'mine', label: '⭐ My Reviews' },
            { key: 'write', label: '✏️ Write Review' },
            { key: 'browse', label: '🔍 Browse' },
          ].map((t) => (
            <button key={t.key} onClick={() => { setTab(t.key); setSubmitMsg('') }} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === t.key ? 'bg-white text-dark shadow-sm' : 'text-gray-500 hover:text-dark'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* My Reviews */}
        {tab === 'mine' && (
          <>
            {reviews.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-3">⭐</div>
                <h3 className="font-semibold text-dark">No reviews yet</h3>
                <p className="text-gray-400 text-sm mt-1 mb-4">Order and enjoy a meal, then share your thoughts!</p>
                <button onClick={() => setTab('write')} className="btn-primary text-sm">Write First Review</button>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <img src={r.chefAvatar} alt={r.chefName} className="w-10 h-10 rounded-xl object-cover bg-gray-100 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-semibold text-dark text-sm">{r.mealName}</p>
                        <p className="text-xs text-gray-400">by {r.chefName}</p>
                      </div>
                      <button onClick={() => deleteReview(r.id)} className="text-xs text-gray-300 hover:text-red-400 transition-colors">Delete</button>
                    </div>
                    <StarDisplay rating={r.rating} size="lg" />
                    <p className="text-sm text-gray-600 mt-2 leading-relaxed">{r.comment}</p>
                    {/* Photo thumbnails */}
                    {r.photos?.length > 0 && (
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {r.photos.map((src, i) => (
                          <button key={i} onClick={() => setLightbox({ src })} className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0 hover:opacity-80 transition-opacity">
                            <img src={src} alt="review photo" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                      <span>{new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      <span>·</span>
                      <button onClick={() => markHelpful(r.id)} className="hover:text-brand transition-colors">👍 {r.helpful || 0} helpful</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Write Review */}
        {tab === 'write' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            <h2 className="font-bold text-dark">Write a Review</h2>

            <div>
              <label className="text-sm font-semibold text-dark block mb-2">Select a delivered order</label>
              <div className="space-y-2">
                {pendingOrders.length === 0 ? (
                  <p className="text-sm text-gray-400">No delivered orders found. <Link to="/listings" className="text-brand font-semibold">Order first →</Link></p>
                ) : (
                  pendingOrders.map((order) => {
                    const chef = chefs.find((c) => c.id === order.chefId)
                    const isSelected = selectedOrder?.id === order.id
                    return (
                      <button key={order.id} type="button" onClick={() => { setSelectedOrder(order); setSelectedMealId('') }} className={`w-full text-left flex items-center gap-3 p-3 rounded-xl border transition-all ${isSelected ? 'border-brand bg-orange-50' : 'border-gray-200 hover:border-brand'}`}>
                        <img src={chef?.avatar} alt={chef?.name} className="w-9 h-9 rounded-lg object-cover bg-gray-100 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-dark">{chef?.name}</p>
                          <p className="text-xs text-gray-400 truncate">{order.items.map((i) => i.name).join(', ')}</p>
                        </div>
                        {isSelected && <span className="text-brand text-lg">✓</span>}
                      </button>
                    )
                  })
                )}
              </div>
            </div>

            {selectedOrder && (
              <div>
                <label className="text-sm font-semibold text-dark block mb-2">Which meal are you reviewing?</label>
                <div className="flex flex-wrap gap-2">
                  {selectedOrder.items.map((item) => (
                    <button key={item.mealId} type="button" onClick={() => setSelectedMealId(item.mealId)} className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${selectedMealId === item.mealId ? 'bg-brand text-white border-brand' : 'bg-white text-gray-600 border-gray-200 hover:border-brand'}`}>
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedMealId && (
              <div>
                <label className="text-sm font-semibold text-dark block mb-2">Your rating</label>
                <StarInput value={rating} onChange={setRating} />
              </div>
            )}

            {rating > 0 && (
              <>
                <div>
                  <label className="text-sm font-semibold text-dark block mb-2">Your review</label>
                  <textarea
                    className="input resize-none h-28 text-sm"
                    placeholder="Tell others what you thought about the food, taste, portion size, packaging…"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                  <p className="text-xs text-gray-400 mt-1">{comment.length}/500 characters</p>
                </div>

                {/* Photo upload */}
                <PhotoUpload photos={photos} onChange={setPhotos} />
              </>
            )}

            {submitMsg && (
              <p className={`text-sm font-semibold ${submitMsg.startsWith('✅') ? 'text-green-600' : 'text-red-500'}`}>{submitMsg}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={!selectedOrder || !selectedMealId || rating === 0 || comment.trim().length < 10}
              className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Submit Review
            </button>
          </div>
        )}

        {/* Browse */}
        {tab === 'browse' && (
          <div className="space-y-4">
            {chefStats.map(({ chef, reviews: chefRevs, avg }) => (
              <div key={chef.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-4 mb-4">
                  <img src={chef.avatar} alt={chef.name} className="w-12 h-12 rounded-xl object-cover bg-gray-100" />
                  <div className="flex-1">
                    <Link to={`/chef/${chef.id}`} className="font-bold text-dark hover:text-brand transition-colors">{chef.name}</Link>
                    <p className="text-xs text-gray-400">{chef.specialty}</p>
                  </div>
                  {avg ? (
                    <div className="text-right">
                      <div className="text-2xl font-bold text-dark">{avg}</div>
                      <StarDisplay rating={parseFloat(avg)} />
                      <p className="text-xs text-gray-400">{chefRevs.length} review{chefRevs.length !== 1 ? 's' : ''}</p>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">No reviews yet</span>
                  )}
                </div>
                {chefRevs.length > 0 && (
                  <div className="space-y-3 border-t border-gray-100 pt-4">
                    {chefRevs.slice(0, 2).map((r) => (
                      <div key={r.id} className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <StarDisplay rating={r.rating} />
                          <span className="text-xs text-gray-400">{r.mealName}</span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">{r.comment}</p>
                        {r.photos?.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {r.photos.map((src, i) => (
                              <button key={i} onClick={() => setLightbox({ src })} className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 hover:opacity-80 transition-opacity">
                                <img src={src} alt="review" className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {chefRevs.length > 2 && (
                      <p className="text-xs text-brand font-semibold text-center">+{chefRevs.length - 2} more reviews</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
