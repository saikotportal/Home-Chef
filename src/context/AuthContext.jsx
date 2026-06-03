import { createContext, useContext, useState, useEffect } from 'react'
import users from '../data/users.json'

const AuthContext = createContext(null)

// Generate a deterministic referral code from user id
function makeReferralCode(userId) {
  return 'HC' + userId.slice(-6).toUpperCase()
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedArea, setSelectedArea] = useState(null)
  const [showAreaModal, setShowAreaModal] = useState(false)
  const [wallet, setWallet] = useState(0)
  const [stamps, setStamps] = useState(0)
  const [isPro, setIsPro] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('hcm_user')
    const storedArea = localStorage.getItem('hcm_area')
    if (stored) {
      const user = JSON.parse(stored)
      setCurrentUser(user)
      if (user.role === 'customer' && !storedArea) {
        setShowAreaModal(true)
      }
      // Load loyalty stamps
      const storedStamps = localStorage.getItem(`hcm_stamps_${user.id}`)
      setStamps(storedStamps ? parseInt(storedStamps, 10) : 0)
      // Load Pro status
      setIsPro(localStorage.getItem(`hcm_pro_${user.id}`) === 'true')
    }
    if (storedArea) {
      setSelectedArea(JSON.parse(storedArea))
    }
    const storedWallet = localStorage.getItem('hcm_wallet')
    setWallet(storedWallet ? parseInt(storedWallet, 10) : 0)
    setLoading(false)
  }, [])

  const updateWallet = (amount) => {
    const newBal = Math.max(0, wallet + amount)
    setWallet(newBal)
    localStorage.setItem('hcm_wallet', String(newBal))
    return newBal
  }

  // Add a loyalty stamp (called after order placed)
  const addStamp = (userId) => {
    const key = `hcm_stamps_${userId}`
    const current = parseInt(localStorage.getItem(key) || '0', 10)
    const next = current + 1
    let reward = 0
    if (next >= 10) {
      // Every 10 stamps → ৳100 reward
      reward = 100
      const remaining = next % 10
      localStorage.setItem(key, String(remaining))
      setStamps(remaining)
      // Credit wallet
      const newBal = wallet + 100
      setWallet(newBal)
      localStorage.setItem('hcm_wallet', String(newBal))
    } else {
      localStorage.setItem(key, String(next))
      setStamps(next)
    }
    return reward // returns 100 if reward was triggered, else 0
  }

  // Toggle Pro subscription
  const togglePro = () => {
    if (!currentUser) return
    const key = `hcm_pro_${currentUser.id}`
    const next = !isPro
    setIsPro(next)
    localStorage.setItem(key, String(next))
    return next
  }

  // Apply a referral code entered by new user
  const applyReferral = (code) => {
    // Find the referrer by matching code to a user
    const referrer = users.find((u) => makeReferralCode(u.id) === code.toUpperCase())
    if (!referrer) return { success: false, message: 'Invalid referral code' }
    if (currentUser && referrer.id === currentUser.id) return { success: false, message: 'Cannot use your own code' }
    // Check not already used
    const usedKey = `hcm_ref_used_${currentUser?.id}`
    if (localStorage.getItem(usedKey)) return { success: false, message: 'You already used a referral code' }
    // Credit ৳50 to current user's wallet
    localStorage.setItem(usedKey, 'true')
    updateWallet(50)
    // Also credit referrer ৳50
    const refWalletKey = `hcm_ref_wallet_${referrer.id}`
    const refBal = parseInt(localStorage.getItem(refWalletKey) || '0', 10) + 50
    localStorage.setItem(refWalletKey, String(refBal))
    return { success: true }
  }

  const getReferralCode = () => currentUser ? makeReferralCode(currentUser.id) : null

  const login = (email, password) => {
    const user = users.find((u) => u.email === email && u.password === password)
    if (user) {
      const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar }
      localStorage.setItem('hcm_user', JSON.stringify(safeUser))
      setCurrentUser(safeUser)
      const storedArea = localStorage.getItem('hcm_area')
      if (safeUser.role === 'customer' && !storedArea) setShowAreaModal(true)
      const storedWallet = localStorage.getItem('hcm_wallet')
      setWallet(storedWallet ? parseInt(storedWallet, 10) : 0)
      const storedStamps = localStorage.getItem(`hcm_stamps_${safeUser.id}`)
      setStamps(storedStamps ? parseInt(storedStamps, 10) : 0)
      setIsPro(localStorage.getItem(`hcm_pro_${safeUser.id}`) === 'true')
      return { success: true, user: safeUser }
    }
    return { success: false, message: 'Invalid email or password' }
  }

  const loginAsDemo = (role) => {
    const demoMap = {
      chef: 'rashida@chef.com',
      customer: 'rifat@customer.com',
      rider: 'rakib@rider.com',
    }
    const user = users.find((u) => u.email === demoMap[role])
    if (user) {
      const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar }
      localStorage.setItem('hcm_user', JSON.stringify(safeUser))
      setCurrentUser(safeUser)
      const storedArea = localStorage.getItem('hcm_area')
      if (safeUser.role === 'customer' && !storedArea) setShowAreaModal(true)
      if (!localStorage.getItem('hcm_wallet')) {
        localStorage.setItem('hcm_wallet', '250')
        setWallet(250)
      } else {
        setWallet(parseInt(localStorage.getItem('hcm_wallet'), 10))
      }
      const storedStamps = localStorage.getItem(`hcm_stamps_${safeUser.id}`)
      setStamps(storedStamps ? parseInt(storedStamps, 10) : 0)
      setIsPro(localStorage.getItem(`hcm_pro_${safeUser.id}`) === 'true')
      return { success: true, user: safeUser }
    }
  }

  const logout = () => {
    localStorage.removeItem('hcm_user')
    localStorage.removeItem('hcm_area')
    setCurrentUser(null)
    setSelectedArea(null)
    setShowAreaModal(false)
    setStamps(0)
    setIsPro(false)
  }

  const confirmArea = (area) => {
    localStorage.setItem('hcm_area', JSON.stringify(area))
    setSelectedArea(area)
    setShowAreaModal(false)
  }

  const changeArea = () => setShowAreaModal(true)

  return (
    <AuthContext.Provider value={{
      currentUser,
      loading,
      selectedArea,
      showAreaModal,
      wallet,
      stamps,
      isPro,
      updateWallet,
      addStamp,
      togglePro,
      applyReferral,
      getReferralCode,
      login,
      loginAsDemo,
      logout,
      confirmArea,
      changeArea,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
