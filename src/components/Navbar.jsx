import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

function useUnreadCount(userId) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!userId) return
    const refresh = () => {
      try {
        const key = `hcm_notifications_${userId}`
        const stored = JSON.parse(localStorage.getItem(key) || '[]')
        setCount(stored.filter((n) => !n.read).length)
      } catch { setCount(0) }
    }
    refresh()
    const id = setInterval(refresh, 3000)
    return () => clearInterval(id)
  }, [userId])
  return count
}

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    return localStorage.getItem('hcm_darkmode') === 'true'
  })

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('hcm_darkmode', String(dark))
  }, [dark])

  return [dark, () => setDark((d) => !d)]
}

export default function Navbar() {
  const { currentUser, logout, selectedArea, changeArea } = useAuth()
  const { cartCount } = useCart()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const unreadCount = useUnreadCount(currentUser?.id)
  const [dark, toggleDark] = useDarkMode()

  const handleLogout = () => {
    logout()
    navigate('/login')
    setDropdownOpen(false)
  }

  const navLinks = () => {
    if (!currentUser) return []
    if (currentUser.role === 'customer') return [
      { label: 'Home', path: '/' },
      { label: 'Chefs', path: '/chefs' },
      { label: 'Browse Meals', path: '/listings' },
      { label: 'My Orders', path: '/orders' },
      { label: '🗺️ Live Map', path: '/admin/map' },
    ]
    if (currentUser.role === 'chef') return [
      { label: 'Home', path: '/' },
      { label: 'My Dashboard', path: '/chef-dashboard' },
      { label: '🗺️ Live Map', path: '/admin/map' },
    ]
    if (currentUser.role === 'rider') return [
      { label: 'My Deliveries', path: '/rider-dashboard' },
    ]
    return []
  }

  const roleBadgeColor = {
    chef: 'bg-green-100 text-green-700',
    customer: 'bg-blue-100 text-blue-700',
    rider: 'bg-purple-100 text-purple-700',
  }

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50 shadow-sm transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-dark dark:text-white">
            <span className="text-2xl">🍳</span>
            <span>Home<span className="text-brand">Chef</span></span>
          </Link>

          {/* Area selector chip — customers only */}
          {currentUser?.role === 'customer' && (
            <button
              onClick={changeArea}
              className="hidden sm:flex items-center gap-1.5 bg-orange-50 dark:bg-orange-900/30 hover:bg-orange-100 border border-orange-200 dark:border-orange-800 text-dark dark:text-orange-200 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors max-w-[160px]"
            >
              <span className="text-brand">📍</span>
              <span className="truncate">{selectedArea ? selectedArea.name : 'Set area'}</span>
              <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks().map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors ${
                  location.pathname === link.path
                    ? 'text-brand'
                    : 'text-gray-600 dark:text-gray-300 hover:text-brand'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">

            {/* Dark mode toggle */}
            <button
              onClick={toggleDark}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={dark ? 'Light mode' : 'Dark mode'}
              aria-label="Toggle dark mode"
            >
              {dark
                ? <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V4a1 1 0 0 1 1-1zm0 15a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1zm9-9a1 1 0 1 1 0 2h-1a1 1 0 1 1 0-2h1zM4 12a1 1 0 1 1 0 2H3a1 1 0 1 1 0-2h1zm14.657-6.243a1 1 0 0 1 0 1.414l-.707.707a1 1 0 1 1-1.414-1.414l.707-.707a1 1 0 0 1 1.414 0zM7.464 17.536a1 1 0 0 1 0 1.414l-.707.707a1 1 0 1 1-1.414-1.414l.707-.707a1 1 0 0 1 1.414 0zm11.9 1.414a1 1 0 0 1-1.414 0l-.707-.707a1 1 0 1 1 1.414-1.414l.707.707a1 1 0 0 1 0 1.414zM6.343 6.343a1 1 0 0 1-1.414 0l-.707-.707A1 1 0 0 1 5.636 4.22l.707.707a1 1 0 0 1 0 1.414zM12 7a5 5 0 1 0 0 10A5 5 0 0 0 12 7z"/></svg>
                : <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"/></svg>
              }
            </button>

            {/* Search icon */}
            {(currentUser?.role === 'customer' || currentUser?.role === 'chef') && (
              <Link to="/search" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Search">
                <svg className="w-5 h-5 text-dark dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
              </Link>
            )}

            {/* Notifications bell */}
            {currentUser && (
              <Link to="/notifications" className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Notifications">
                <svg className="w-5 h-5 text-dark dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-brand text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            )}

            {/* Cart — only for customers */}
            {currentUser?.role === 'customer' && (
              <Link to="/cart" className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <svg className="w-6 h-6 text-dark dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-brand text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            {/* User Menu */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <img src={currentUser.avatar} alt={currentUser.name} className="w-8 h-8 rounded-full bg-gray-200" />
                  <span className="hidden md:block text-sm font-medium text-dark dark:text-gray-200 max-w-[100px] truncate">
                    {currentUser.name.split(' ')[0]}
                  </span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 py-2 animate-fade-in z-50">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-sm font-semibold text-dark dark:text-white">{currentUser.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{currentUser.email}</p>
                      <span className={`badge mt-1.5 ${roleBadgeColor[currentUser.role]}`}>{currentUser.role}</span>
                    </div>
                    <Link to="/profile" onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2.5 text-sm text-dark dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      My Profile
                    </Link>

                    {/* Rider-specific menu items */}
                    {currentUser?.role === 'rider' && (
                      <>
                        <div className="mx-3 my-1.5 border-t border-gray-100 dark:border-gray-700" />
                        <p className="px-4 pt-1 pb-0.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Rider</p>
                        <button
                          onClick={() => { navigate('/rider-dashboard?panel=profile'); setDropdownOpen(false) }}
                          className="w-full text-left px-4 py-2.5 text-sm text-dark dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A9 9 0 1112 21a9 9 0 01-6.879-3.196z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                          Rider Profile
                        </button>
                        <button
                          onClick={() => { navigate('/rider-dashboard?panel=earnings'); setDropdownOpen(false) }}
                          className="w-full text-left px-4 py-2.5 text-sm text-dark dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                          Earnings
                        </button>
                        <button
                          onClick={() => { navigate('/rider-dashboard?panel=ratings'); setDropdownOpen(false) }}
                          className="w-full text-left px-4 py-2.5 text-sm text-dark dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
                          My Ratings
                        </button>
                        <div className="mx-3 my-1.5 border-t border-gray-100 dark:border-gray-700" />
                      </>
                    )}

                    {currentUser?.role === 'customer' && (
                      <>
                        <Link to="/orders" onClick={() => setDropdownOpen(false)}
                          className="block px-4 py-2.5 text-sm text-dark dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                          Order History
                        </Link>
                        <Link to="/reviews" onClick={() => setDropdownOpen(false)}
                          className="block px-4 py-2.5 text-sm text-dark dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                          My Reviews
                        </Link>
                      </>
                    )}
                    <button onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn-primary text-sm py-2 px-4">Login</Link>
            )}

            {/* Mobile Hamburger */}
            <button className="md:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => setMenuOpen(!menuOpen)}>
              <svg className="w-5 h-5 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 dark:border-gray-800 py-3 space-y-1 animate-fade-in">
            {navLinks().map((link) => (
              <Link key={link.path} to={link.path} onClick={() => setMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  location.pathname === link.path
                    ? 'bg-orange-50 text-brand'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}>
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Close dropdown on outside click */}
      {dropdownOpen && <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />}
    </nav>
  )
}
