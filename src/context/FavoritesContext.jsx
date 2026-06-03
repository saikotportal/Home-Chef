import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'

const FavoritesContext = createContext(null)

export function FavoritesProvider({ children }) {
  const { currentUser } = useAuth()

  const storageKey = currentUser ? `hcm_favs_${currentUser.id}` : null

  const [favorites, setFavorites] = useState({ meals: [], chefs: [] })

  // Load from localStorage when user changes
  useEffect(() => {
    if (!storageKey) { setFavorites({ meals: [], chefs: [] }); return }
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || '{}')
      setFavorites({ meals: stored.meals || [], chefs: stored.chefs || [] })
    } catch {
      setFavorites({ meals: [], chefs: [] })
    }
  }, [storageKey])

  const save = (updated) => {
    setFavorites(updated)
    if (storageKey) localStorage.setItem(storageKey, JSON.stringify(updated))
  }

  const toggleMeal = useCallback((mealId) => {
    setFavorites((prev) => {
      const exists = prev.meals.includes(mealId)
      const updated = {
        ...prev,
        meals: exists ? prev.meals.filter((id) => id !== mealId) : [...prev.meals, mealId],
      }
      if (storageKey) localStorage.setItem(storageKey, JSON.stringify(updated))
      return updated
    })
  }, [storageKey])

  const toggleChef = useCallback((chefId) => {
    setFavorites((prev) => {
      const exists = prev.chefs.includes(chefId)
      const updated = {
        ...prev,
        chefs: exists ? prev.chefs.filter((id) => id !== chefId) : [...prev.chefs, chefId],
      }
      if (storageKey) localStorage.setItem(storageKey, JSON.stringify(updated))
      return updated
    })
  }, [storageKey])

  const isMealFaved = useCallback((mealId) => favorites.meals.includes(mealId), [favorites.meals])
  const isChefFaved = useCallback((chefId) => favorites.chefs.includes(chefId), [favorites.chefs])

  return (
    <FavoritesContext.Provider value={{ favorites, toggleMeal, toggleChef, isMealFaved, isChefFaved }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavorites must be used inside FavoritesProvider')
  return ctx
}
