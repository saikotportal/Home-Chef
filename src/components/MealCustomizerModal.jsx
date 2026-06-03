import { useState } from 'react'
import { useCart } from '../context/CartContext'

export default function MealCustomizerModal({ meal, onClose }) {
  const { addToCart } = useCart()
  const [selected, setSelected] = useState({}) // { addonId: true/false }

  const toggle = (addon) => {
    setSelected((prev) => ({ ...prev, [addon.id]: !prev[addon.id] }))
  }

  const selectedAddons = (meal.addons || []).filter((a) => selected[a.id])
  const addonTotal = selectedAddons.reduce((s, a) => s + a.price, 0)
  const total = meal.price + addonTotal

  const handleAdd = () => {
    addToCart(meal, selectedAddons)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl animate-slide-up overflow-hidden">

        {/* Meal image header */}
        <div className="relative h-44 overflow-hidden">
          <img
            src={meal.image}
            alt={meal.name}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 bg-white/90 hover:bg-white text-dark rounded-full w-8 h-8 flex items-center justify-center shadow transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="absolute bottom-3 left-4 right-4">
            <h2 className="text-white font-bold text-lg leading-tight">{meal.name}</h2>
            <p className="text-white/80 text-xs mt-0.5">Base price: ৳{meal.price}</p>
          </div>
        </div>

        <div className="p-5">
          {/* Addons section */}
          {meal.addons && meal.addons.length > 0 ? (
            <>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-bold text-dark">Customise Your Order</span>
                <span className="badge bg-orange-100 text-brand text-xs">Optional</span>
              </div>

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {meal.addons.map((addon) => {
                  const isOn = !!selected[addon.id]
                  return (
                    <button
                      key={addon.id}
                      onClick={() => toggle(addon)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all duration-150 text-left
                        ${isOn
                          ? 'border-brand bg-orange-50 shadow-sm'
                          : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Checkbox */}
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all
                          ${isOn ? 'bg-brand border-brand' : 'border-gray-300 bg-white'}`}
                        >
                          {isOn && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className={`text-sm font-medium ${isOn ? 'text-dark' : 'text-gray-600'}`}>
                          {addon.name}
                        </span>
                      </div>
                      <span className={`text-sm font-bold ${isOn ? 'text-brand' : 'text-gray-400'}`}>
                        +৳{addon.price}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Price breakdown */}
              <div className="mt-4 p-3 bg-gray-50 rounded-xl space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Base price</span>
                  <span>৳{meal.price}</span>
                </div>
                {selectedAddons.map((a) => (
                  <div key={a.id} className="flex justify-between text-brand">
                    <span>+ {a.name}</span>
                    <span>+৳{a.price}</span>
                  </div>
                ))}
                <div className="border-t border-gray-200 pt-1.5 flex justify-between font-bold text-dark">
                  <span>Total</span>
                  <span className="text-lg">৳{total}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="py-2 text-center text-gray-400 text-sm">
              No customisation options for this item.
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handleAdd}
            className="mt-4 w-full btn-primary flex items-center justify-center gap-2 py-3 text-base"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.5 6h13M7 13l-1-5h13" />
            </svg>
            Add to Cart · ৳{total}
          </button>
        </div>
      </div>
    </div>
  )
}
