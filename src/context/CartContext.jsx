import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([])
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem('hcm_cart')
    if (stored) setCartItems(JSON.parse(stored))
  }, [])

  const saveCart = (items) => {
    setCartItems(items)
    localStorage.setItem('hcm_cart', JSON.stringify(items))
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // addons: array of { id, name, price }
  const addToCart = (meal, selectedAddons = []) => {
    const addonTotal = selectedAddons.reduce((s, a) => s + a.price, 0)
    const effectivePrice = meal.price + addonTotal

    // Each unique combo of meal + addons gets its own cart key
    const cartKey = meal.id + (selectedAddons.length ? '_' + selectedAddons.map(a => a.id).sort().join('-') : '')
    const existing = cartItems.find((i) => i.cartKey === cartKey)

    let updated
    if (existing) {
      updated = cartItems.map((i) =>
        i.cartKey === cartKey ? { ...i, quantity: i.quantity + 1 } : i
      )
    } else {
      updated = [
        ...cartItems,
        {
          ...meal,
          cartKey,
          quantity: 1,
          selectedAddons,
          effectivePrice,
        },
      ]
    }
    saveCart(updated)
    showToast(`${meal.name} added to cart!`)
  }

  const removeFromCart = (cartKey) => {
    const updated = cartItems.filter((i) => i.cartKey !== cartKey)
    saveCart(updated)
    showToast('Item removed from cart', 'error')
  }

  const updateQuantity = (cartKey, quantity) => {
    if (quantity < 1) {
      removeFromCart(cartKey)
      return
    }
    const updated = cartItems.map((i) =>
      i.cartKey === cartKey ? { ...i, quantity } : i
    )
    saveCart(updated)
  }

  const clearCart = () => {
    saveCart([])
  }

  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0)
  const cartTotal = cartItems.reduce((sum, i) => sum + (i.effectivePrice ?? i.price) * i.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartTotal,
        toast,
        showToast,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
