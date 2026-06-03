import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import Toast from '../components/Toast'
import chefs from '../data/chefs.json'

const FREE_DELIVERY_THRESHOLD = 500

function getDeliveryFee(cartItems, selectedArea) {
  if (!cartItems.length) return 0
  if (!selectedArea) return 40
  const chef = chefs.find((c) => c.id === cartItems[0]?.chefId)
  const zoneDist = Math.abs((chef?.zone ?? 1) - (selectedArea.zone ?? 1))
  if (zoneDist === 0) return 30
  if (zoneDist === 1) return 50
  return 80
}

function getDeliveryLabel(cartItems, selectedArea) {
  if (!selectedArea) return null
  const chef = chefs.find((c) => c.id === cartItems[0]?.chefId)
  const zoneDist = Math.abs((chef?.zone ?? 1) - (selectedArea.zone ?? 1))
  if (zoneDist === 0) return { label: 'Same area', color: 'text-green-600' }
  if (zoneDist === 1) return { label: '1 zone away', color: 'text-blue-500' }
  return { label: '2+ zones away', color: 'text-orange-500' }
}

export default function Cart() {
  const { cartItems, removeFromCart, updateQuantity, clearCart, cartTotal, toast } = useCart()
  const { currentUser, selectedArea, changeArea } = useAuth()
  const navigate = useNavigate()

  const deliveryFee = getDeliveryFee(cartItems, selectedArea)
  const distanceInfo = getDeliveryLabel(cartItems, selectedArea)
  const grandTotal = cartTotal + deliveryFee

  // minOrder check — based on first cart item's chef
  const chef = chefs.find((c) => c.id === cartItems[0]?.chefId)
  const minOrder = chef?.minOrder ?? 0
  const belowMin = cartTotal < minOrder

  // Free delivery threshold
  const freeDeliveryAt = FREE_DELIVERY_THRESHOLD
  const toFreeDelivery = freeDeliveryAt - cartTotal
  const hasFreeDelivery = cartTotal >= freeDeliveryAt

  if (!currentUser) {
    return (
      <div className="page-wrapper flex items-center justify-center py-32">
        <div className="text-center">
          <div className="text-5xl mb-4">🛒</div>
          <h2 className="section-title">Please log in first</h2>
          <p className="text-gray-400 mt-2 text-sm">You need to be logged in to view your cart.</p>
          <Link to="/login" className="btn-primary mt-6 inline-block">Go to Login</Link>
        </div>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="page-wrapper flex items-center justify-center py-32">
        <div className="text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="section-title">Your cart is empty</h2>
          <p className="text-gray-400 mt-2 text-sm">Looks like you haven't added anything yet.</p>
          <Link to="/listings" className="btn-primary mt-6 inline-block">Browse Meals</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page-wrapper">
      <Toast message={toast?.message} type={toast?.type} />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="section-title">Your Cart</h1>
            <p className="text-gray-400 text-sm mt-1">{cartItems.length} item{cartItems.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={clearCart} className="text-sm text-red-400 hover:text-red-600 font-medium transition-colors">
            Clear cart
          </button>
        </div>

        {/* Free delivery progress banner */}
        {!hasFreeDelivery ? (
          <div className="mb-4 bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3 flex items-center gap-3">
            <span className="text-lg">🚀</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-dark">
                Add ৳{toFreeDelivery} more for <span className="text-brand">free delivery!</span>
              </p>
              <div className="mt-1.5 h-1.5 bg-orange-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand rounded-full transition-all"
                  style={{ width: `${Math.min(100, (cartTotal / freeDeliveryAt) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-4 bg-green-50 border border-green-100 rounded-2xl px-4 py-3 flex items-center gap-2">
            <span className="text-lg">🎉</span>
            <p className="text-sm font-semibold text-green-700">You've unlocked free delivery!</p>
          </div>
        )}

        {/* minOrder warning */}
        {belowMin && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-2xl px-4 py-3 flex items-center gap-3">
            <span className="text-lg">⚠️</span>
            <p className="text-sm text-yellow-800">
              <span className="font-semibold">{chef?.name}</span> has a minimum order of{' '}
              <span className="font-bold">৳{minOrder}</span>. Add ৳{minOrder - cartTotal} more to checkout.
            </p>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Cart Items */}
          <div className="flex-1 space-y-4">
            {cartItems.map((item) => {
              const itemPrice = item.effectivePrice ?? item.price
              return (
                <div key={item.cartKey || item.id} className="card p-4 flex gap-4">
                  {/* Image */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&q=80' }}
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-dark text-sm leading-snug">{item.name}</h3>
                        {item.selectedAddons && item.selectedAddons.length > 0 ? (
                          <div className="mt-1 space-y-0.5">
                            {item.selectedAddons.map((a) => (
                              <p key={a.id} className="text-xs text-brand flex items-center gap-1">
                                <span className="text-gray-300">+</span> {a.name}
                                <span className="text-gray-400">· ৳{a.price}</span>
                              </p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 mt-0.5">৳{item.price} base</p>
                        )}
                      </div>
                      <button
                        onClick={() => removeFromCart(item.cartKey || item.id)}
                        className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5"
                        title="Remove item"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {/* Quantity + Subtotal */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2 bg-gray-50 rounded-xl border border-gray-100 p-1">
                        <button
                          onClick={() => updateQuantity(item.cartKey || item.id, item.quantity - 1)}
                          className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:border-brand hover:text-brand transition-colors text-sm font-bold"
                        >−</button>
                        <span className="text-sm font-semibold text-dark w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.cartKey || item.id, item.quantity + 1)}
                          className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:border-brand hover:text-brand transition-colors text-sm font-bold"
                        >+</button>
                      </div>
                      <div className="text-right">
                        {item.selectedAddons?.length > 0 && (
                          <p className="text-xs text-gray-400">৳{itemPrice} × {item.quantity}</p>
                        )}
                        <span className="font-bold text-dark">৳{itemPrice * item.quantity}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            <Link to="/listings" className="inline-flex items-center gap-2 text-sm text-brand font-medium hover:underline mt-2">
              ← Continue Shopping
            </Link>
          </div>

          {/* Order Summary */}
          <div className="lg:w-80 flex-shrink-0">
            {selectedArea ? (
              <div className="mb-4 bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📍</span>
                  <div>
                    <p className="text-xs text-gray-500">Delivering to</p>
                    <p className="text-sm font-bold text-dark">{selectedArea.name}</p>
                    {distanceInfo && <p className={`text-xs font-medium mt-0.5 ${distanceInfo.color}`}>{distanceInfo.label}</p>}
                  </div>
                </div>
                <button onClick={changeArea} className="text-xs text-brand font-semibold hover:underline">Change</button>
              </div>
            ) : (
              <div className="mb-4 bg-yellow-50 border border-yellow-100 rounded-2xl p-4 flex items-center gap-3">
                <span className="text-lg">📍</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-dark">No area selected</p>
                  <p className="text-xs text-gray-400 mt-0.5">Select your area for accurate delivery fee</p>
                </div>
                <button onClick={changeArea} className="text-xs text-brand font-semibold hover:underline">Select</button>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-20">
              <h2 className="font-bold text-dark text-base mb-5">Order Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal ({cartItems.reduce((s, i) => s + i.quantity, 0)} items)</span>
                  <span className="text-dark font-medium">৳{cartTotal}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>
                    Delivery fee
                    {distanceInfo && <span className="ml-1 text-xs text-gray-400">({distanceInfo.label})</span>}
                  </span>
                  {hasFreeDelivery ? (
                    <span className="text-green-600 font-semibold">FREE 🎉</span>
                  ) : (
                    <span className="text-dark font-medium">৳{deliveryFee}</span>
                  )}
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-dark text-base">
                  <span>Total</span>
                  <span className="text-brand">৳{hasFreeDelivery ? cartTotal : grandTotal}</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                disabled={belowMin}
                className={`btn-primary w-full mt-6 py-3 text-base ${belowMin ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {belowMin ? `Min. order ৳${minOrder}` : 'Proceed to Checkout →'}
              </button>
              {belowMin && (
                <p className="text-xs text-center text-yellow-600 mt-2">Add ৳{minOrder - cartTotal} more to continue</p>
              )}
              <div className="mt-4 space-y-2 text-xs text-gray-400 text-center">
                <p>🔒 Secure checkout</p>
                <p>🚀 Fast delivery · 30–60 min avg</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
