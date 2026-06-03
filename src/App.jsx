import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { useFaviconByRole } from './hooks/useFaviconByRole'
import { CartProvider } from './context/CartContext'
import { FavoritesProvider } from './context/FavoritesContext'

import Navbar from './components/Navbar'
import Footer from './components/Footer'
import AreaModal from './components/AreaModal'

import Login from './pages/Login'
import Home from './pages/Home'
import Listings from './pages/Listings'
import ChefProfile from './pages/ChefProfile'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderTracker from './pages/OrderTracker'
import ChefDashboard from './pages/ChefDashboard'
import RiderDashboard from './pages/RiderDashboard'
import Chefs from './pages/Chefs'
import Profile from './pages/Profile'
import Search from './pages/Search'
import OrderHistory from './pages/OrderHistory'
import Notifications from './pages/Notifications'
import Reviews from './pages/Reviews'
import BecomeAChef from './pages/BecomeAChef'
import AdminMapView from './pages/AdminMapView'
import About from './pages/About'

function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <svg className="w-8 h-8 animate-spin text-brand" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    )
  }

  if (!currentUser) return <Navigate to="/login" replace />

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    if (currentUser.role === 'chef') return <Navigate to="/chef-dashboard" replace />
    if (currentUser.role === 'rider') return <Navigate to="/rider-dashboard" replace />
    return <Navigate to="/" replace />
  }

  return children
}

function AppLayout() {
  const location = useLocation()
  const { showAreaModal, confirmArea, currentUser } = useAuth()
  const isLoginPage = location.pathname === '/login'

  // Swap favicon + tab title based on logged-in role
  useFaviconByRole(currentUser?.role ?? null)

  return (
    <div className="min-h-screen flex flex-col">
      {!isLoginPage && <Navbar />}

      {showAreaModal && <AreaModal onSelect={confirmArea} />}

      <main className="flex-1">
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/become-a-chef" element={<BecomeAChef />} />
          <Route path="/about" element={<About />} />

          {/* Customer + Chef routes */}
          <Route path="/" element={
            <ProtectedRoute allowedRoles={['customer', 'chef']}>
              <Home />
            </ProtectedRoute>
          } />
          <Route path="/listings" element={
            <ProtectedRoute allowedRoles={['customer', 'chef']}>
              <Listings />
            </ProtectedRoute>
          } />
          <Route path="/chefs" element={
            <ProtectedRoute allowedRoles={['customer', 'chef']}>
              <Chefs />
            </ProtectedRoute>
          } />
          <Route path="/chef/:id" element={
            <ProtectedRoute allowedRoles={['customer', 'chef']}>
              <ChefProfile />
            </ProtectedRoute>
          } />
          <Route path="/cart" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <Cart />
            </ProtectedRoute>
          } />
          <Route path="/checkout" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <Checkout />
            </ProtectedRoute>
          } />
          <Route path="/order-tracker/:id" element={
            <ProtectedRoute allowedRoles={['customer', 'chef', 'rider']}>
              <OrderTracker />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute allowedRoles={['customer', 'chef', 'rider']}>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/search" element={
            <ProtectedRoute allowedRoles={['customer', 'chef']}>
              <Search />
            </ProtectedRoute>
          } />
          <Route path="/orders" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <OrderHistory />
            </ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          } />
          <Route path="/reviews" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <Reviews />
            </ProtectedRoute>
          } />

          {/* Chef routes */}
          <Route path="/chef-dashboard" element={
            <ProtectedRoute allowedRoles={['chef']}>
              <ChefDashboard />
            </ProtectedRoute>
          } />

          {/* Rider routes */}
          <Route path="/rider-dashboard" element={
            <ProtectedRoute allowedRoles={['rider']}>
              <RiderDashboard />
            </ProtectedRoute>
          } />

          {/* Admin */}
          <Route path="/admin/map" element={
            <ProtectedRoute allowedRoles={['chef', 'rider', 'customer']}>
              <AdminMapView />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!isLoginPage && <Footer />}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <FavoritesProvider>
          <AppLayout />
        </FavoritesProvider>
      </CartProvider>
    </AuthProvider>
  )
}
